import { db } from '@/lib/db';
import type { ActionItem, ActionStatus } from '@/types';

export interface AcceptActionSuggestionInput {
  ideaId: string;
  sourceSuggestionId: string;
  text: string;
}

export const actionItemRepository = {
  async acceptSuggestion(input: AcceptActionSuggestionInput): Promise<ActionItem> {
    return db.transaction('rw', db.actionItems, async () => {
      const existing = await db.actionItems
        .where('[ideaId+sourceSuggestionId]')
        .equals([input.ideaId, input.sourceSuggestionId])
        .first();
      if (existing) return existing;

      const timestamp = Date.now();
      const item: ActionItem = {
        id: crypto.randomUUID(),
        ideaId: input.ideaId,
        sourceSuggestionId: input.sourceSuggestionId,
        text: input.text,
        status: 'open',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await db.actionItems.add(item);
      return item;
    });
  },

  async listByIdea(ideaId: string): Promise<ActionItem[]> {
    return db.actionItems.where('ideaId').equals(ideaId).toArray();
  },

  async setStatus(id: string, status: ActionStatus): Promise<void> {
    await db.actionItems.update(id, {
      status,
      updatedAt: Date.now(),
      completedAt: status === 'completed' ? Date.now() : undefined,
    });
  },
};
