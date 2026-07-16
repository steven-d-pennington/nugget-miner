import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetClientDatabaseForTests } from '@/lib/db';
import { captureRepository } from '@/lib/repositories';
import { createProcessingService } from './ProcessingService';

afterEach(async () => {
  await resetClientDatabaseForTests();
});

describe('createProcessingService', () => {
  it('deduplicates concurrent same-tab processing for one capture', async () => {
    let resolveRun: (() => void) | undefined;
    const deferred = new Promise<void>((resolve) => {
      resolveRun = resolve;
    });
    const pipeline = { run: vi.fn(() => deferred) };
    const service = createProcessingService(pipeline);

    const first = service.process('capture-1');
    const second = service.process('capture-1');

    expect(pipeline.run).toHaveBeenCalledTimes(1);
    resolveRun?.();
    await Promise.all([first, second]);
  });

  it('resumes persisted queued work after the service instance is recreated', async () => {
    const capture = await captureRepository.create({
      source: 'audio',
      processingPreference: 'automatic',
      initialState: 'queued',
    });
    const pipeline = { run: vi.fn(async () => undefined) };

    createProcessingService(pipeline);
    const recreated = createProcessingService(pipeline);
    await recreated.resumePending();

    expect(pipeline.run).toHaveBeenCalledTimes(1);
    expect(pipeline.run).toHaveBeenCalledWith(capture.id, undefined);
  });
});
