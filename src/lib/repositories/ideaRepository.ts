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

export interface UpdateIdeaInput extends ConfirmIdeaInput {
  status?: 'confirmed' | 'archived';
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

function isLibraryStatus(status: unknown): status is 'confirmed' | 'archived' {
  return status === 'confirmed' || status === 'archived';
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

  async listConfirmed(includeArchived = false): Promise<Idea[]> {
    const statuses: Idea['status'][] = includeArchived ? ['confirmed', 'archived'] : ['confirmed'];
    return db.ideas
      .where('status')
      .anyOf(statuses)
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

  async update(id: string, input: UpdateIdeaInput): Promise<Idea> {
    return db.transaction('rw', db.ideas, db.categories, async () => {
      const idea = await db.ideas.get(id);
      if (!idea) throw new ValidationError('Idea not found.');
      if (!isLibraryStatus(idea.status) || (input.status !== undefined && !isLibraryStatus(input.status))) {
        throw new ValidationError('Only confirmed or archived ideas may be updated.');
      }
      const category = await db.categories.get(input.categoryId);
      if (!category) throw new ValidationError('Category not found.');
      validateExplicitGrounding(idea, input);

      const updated: Idea = {
        ...idea,
        title: input.title,
        summary: input.summary,
        purpose: input.purpose,
        goals: input.goals,
        problem: input.problem,
        blockers: input.blockers,
        questions: input.questions,
        suggestedActions: input.suggestedActions,
        research: input.research,
        categoryId: input.categoryId,
        tagIds: input.tagIds,
        status: input.status ?? idea.status,
        updatedAt: Date.now(),
      };
      await db.ideas.put(updated);
      return updated;
    });
  },

  async setArchived(id: string, archived: boolean): Promise<void> {
    await db.transaction('rw', db.ideas, async () => {
      const idea = await db.ideas.get(id);
      if (!idea) throw new ValidationError('Idea not found.');
      if (!isLibraryStatus(idea.status)) {
        throw new ValidationError('Only confirmed or archived ideas may be archived or restored.');
      }
      await db.ideas.put({
        ...idea,
        status: archived ? 'archived' : 'confirmed',
        updatedAt: Date.now(),
      });
    });
  },

  async discardDraft(id: string): Promise<void> {
    await db.transaction('rw', db.ideas, db.captureSessions, async () => {
      const idea = await db.ideas.get(id);
      if (!idea) return;
      if (idea.status !== 'draft') {
        throw new ValidationError('Only draft ideas may be discarded.');
      }

      await db.ideas.delete(id);
      const siblings = await db.ideas
        .where('captureSessionId')
        .equals(idea.captureSessionId)
        .toArray();
      const hasDrafts = siblings.some((candidate) => candidate.status === 'draft');
      const hasConfirmed = siblings.some((candidate) => candidate.status === 'confirmed');
      const processingState = hasDrafts
        ? hasConfirmed
          ? 'partially_confirmed'
          : 'ready_for_review'
        : 'confirmed';
      const updated = await db.captureSessions.update(idea.captureSessionId, {
        processingState,
        updatedAt: Date.now(),
      });
      if (updated !== 1) {
        throw new ValidationError('Parent capture not found.');
      }
    });
  },

  async archive(id: string): Promise<void> {
    await this.setArchived(id, true);
  },
};
