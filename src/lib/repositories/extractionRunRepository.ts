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
}

export const extractionRunRepository = {
  async start(input: StartExtractionRunInput): Promise<ExtractionRun> {
    try {
      return await db.transaction('rw', db.extractionRuns, async () => {
        const attempts = await db.extractionRuns
          .where('idempotencyKey')
          .equals(input.idempotencyKey)
          .sortBy('attempt');
        const succeeded = attempts.filter((attempt) => attempt.status === 'succeeded').at(-1);
        if (succeeded) return succeeded;

        const timestamp = Date.now();
        for (const interrupted of attempts.filter((attempt) => attempt.status === 'running')) {
          await db.extractionRuns.update(interrupted.id, {
            status: 'superseded',
            completedAt: timestamp,
            errorCode: interrupted.errorCode ?? 'interrupted',
          });
        }

        const nextAttempt = (attempts.at(-1)?.attempt ?? 0) + 1;
        const run: ExtractionRun = {
          id: crypto.randomUUID(),
          ...input,
          status: 'running',
          attempt: nextAttempt,
          rawJson: '',
          startedAt: timestamp,
        };
        await db.extractionRuns.add(run);
        return run;
      });
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

  async fail(id: string, errorCode: string, rawJson?: string): Promise<void> {
    const existing = await db.extractionRuns.get(id);
    if (!existing) return;
    await db.extractionRuns.update(id, {
      errorCode,
      status: 'failed',
      completedAt: Date.now(),
      rawJson: existing.rawJson || rawJson || '',
    });
  },

  async getById(id: string): Promise<ExtractionRun | undefined> {
    return db.extractionRuns.get(id);
  },

  async findByIdempotencyKey(key: string): Promise<ExtractionRun | undefined> {
    const attempts = await db.extractionRuns.where('idempotencyKey').equals(key).sortBy('attempt');
    return attempts.filter((attempt) => attempt.status === 'succeeded').at(-1) ?? attempts.at(-1);
  },

  async listByCapture(captureSessionId: string): Promise<ExtractionRun[]> {
    return db.extractionRuns.where('captureSessionId').equals(captureSessionId).sortBy('startedAt');
  },
};
