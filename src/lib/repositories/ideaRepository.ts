import { db } from '@/lib/db';
import { StorageError, ValidationError } from '@/lib/errors';
import type { GroundedText, Idea } from '@/types';

export interface ConfirmIdeaInput {
  title: string;
  summary: GroundedText;
  purpose?: GroundedText;
  goals: GroundedText[];
  problem?: Idea['problem'];
  blockers: GroundedText[];
  questions: GroundedText[];
  suggestedActions: GroundedText[];
  research: Idea['research'];
  categoryId: string;
  tagIds: string[];
}

function groundedValues(input: ConfirmIdeaInput): GroundedText[] {
  return [
    input.summary,
    ...(input.purpose ? [input.purpose] : []),
    ...input.goals,
    ...(input.problem ? [input.problem.statement] : []),
    ...input.blockers,
    ...input.questions,
    ...input.suggestedActions,
    ...(input.research.assessment ? [input.research.assessment] : []),
  ];
}

function validateExplicitGrounding(idea: Idea, input: ConfirmIdeaInput) {
  const spans = new Map(idea.sourceSpans.map((span) => [span.id, span]));
  for (const grounded of groundedValues(input)) {
    if (grounded.basis !== 'explicit') continue;
    if (grounded.sourceSpanIds.length === 0) {
      throw new ValidationError('Explicit content must reference source evidence.');
    }
    for (const sourceSpanId of grounded.sourceSpanIds) {
      const span = spans.get(sourceSpanId);
      if (!span || span.startChar < 0 || span.endChar <= span.startChar || span.quote.trim().length === 0) {
        throw new ValidationError('Explicit content references invalid source evidence.');
      }
    }
  }
}

export const ideaRepository = {
  async addDrafts(ideas: Idea[]): Promise<void> {
    try {
      await db.ideas.bulkAdd(ideas);
    } catch (error) {
      throw new StorageError(error instanceof Error ? error.message : undefined);
    }
  },

  async getById(id: string): Promise<Idea | undefined> {
    return db.ideas.get(id);
  },

  async listDraftsByCapture(captureSessionId: string): Promise<Idea[]> {
    return db.ideas
      .where('captureSessionId')
      .equals(captureSessionId)
      .filter((idea) => idea.status === 'draft')
      .sortBy('createdAt');
  },

  async listByCapture(captureSessionId: string): Promise<Idea[]> {
    return db.ideas.where('captureSessionId').equals(captureSessionId).sortBy('createdAt');
  },

  async replaceDraftsForTranscript(
    captureSessionId: string,
    transcriptHash: string,
    ideas: Idea[],
  ): Promise<void> {
    try {
      await db.transaction('rw', db.ideas, db.extractionRuns, async () => {
        const [drafts, runs, incomingRows] = await Promise.all([
          db.ideas
            .where('captureSessionId')
            .equals(captureSessionId)
            .filter((idea) => idea.status === 'draft')
            .toArray(),
          db.extractionRuns.where('captureSessionId').equals(captureSessionId).toArray(),
          db.ideas.bulkGet(ideas.map((idea) => idea.id)),
        ]);
        const matchingRunIds = new Set(
          runs.filter((run) => run.transcriptHash === transcriptHash).map((run) => run.id),
        );
        const replacedIds = drafts
          .filter((idea) => idea.extractionRunId && matchingRunIds.has(idea.extractionRunId))
          .map((idea) => idea.id);
        const preservedIds = new Set(
          incomingRows
            .filter((idea): idea is Idea => idea !== undefined && idea.status !== 'draft')
            .map((idea) => idea.id),
        );
        const draftsToAdd = ideas.filter((idea) => !preservedIds.has(idea.id));

        if (replacedIds.length > 0) await db.ideas.bulkDelete(replacedIds);
        if (draftsToAdd.length > 0) await db.ideas.bulkAdd(draftsToAdd);
      });
    } catch (error) {
      throw new StorageError(error instanceof Error ? error.message : undefined);
    }
  },

  async listConfirmed(): Promise<Idea[]> {
    return db.ideas
      .where('status')
      .equals('confirmed')
      .sortBy('updatedAt')
      .then((ideas) => ideas.reverse());
  },

  async confirm(id: string, input: ConfirmIdeaInput): Promise<Idea> {
    return db.transaction('rw', db.ideas, db.categories, db.captureSessions, async () => {
      const [idea, category] = await Promise.all([db.ideas.get(id), db.categories.get(input.categoryId)]);
      if (!idea) throw new ValidationError('Idea not found.');
      if (!category) throw new ValidationError('Category not found.');
      validateExplicitGrounding(idea, input);

      const timestamp = Date.now();
      const confirmed: Idea = {
        ...idea,
        ...input,
        status: 'confirmed',
        confirmedAt: timestamp,
        updatedAt: timestamp,
      };
      await db.ideas.put(confirmed);

      const remainingDrafts = await db.ideas
        .where('captureSessionId')
        .equals(idea.captureSessionId)
        .filter((candidate) => candidate.status === 'draft')
        .count();
      await db.captureSessions.update(idea.captureSessionId, {
        processingState: remainingDrafts > 0 ? 'partially_confirmed' : 'confirmed',
        updatedAt: timestamp,
      });
      return confirmed;
    });
  },

  async discardDraft(id: string): Promise<void> {
    const idea = await db.ideas.get(id);
    if (!idea) return;
    if (idea.status !== 'draft') throw new ValidationError('Only draft ideas may be discarded.');
    await db.ideas.delete(id);
  },

  async archive(id: string): Promise<void> {
    await db.ideas.update(id, { status: 'archived', updatedAt: Date.now() });
  },
};
