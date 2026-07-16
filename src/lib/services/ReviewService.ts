import { ProviderError } from '@/lib/errors';
import { cloudExtractionProvider } from '@/lib/providers/extraction/cloudProvider';
import { mockExtractionProvider } from '@/lib/providers/extraction/mockProvider';
import type { ExtractionProviderOutput } from '@/lib/providers/extraction/types';
import {
  actionItemRepository,
  captureRepository,
  extractionRunRepository,
  nuggetRepository,
  questionRepository,
  transcriptRepository,
} from '@/lib/repositories';
import { EXTRACTION_SCHEMA_VERSION, parseExtractionResult } from '@/lib/validation/extractionResult';
import type { ActionItem, ExtractionPreset, ExtractionRun, Nugget, Question, Transcript } from '@/types';

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
  const idempotencyKey = [captureSessionId, transcript.contentHash, 'organization', EXTRACTION_SCHEMA_VERSION].join(':');
  const run = await extractionRunRepository.start({
    captureSessionId,
    transcriptId: transcript.id,
    transcriptHash: transcript.contentHash,
    provider: output.provider,
    model: output.model ?? output.provider,
    reasoningEffort: 'legacy',
    segmentationPromptVersion: `legacy-preset:${preset}`,
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
  const [nuggets, questions] = await Promise.all([
    nuggetRepository.createMany(captureSessionId, run.id, output.result.nuggets),
    questionRepository.createMany(captureSessionId, run.id, output.result.questions),
  ]);
  await extractionRunRepository.complete(run.id, rawJson, 0);
  await captureRepository.transition(captureSessionId, 'ready_for_review', { activeExtractionRunId: run.id });
  const completed = await extractionRunRepository.getById(run.id);
  if (!completed) throw new ProviderError('Completed extraction run not found.');
  return { run: completed, preset, nuggets, questions, actions: output.result.actions };
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
