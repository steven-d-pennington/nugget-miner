import { db } from '@/lib/db';
import { ValidationError } from '@/lib/errors';
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

  async getById(id: string): Promise<ActionItem | undefined> {
    return db.actionItems.get(id);
  },

  async listByIdea(ideaId: string): Promise<ActionItem[]> {
    return db.actionItems.where('ideaId').equals(ideaId).toArray();
  },

  async listByStatus(status: ActionStatus): Promise<ActionItem[]> {
    return db.actionItems.where('status').equals(status).toArray();
  },

  async setStatus(id: string, status: ActionStatus): Promise<void> {
    await db.transaction('rw', db.actionItems, async () => {
      const item = await db.actionItems.get(id);
      if (!item) return;

      const timestamp = Date.now();
      const updated: ActionItem = {
        ...item,
        status,
        updatedAt: timestamp,
        ...(status === 'completed' ? { completedAt: timestamp } : {}),
      };
      if (status === 'open') delete updated.completedAt;
      await db.actionItems.put(updated);
    });
  },

  async updateText(id: string, value: string): Promise<void> {
    const text = value.trim();
    if (!text) throw new ValidationError('Action text is required.');

    await db.transaction('rw', db.actionItems, async () => {
      const item = await db.actionItems.get(id);
      if (!item) throw new ValidationError('Action not found.');
      await db.actionItems.put({ ...item, text, updatedAt: Date.now() });
    });
  },

  async remove(id: string): Promise<void> {
    await db.actionItems.delete(id);
  },
};
