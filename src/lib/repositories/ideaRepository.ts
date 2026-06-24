import { db } from '@/lib/db';
import { StorageError } from '@/lib/errors';
import type { Idea, IdeaStatus } from '@/types';

function now() {
  return Date.now();
}

export function defaultIdeaTitle(createdAt = now()) {
  const formatted = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(createdAt);
  return `Idea — ${formatted}`;
}

export interface CreateIdeaInput {
  durationMs: number;
  title?: string;
  status?: IdeaStatus;
}

export const ideaRepository = {
  async create(input: CreateIdeaInput): Promise<Idea> {
    try {
      const createdAt = now();
      const idea: Idea = {
        id: crypto.randomUUID(),
        title: input.title ?? defaultIdeaTitle(createdAt),
        status: input.status ?? 'captured',
        sourceType: 'recording',
        tags: [],
        favorite: false,
        archived: false,
        durationMs: input.durationMs,
        actionCount: 0,
        createdAt,
        updatedAt: createdAt,
      };
      await db.ideas.add(idea);
      return idea;
    } catch (error) {
      throw new StorageError(error instanceof Error ? error.message : undefined);
    }
  },

  async getById(id: string): Promise<Idea | undefined> {
    return db.ideas.get(id);
  },

  async listByRecency(limit = 20): Promise<Idea[]> {
    return db.ideas.orderBy('createdAt').reverse().limit(limit).toArray();
  },

  async updateStatus(id: string, status: IdeaStatus): Promise<void> {
    await db.ideas.update(id, { status, updatedAt: now() });
  },

  async incrementActionCount(id: string): Promise<void> {
    const idea = await this.getById(id);
    if (!idea) return;
    await db.ideas.update(id, { actionCount: idea.actionCount + 1, updatedAt: now() });
  },
};
