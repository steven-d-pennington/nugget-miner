import { db } from '@/lib/db';
import type { ExtractionNuggetSuggestion, LegacyItemStatus, Nugget } from '@/types';

function now() {
  return Date.now();
}

export const nuggetRepository = {
  async createMany(
    captureSessionId: string,
    extractionRunId: string,
    suggestions: ExtractionNuggetSuggestion[],
  ): Promise<Nugget[]> {
    const timestamp = now();
    const nuggets: Nugget[] = suggestions.map((suggestion) => ({
      id: crypto.randomUUID(),
      captureSessionId,
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

  async update(
    id: string,
    patch: Partial<Pick<Nugget, 'title' | 'detail' | 'category' | 'status'>>,
  ): Promise<void> {
    await db.nuggets.update(id, { ...patch, updatedAt: now() });
  },

  async updateStatus(id: string, status: LegacyItemStatus): Promise<void> {
    await this.update(id, { status });
  },
};
