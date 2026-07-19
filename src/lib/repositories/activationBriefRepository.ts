import { db } from '@/lib/db';
import { StorageError, ValidationError } from '@/lib/errors';
import type { ActivationBrief, ActivationIntent } from '@/types';

function activationBriefId(ideaId: string, intent: ActivationIntent) {
  return `${ideaId}:${intent}`;
}

export type SaveActivationBriefInput = Omit<ActivationBrief, 'id' | 'createdAt' | 'updatedAt'>;

export const activationBriefRepository = {
  async get(ideaId: string, intent: ActivationIntent): Promise<ActivationBrief | undefined> {
    return db.activationBriefs.get(activationBriefId(ideaId, intent));
  },

  async listByIdea(ideaId: string): Promise<ActivationBrief[]> {
    const briefs = await db.activationBriefs.where('ideaId').equals(ideaId).sortBy('updatedAt');
    return briefs.reverse();
  },

  async save(input: SaveActivationBriefInput): Promise<ActivationBrief> {
    const idea = await db.ideas.get(input.ideaId);
    if (!idea || (idea.status !== 'confirmed' && idea.status !== 'archived')) {
      throw new ValidationError('Only saved ideas can have activation briefs.');
    }

    const id = activationBriefId(input.ideaId, input.intent);
    const existing = await db.activationBriefs.get(id);
    const timestamp = Date.now();
    const brief: ActivationBrief = {
      ...input,
      id,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    try {
      await db.activationBriefs.put(brief);
      return brief;
    } catch (error) {
      throw new StorageError(error instanceof Error ? error.message : undefined);
    }
  },

  async updatePrompt(ideaId: string, intent: ActivationIntent, prompt: string): Promise<ActivationBrief> {
    const normalized = prompt.trim();
    if (!normalized) throw new ValidationError('Prompt is required.');
    const existing = await this.get(ideaId, intent);
    if (!existing) throw new ValidationError('Activation brief not found.');
    const updated = {
      ...existing,
      brief: { ...existing.brief, prompt: normalized },
      updatedAt: Date.now(),
    };
    await db.activationBriefs.put(updated);
    return updated;
  },
};
