import { db } from '@/lib/db';
import type { ExtractionNuggetSuggestion, ItemStatus, Nugget } from '@/types';

function now() {
  return Date.now();
}

export const nuggetRepository = {
  async createMany(ideaId: string, extractionRunId: string, suggestions: ExtractionNuggetSuggestion[]): Promise<Nugget[]> {
    const timestamp = now();
    const nuggets: Nugget[] = suggestions.map((suggestion) => ({
      id: crypto.randomUUID(),
      ideaId,
      extractionRunId,
      title: suggestion.title,
      detail: suggestion.detail,
      category: suggestion.category,
      confidence: suggestion.confidence,
      sourceSpan: suggestion.sourceSpan,
      status: 'pending',
      createdAt: timestamp,
      updatedAt: timestamp,
    }));
    await db.nuggets.bulkAdd(nuggets);
    return nuggets;
  },

  async listByRun(extractionRunId: string): Promise<Nugget[]> {
    return db.nuggets.where('extractionRunId').equals(extractionRunId).toArray();
  },

  async update(id: string, patch: Partial<Pick<Nugget, 'title' | 'detail' | 'category' | 'status'>>): Promise<void> {
    await db.nuggets.update(id, { ...patch, updatedAt: now() });
  },

  async updateStatus(id: string, status: ItemStatus): Promise<void> {
    await this.update(id, { status });
  },
};
