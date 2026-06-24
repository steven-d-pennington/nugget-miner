import { ProviderError } from '@/lib/errors';
import { mockExtractionPromptVersion, mockExtractionProvider } from '@/lib/providers/extraction/mockProvider';
import { actionItemRepository, extractionRunRepository, ideaRepository, nuggetRepository, questionRepository, transcriptRepository } from '@/lib/repositories';
import { parseExtractionResult } from '@/lib/validation/extractionResult';
import type { ActionItem, ExtractionPreset, ExtractionRun, Nugget, Question } from '@/types';

export interface ReviewSnapshot {
  run: ExtractionRun;
  nuggets: Nugget[];
  questions: Question[];
  actions: ReturnType<typeof parseExtractionResult>['actions'];
}

export interface RunMockExtractionInput {
  ideaId: string;
  preset?: ExtractionPreset;
}

function defaultPreset(preset?: ExtractionPreset): ExtractionPreset {
  return preset ?? 'general-thought';
}

export const ReviewService = {
  async runMockExtraction({ ideaId, preset }: RunMockExtractionInput): Promise<ReviewSnapshot> {
    const transcript = await transcriptRepository.getByIdeaId(ideaId);
    if (!transcript) {
      throw new ProviderError('A transcript is required before extraction.');
    }

    await ideaRepository.updateStatus(ideaId, 'extracting');

    try {
      const result = await mockExtractionProvider.extract({
        ideaId,
        transcript,
        context: { preset: defaultPreset(preset) },
      });
      const run = await extractionRunRepository.create({
        ideaId,
        transcriptId: transcript.id,
        provider: mockExtractionProvider.id,
        preset: defaultPreset(preset),
        promptVersion: mockExtractionPromptVersion,
        result,
      });
      const [nuggets, questions] = await Promise.all([
        nuggetRepository.createMany(ideaId, run.id, result.nuggets),
        questionRepository.createMany(ideaId, run.id, result.questions),
      ]);
      await ideaRepository.updateStatus(ideaId, 'reviewed');
      return { run, nuggets, questions, actions: result.actions };
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
