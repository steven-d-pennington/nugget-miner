import Dexie from 'dexie';
import { sha256Text } from '@/lib/crypto/contentHash';
import { db } from '@/lib/db';
import { StorageError, ValidationError } from '@/lib/errors';
import type { Transcript, TranscriptResult } from '@/types';

async function hashForDexieTransaction(text: string) {
  return Dexie.waitFor(sha256Text(text));
}

export const transcriptRepository = {
  async createVersion(captureSessionId: string, result: TranscriptResult): Promise<Transcript> {
    try {
      const versions = await this.listVersions(captureSessionId);
      const previous = versions.at(-1);
      const timestamp = Date.now();
      const transcript: Transcript = {
        id: crypto.randomUUID(),
        captureSessionId,
        version: (previous?.version ?? 0) + 1,
        text: result.text,
        segments: result.segments,
        language: result.language,
        confidence: result.confidence,
        provider: result.provider,
        model: result.model,
        source: result.provider === 'typed' ? 'typed' : 'transcription',
        contentHash: await hashForDexieTransaction(result.text),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await db.transcripts.add(transcript);
      return transcript;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new StorageError(error instanceof Error ? error.message : undefined);
    }
  },

  async getCurrent(captureSessionId: string): Promise<Transcript | undefined> {
    const versions = await this.listVersions(captureSessionId);
    return versions.at(-1);
  },

  async listVersions(captureSessionId: string): Promise<Transcript[]> {
    return db.transcripts.where('captureSessionId').equals(captureSessionId).sortBy('version');
  },

  async updateText(captureSessionId: string, text: string): Promise<Transcript> {
    const existing = await this.getCurrent(captureSessionId);
    if (!existing) throw new ValidationError('Transcript not found.');
    const transcript = await this.createVersion(captureSessionId, {
      text,
      segments: existing.segments,
      language: existing.language,
      confidence: existing.confidence,
      provider: 'user',
      model: existing.model,
    });
    await db.transcripts.update(transcript.id, { source: 'edited' });
    return { ...transcript, source: 'edited' };
  },
};
