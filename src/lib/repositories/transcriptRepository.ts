import { db } from '@/lib/db';
import { StorageError } from '@/lib/errors';
import type { Transcript, TranscriptResult } from '@/types';

export const transcriptRepository = {
  async upsert(ideaId: string, result: TranscriptResult): Promise<Transcript> {
    try {
      const existing = await this.getByIdeaId(ideaId);
      const timestamp = Date.now();
      const transcript: Transcript = {
        id: existing?.id ?? crypto.randomUUID(),
        ideaId,
        text: result.text,
        segments: result.segments,
        language: result.language,
        confidence: result.confidence,
        provider: result.provider,
        edited: existing?.edited ?? false,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };
      await db.transcripts.put(transcript);
      return transcript;
    } catch (error) {
      throw new StorageError(error instanceof Error ? error.message : undefined);
    }
  },

  async getByIdeaId(ideaId: string): Promise<Transcript | undefined> {
    return db.transcripts.where('ideaId').equals(ideaId).first();
  },

  async updateText(ideaId: string, text: string): Promise<void> {
    const existing = await this.getByIdeaId(ideaId);
    if (!existing) return;
    await db.transcripts.update(existing.id, { text, edited: true, updatedAt: Date.now() });
  },
};
