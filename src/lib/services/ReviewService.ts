import { ProviderError } from '@/lib/errors';
import { cloudExtractionProvider } from '@/lib/providers/extraction/cloudProvider';
import { mockExtractionProvider } from '@/lib/providers/extraction/mockProvider';
import type { ExtractionProviderOutput } from '@/lib/providers/extraction/types';
import {
  actionItemRepository,
  captureRepository,
  categoryRepository,
  extractionRunRepository,
  ideaRepository,
  nuggetRepository,
  questionRepository,
  tagRepository,
  transcriptRepository,
  type ConfirmIdeaInput,
} from '@/lib/repositories';
import { EXTRACTION_SCHEMA_VERSION, parseExtractionResult } from '@/lib/validation/extractionResult';
import type {
  ActionItem,
  CaptureSession,
  Category,
  ExtractionPreset,
  ExtractionRun,
  Idea,
  Nugget,
  Question,
  Tag,
  Transcript,
} from '@/types';
import { ProcessingService } from './ProcessingService';
import { processingFingerprint } from './processingFingerprint';

export interface CanonicalReviewSnapshot {
  capture: CaptureSession;
  transcript: Transcript;
  ideas: Idea[];
  categories: Category[];
  tags: Tag[];
}

export interface ReviewProcessingService {
  enqueue(captureSessionId: string): Promise<void>;
  process(captureSessionId: string): Promise<void>;
}

export function createReviewService(processingService: ReviewProcessingService = ProcessingService) {
  return {
    async load(captureSessionId: string): Promise<CanonicalReviewSnapshot> {
      const capture = await captureRepository.getById(captureSessionId);
      if (!capture) throw new ProviderError('Capture not found.');
      const transcript = await transcriptRepository.getCurrent(captureSessionId);
      if (!transcript) throw new ProviderError('A transcript is required before review.');
      const [allIdeas, categories, runs] = await Promise.all([
        ideaRepository.listByCapture(captureSessionId),
        categoryRepository.ensureDefaults(),
        extractionRunRepository.listByCapture(captureSessionId),
      ]);
      const currentOrganizationRuns = runs.filter(
        (run) =>
          run.status === 'succeeded' &&
          run.stage === 'organizing' &&
          run.transcriptId === transcript.id,
      );
      const preferredRunId = currentOrganizationRuns.some(
        (run) => run.id === capture.activeExtractionRunId,
      )
        ? capture.activeExtractionRunId
        : currentOrganizationRuns.at(-1)?.id;
      const ideas = preferredRunId
        ? allIdeas.filter((idea) => idea.extractionRunId === preferredRunId)
        : allIdeas;
      const tagIds = [...new Set(ideas.flatMap((idea) => idea.tagIds))];
      const tags = await tagRepository.getByIds(tagIds);
      return { capture, transcript, ideas, categories, tags };
    },

    async confirm(
      ideaId: string,
      input: ConfirmIdeaInput,
      acceptedActionSuggestionIds: string[],
    ): Promise<Idea> {
      const idea = await ideaRepository.getById(ideaId);
      if (!idea) throw new ProviderError('Idea not found.');
      const originalSuggestionIds = new Set(idea.suggestedActions.map((suggestion) => suggestion.id));
      const submittedSuggestions = new Map(input.suggestedActions.map((suggestion) => [suggestion.id, suggestion]));
      const acceptedIds = [...new Set(acceptedActionSuggestionIds)];
      for (const suggestionId of acceptedIds) {
        if (!originalSuggestionIds.has(suggestionId) || !submittedSuggestions.has(suggestionId)) {
          throw new ProviderError('Accepted action suggestion was not part of this idea.');
        }
      }

      const confirmed = await ideaRepository.confirm(ideaId, input);
      for (const suggestionId of acceptedIds) {
        const suggestion = submittedSuggestions.get(suggestionId)!;
        await actionItemRepository.acceptSuggestion({
          ideaId,
          sourceSuggestionId: suggestionId,
          text: suggestion.text,
        });
      }
      return confirmed;
    },

    async discard(ideaId: string): Promise<void> {
      await ideaRepository.discardDraft(ideaId);
    },

    async reprocess(captureSessionId: string): Promise<void> {
      await processingService.enqueue(captureSessionId);
      await processingService.process(captureSessionId);
    },
  };
}

const canonicalReviewService = createReviewService();

export interface ReviewSnapshot {
  run: ExtractionRun;
  preset: ExtractionPreset;
  nuggets: Nugget[];
  questions: Question[];
  actions: ReturnType<typeof parseExtractionResult>['actions'];
}

export interface RunExtractionInput {
  captureSessionId: string;
  preset?: ExtractionPreset;
}

export interface RunCloudExtractionInput extends RunExtractionInput {
  requestConsent: () => Promise<boolean>;
}

function defaultPreset(preset?: ExtractionPreset): ExtractionPreset {
  return preset ?? 'general-thought';
}

function presetFromRun(run: ExtractionRun): ExtractionPreset {
  const candidate = run.segmentationPromptVersion.replace('legacy-preset:', '');
  if (candidate === 'product-idea' || candidate === 'work-reminder' || candidate === 'story-idea') return candidate;
  return 'general-thought';
}

async function snapshotForRun(run: ExtractionRun): Promise<ReviewSnapshot> {
  const result = parseExtractionResult(JSON.parse(run.rawJson));
  const [nuggets, questions] = await Promise.all([
    nuggetRepository.listByRun(run.id),
    questionRepository.listByRun(run.id),
  ]);
  return { run, preset: presetFromRun(run), nuggets, questions, actions: result.actions };
}

async function persistExtractionOutput(
  captureSessionId: string,
  transcript: Transcript,
  preset: ExtractionPreset,
  output: ExtractionProviderOutput,
): Promise<ReviewSnapshot> {
  const model = output.model ?? output.provider;
  const reasoningEffort = 'legacy';
  const segmentationPromptVersion = `legacy-preset:${preset}`;
  const idempotencyKey = processingFingerprint({
    captureSessionId,
    transcriptId: transcript.id,
    transcriptHash: transcript.contentHash,
    provider: output.provider,
    model,
    reasoningEffort,
    preset,
    segmentationPromptVersion,
    organizationPromptVersion: output.promptVersion,
    stage: 'organization',
    schemaVersion: EXTRACTION_SCHEMA_VERSION,
  });
  const run = await extractionRunRepository.start({
    captureSessionId,
    transcriptId: transcript.id,
    transcriptHash: transcript.contentHash,
    provider: output.provider,
    model,
    reasoningEffort,
    segmentationPromptVersion,
    organizationPromptVersion: output.promptVersion,
    schemaVersion: EXTRACTION_SCHEMA_VERSION,
    idempotencyKey,
    stage: 'organizing',
  });
  if (run.status === 'succeeded') {
    await captureRepository.transition(captureSessionId, 'ready_for_review', { activeExtractionRunId: run.id });
    return snapshotForRun(run);
  }

  const rawJson = JSON.stringify(output.result);
  try {
    const [nuggets, questions] = await Promise.all([
      nuggetRepository.createMany(captureSessionId, run.id, output.result.nuggets),
      questionRepository.createMany(captureSessionId, run.id, output.result.questions),
    ]);
    await extractionRunRepository.complete(run.id, rawJson, 0);
    await captureRepository.transition(captureSessionId, 'ready_for_review', { activeExtractionRunId: run.id });
    const completed = await extractionRunRepository.getById(run.id);
    if (!completed) throw new ProviderError('Completed extraction run not found.');
    return { run: completed, preset, nuggets, questions, actions: output.result.actions };
  } catch (error) {
    await extractionRunRepository.fail(run.id, 'legacy_persistence_failed', rawJson);
    throw error;
  }
}

async function getTranscriptOrThrow(captureSessionId: string) {
  const transcript = await transcriptRepository.getCurrent(captureSessionId);
  if (!transcript) throw new ProviderError('A transcript is required before extraction.');
  return transcript;
}

async function markFailed(captureSessionId: string, error: unknown) {
  await captureRepository.transition(captureSessionId, 'failed', {
    recoverableStage: 'organization',
    lastError: {
      stage: 'organization',
      code: 'legacy_extraction_failed',
      message: error instanceof Error ? error.message : 'Extraction failed.',
      retryable: true,
      occurredAt: Date.now(),
    },
  });
}

export const ReviewService = {
  ...canonicalReviewService,
  async runMockExtraction({ captureSessionId, preset }: RunExtractionInput): Promise<ReviewSnapshot> {
    const resolvedPreset = defaultPreset(preset);
    const transcript = await getTranscriptOrThrow(captureSessionId);
    await captureRepository.transition(captureSessionId, 'organizing');

    try {
      const output = await mockExtractionProvider.extract({
        ideaId: captureSessionId,
        transcript,
        context: { preset: resolvedPreset },
      });
      return await persistExtractionOutput(captureSessionId, transcript, resolvedPreset, output);
    } catch (error) {
      await markFailed(captureSessionId, error);
      throw error;
    }
  },

  async runCloudExtraction({
    captureSessionId,
    preset,
    requestConsent,
  }: RunCloudExtractionInput): Promise<ReviewSnapshot> {
    const resolvedPreset = defaultPreset(preset);
    const transcript = await getTranscriptOrThrow(captureSessionId);
    await captureRepository.transition(captureSessionId, 'organizing');

    try {
      const output = await cloudExtractionProvider.extract({
        ideaId: captureSessionId,
        transcript,
        context: { preset: resolvedPreset },
        requestConsent,
      });
      return await persistExtractionOutput(captureSessionId, transcript, resolvedPreset, output);
    } catch (error) {
      await markFailed(captureSessionId, error);
      throw error;
    }
  },

  async latestSnapshot(captureSessionId: string): Promise<ReviewSnapshot | undefined> {
    const runs = await extractionRunRepository.listByCapture(captureSessionId);
    const run = runs.filter((candidate) => candidate.status === 'succeeded').at(-1);
    return run ? snapshotForRun(run) : undefined;
  },

  async acceptNugget(id: string) {
    await nuggetRepository.updateStatus(id, 'accepted');
  },

  async rejectNugget(id: string) {
    await nuggetRepository.updateStatus(id, 'rejected');
  },

  async updateNugget(id: string, title: string, detail?: string) {
    await nuggetRepository.update(id, { title, detail });
  },

  async acceptQuestion(id: string) {
    await questionRepository.updateStatus(id, 'accepted');
  },

  async rejectQuestion(id: string) {
    await questionRepository.updateStatus(id, 'rejected');
  },

  async updateQuestion(id: string, text: string) {
    await questionRepository.update(id, { text });
  },

  async acceptAction(runId: string, actionIndex: number, text?: string): Promise<ActionItem> {
    const run = await extractionRunRepository.getById(runId);
    if (!run) throw new ProviderError('Extraction run not found.');
    const result = parseExtractionResult(JSON.parse(run.rawJson));
    const suggestion = result.actions[actionIndex];
    if (!suggestion) throw new ProviderError('Action suggestion not found.');
    return actionItemRepository.acceptSuggestion({
      ideaId: run.captureSessionId,
      sourceSuggestionId: `${run.id}:${actionIndex}`,
      text: text ?? suggestion.title,
    });
  },
};
