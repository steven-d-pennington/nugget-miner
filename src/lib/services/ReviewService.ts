import { ProviderError } from '@/lib/errors';
import { cloudExtractionProvider } from '@/lib/providers/extraction/cloudProvider';
import { mockExtractionProvider } from '@/lib/providers/extraction/mockProvider';
import { actionItemRepository, extractionRunRepository, ideaRepository, nuggetRepository, questionRepository, transcriptRepository } from '@/lib/repositories';
import { parseExtractionResult } from '@/lib/validation/extractionResult';
import type { ActionItem, ExtractionPreset, ExtractionRun, Nugget, Question } from '@/types';

export interface ReviewSnapshot {
  run: ExtractionRun;
  nuggets: Nugget[];
  questions: Question[];
  actions: ReturnType<typeof parseExtractionResult>['actions'];
}

export interface RunExtractionInput {
  ideaId: string;
  preset?: ExtractionPreset;
}

export interface RunCloudExtractionInput extends RunExtractionInput {
  requestConsent: () => Promise<boolean>;
}

function defaultPreset(preset?: ExtractionPreset): ExtractionPreset {
  return preset ?? 'general-thought';
}

async function persistExtractionOutput(
  ideaId: string,
  transcriptId: string,
  preset: ExtractionPreset,
  output: Awaited<ReturnType<typeof mockExtractionProvider.extract>>,
): Promise<ReviewSnapshot> {
  const run = await extractionRunRepository.create({
    ideaId,
    transcriptId,
    provider: output.provider,
    preset,
    promptVersion: output.promptVersion,
    result: output.result,
  });
  const [nuggets, questions] = await Promise.all([
    nuggetRepository.createMany(ideaId, run.id, output.result.nuggets),
    questionRepository.createMany(ideaId, run.id, output.result.questions),
  ]);
  await ideaRepository.updateStatus(ideaId, 'reviewed');
  return { run, nuggets, questions, actions: output.result.actions };
}

async function getTranscriptOrThrow(ideaId: string) {
  const transcript = await transcriptRepository.getByIdeaId(ideaId);
  if (!transcript) {
    throw new ProviderError('A transcript is required before extraction.');
  }
  return transcript;
}

export const ReviewService = {
  async runMockExtraction({ ideaId, preset }: RunExtractionInput): Promise<ReviewSnapshot> {
    const resolvedPreset = defaultPreset(preset);
    const transcript = await getTranscriptOrThrow(ideaId);

    await ideaRepository.updateStatus(ideaId, 'extracting');

    try {
      const output = await mockExtractionProvider.extract({
        ideaId,
        transcript,
        context: { preset: resolvedPreset },
      });
      return await persistExtractionOutput(ideaId, transcript.id, resolvedPreset, output);
    } catch (error) {
      await ideaRepository.updateStatus(ideaId, 'failed');
      throw error;
    }
  },

  async runCloudExtraction({ ideaId, preset, requestConsent }: RunCloudExtractionInput): Promise<ReviewSnapshot> {
    const resolvedPreset = defaultPreset(preset);
    const transcript = await getTranscriptOrThrow(ideaId);

    await ideaRepository.updateStatus(ideaId, 'extracting');

    try {
      const output = await cloudExtractionProvider.extract({
        ideaId,
        transcript,
        context: { preset: resolvedPreset },
        requestConsent,
      });
      return await persistExtractionOutput(ideaId, transcript.id, resolvedPreset, output);
    } catch (error) {
      await ideaRepository.updateStatus(ideaId, 'failed');
      throw error;
    }
  },

  async latestSnapshot(ideaId: string): Promise<ReviewSnapshot | undefined> {
    const run = await extractionRunRepository.latestForIdea(ideaId);
    if (!run) return undefined;
    const result = parseExtractionResult(JSON.parse(run.rawJson));
    const [nuggets, questions] = await Promise.all([
      nuggetRepository.listByRun(run.id),
      questionRepository.listByRun(run.id),
    ]);
    return { run, nuggets, questions, actions: result.actions };
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

  async acceptAction(runId: string, actionIndex: number, edits?: Partial<Pick<ActionItem, 'title' | 'description' | 'priority' | 'dueDate'>>): Promise<ActionItem> {
    const run = await extractionRunRepository.getById(runId);
    if (!run) throw new ProviderError('Extraction run not found.');
    const result = parseExtractionResult(JSON.parse(run.rawJson));
    const suggestion = result.actions[actionIndex];
    if (!suggestion) throw new ProviderError('Action suggestion not found.');
    const action = await actionItemRepository.createFromSuggestion({ ideaId: run.ideaId, extractionRunId: run.id, suggestion, edits });
    await ideaRepository.incrementActionCount(run.ideaId);
    return action;
  },
};
