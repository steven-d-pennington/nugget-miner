import { db } from '@/lib/db';
import type { ExtractionQuestionSuggestion, ItemStatus, Question } from '@/types';

function now() {
  return Date.now();
}

export const questionRepository = {
  async createMany(ideaId: string, extractionRunId: string, suggestions: ExtractionQuestionSuggestion[]): Promise<Question[]> {
    const timestamp = now();
    const questions: Question[] = suggestions.map((suggestion) => ({
      id: crypto.randomUUID(),
      ideaId,
      extractionRunId,
      text: suggestion.text,
      status: 'pending',
      sourceSpan: suggestion.sourceSpan,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));
    await db.questions.bulkAdd(questions);
    return questions;
  },

  async listByRun(extractionRunId: string): Promise<Question[]> {
    return db.questions.where('extractionRunId').equals(extractionRunId).toArray();
  },

  async update(id: string, patch: Partial<Pick<Question, 'text' | 'status'>>): Promise<void> {
    await db.questions.update(id, { ...patch, updatedAt: now() });
  },

  async updateStatus(id: string, status: ItemStatus): Promise<void> {
    await this.update(id, { status });
  },
};
