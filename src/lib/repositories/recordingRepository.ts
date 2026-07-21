import { db } from '@/lib/db';
import { StorageError, ValidationError } from '@/lib/errors';
import type { Recording, RecordingDraft } from '@/types';

export const recordingRepository = {
  async add(captureSessionId: string, draft: RecordingDraft): Promise<Recording> {
    try {
      const recording: Recording = {
        id: crypto.randomUUID(),
        captureSessionId,
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

  async getByCaptureId(captureSessionId: string): Promise<Recording | undefined> {
    return db.recordings.where('captureSessionId').equals(captureSessionId).first();
  },

  async deleteProcessedAudio(captureSessionId: string): Promise<void> {
    await db.transaction('rw', db.captureSessions, db.recordings, db.transcripts, async () => {
      const [capture, recording, transcript] = await Promise.all([
        db.captureSessions.get(captureSessionId),
        db.recordings.where('captureSessionId').equals(captureSessionId).first(),
        db.transcripts.where('captureSessionId').equals(captureSessionId).first(),
      ]);
      if (!capture) throw new ValidationError('Capture not found.');
      if (!recording) return;
      if (!transcript) {
        throw new ValidationError('Recording audio can be deleted after transcription is complete.');
      }

      const timestamp = Date.now();
      await db.recordings.where('captureSessionId').equals(captureSessionId).delete();
      await db.captureSessions.update(captureSessionId, {
        recordingId: undefined,
        recordingDeletedAt: timestamp,
        updatedAt: timestamp,
      });
    });
  },
};
