import { db } from '@/lib/db';
import { StorageError } from '@/lib/errors';
import type { Recording, RecordingDraft } from '@/types';

export const recordingRepository = {
  async add(ideaId: string, draft: RecordingDraft): Promise<Recording> {
    try {
      const recording: Recording = {
        id: crypto.randomUUID(),
        ideaId,
        blob: draft.blob,
        mimeType: draft.mimeType,
        sizeBytes: draft.sizeBytes,
        durationMs: draft.durationMs,
        waveformPreview: draft.waveformPreview,
        createdAt: Date.now(),
      };
      await db.recordings.add(recording);
      return recording;
    } catch (error) {
      throw new StorageError(error instanceof Error ? error.message : undefined);
    }
  },

  async getByIdeaId(ideaId: string): Promise<Recording | undefined> {
    return db.recordings.where('ideaId').equals(ideaId).first();
  },
};
