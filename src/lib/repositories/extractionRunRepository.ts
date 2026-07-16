import { db } from '@/lib/db';
import { StorageError } from '@/lib/errors';
import type { ExtractionRun } from '@/types';

export interface StartExtractionRunInput {
  captureSessionId: string;
  transcriptId: string;
  transcriptHash: string;
  provider: string;
  model: string;
  reasoningEffort: string;
  segmentationPromptVersion: string;
  organizationPromptVersion: string;
  schemaVersion: string;
  idempotencyKey: string;
  stage: ExtractionRun['stage'];
  attempt?: number;
}

export const extractionRunRepository = {
  async start(input: StartExtractionRunInput): Promise<ExtractionRun> {
    const existing = await this.findByIdempotencyKey(input.idempotencyKey);
    if (existing?.status === 'succeeded') return existing;

    try {
      const run: ExtractionRun = {
        id: crypto.randomUUID(),
        ...input,
        status: 'running',
        attempt: input.attempt ?? 1,
        rawJson: '',
        startedAt: Date.now(),
      };
      await db.extractionRuns.add(run);
      return run;
    } catch (error) {
      throw new StorageError(error instanceof Error ? error.message : undefined);
    }
  },

  async complete(id: string, rawJson: string, latencyMs: number): Promise<void> {
    await db.extractionRuns.update(id, {
      rawJson,
      latencyMs,
      status: 'succeeded',
      completedAt: Date.now(),
      errorCode: undefined,
    });
  },

  async fail(id: string, errorCode: string): Promise<void> {
    await db.extractionRuns.update(id, {
      errorCode,
      status: 'failed',
      completedAt: Date.now(),
    });
  },

  async getById(id: string): Promise<ExtractionRun | undefined> {
    return db.extractionRuns.get(id);
  },

  async findByIdempotencyKey(key: string): Promise<ExtractionRun | undefined> {
    return db.extractionRuns.where('idempotencyKey').equals(key).first();
  },

  async listByCapture(captureSessionId: string): Promise<ExtractionRun[]> {
    return db.extractionRuns.where('captureSessionId').equals(captureSessionId).sortBy('startedAt');
  },
};
