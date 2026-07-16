import { db } from '@/lib/db';
import { StorageError } from '@/lib/errors';
import type { CaptureSession, CaptureSource, ProcessingState } from '@/types';

export interface CreateCaptureInput {
  source: CaptureSource;
  durationMs?: number;
  processingPreference: 'automatic' | 'manual';
  initialState?: ProcessingState;
}

export type CapturePatch = Partial<
  Pick<
    CaptureSession,
    | 'recordingId'
    | 'transcriptId'
    | 'activeExtractionRunId'
    | 'recoverableStage'
    | 'processingAttempt'
    | 'nextRetryAt'
    | 'lastError'
  >
>;

export const captureRepository = {
  async create(input: CreateCaptureInput): Promise<CaptureSession> {
    try {
      const timestamp = Date.now();
      const capture: CaptureSession = {
        id: crypto.randomUUID(),
        source: input.source,
        processingState: input.initialState ?? 'saved',
        processingPreference: input.processingPreference,
        processingAttempt: 0,
        durationMs: input.durationMs ?? 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await db.captureSessions.add(capture);
      return capture;
    } catch (error) {
      throw new StorageError(error instanceof Error ? error.message : undefined);
    }
  },

  async getById(id: string): Promise<CaptureSession | undefined> {
    return db.captureSessions.get(id);
  },

  async listRecent(limit = 20): Promise<CaptureSession[]> {
    return db.captureSessions.orderBy('createdAt').reverse().limit(limit).toArray();
  },

  async listReviewReadyOldestFirst(): Promise<CaptureSession[]> {
    const captures = await db.captureSessions
      .where('processingState')
      .anyOf('ready_for_review', 'partially_confirmed')
      .toArray();
    return captures.sort((left, right) => left.createdAt - right.createdAt);
  },

  async listRunnable(): Promise<CaptureSession[]> {
    const now = Date.now();
    const candidates = await db.captureSessions.where('processingState').anyOf('queued', 'failed').toArray();
    return candidates.filter(
      (capture) =>
        capture.processingState === 'queued' ||
        (capture.lastError?.retryable === true && (capture.nextRetryAt === undefined || capture.nextRetryAt <= now)),
    );
  },

  async transition(id: string, processingState: ProcessingState, patch: CapturePatch = {}): Promise<void> {
    await db.captureSessions.update(id, { ...patch, processingState, updatedAt: Date.now() });
  },
};
