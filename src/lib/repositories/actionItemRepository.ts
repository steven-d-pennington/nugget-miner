import { db } from '@/lib/db';
import type { ActionItem, ExtractionActionSuggestion } from '@/types';

export interface CreateActionItemFromSuggestionInput {
  ideaId: string;
  extractionRunId: string;
  suggestion: ExtractionActionSuggestion;
  edits?: Partial<Pick<ActionItem, 'title' | 'description' | 'priority' | 'dueDate'>>;
}

export const actionItemRepository = {
  async createFromSuggestion(input: CreateActionItemFromSuggestionInput): Promise<ActionItem> {
    const timestamp = Date.now();
    const item: ActionItem = {
      id: crypto.randomUUID(),
      ideaId: input.ideaId,
      extractionRunId: input.extractionRunId,
      title: input.edits?.title ?? input.suggestion.title,
      description: input.edits?.description ?? input.suggestion.description,
      status: 'open',
      priority: input.edits?.priority ?? input.suggestion.priority,
      dueDate: input.edits?.dueDate ?? input.suggestion.dueDate ?? undefined,
      tags: [],
      sourceSpan: input.suggestion.sourceSpan,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await db.actionItems.add(item);
    return item;
  },

  async listByIdea(ideaId: string): Promise<ActionItem[]> {
    return db.actionItems.where('ideaId').equals(ideaId).toArray();
  },
};
