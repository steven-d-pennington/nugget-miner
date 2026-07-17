import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetClientDatabaseForTests } from '@/lib/db';
import { captureRepository } from '@/lib/repositories';
import { createProcessingService } from './ProcessingService';

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
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

  it('never overlaps same-capture processing even when the second request is forced', async () => {
    let resolveRun: (() => void) | undefined;
    const deferred = new Promise<void>((resolve) => {
      resolveRun = resolve;
    });
    const pipeline = { run: vi.fn(() => deferred) };
    const service = createProcessingService(pipeline);

    const first = service.process('capture-1');
    const forced = service.process('capture-1', { force: true });

    expect(pipeline.run).toHaveBeenCalledTimes(1);
    resolveRun?.();
    await Promise.all([first, forced]);
  });

  it('deduplicates same-capture work across distinct service instances', async () => {
    let resolveRun: (() => void) | undefined;
    const deferred = new Promise<void>((resolve) => {
      resolveRun = resolve;
    });
    const pipeline = { run: vi.fn(() => deferred) };
    const firstService = createProcessingService(pipeline);
    const secondService = createProcessingService(pipeline);

    const first = firstService.process('capture-shared');
    const second = secondService.process('capture-shared');

    expect(pipeline.run).toHaveBeenCalledTimes(1);
    resolveRun?.();
    await Promise.all([first, second]);
  });

  it('uses an exclusive Web Lock when the browser supports cross-tab serialization', async () => {
    const request = vi.fn(
      async (_name: string, _options: LockOptions, callback: () => Promise<void>) => callback(),
    );
    vi.stubGlobal('navigator', { locks: { request } });
    const pipeline = { run: vi.fn(async () => undefined) };
    const service = createProcessingService(pipeline);

    await service.process('capture-locked');

    expect(request).toHaveBeenCalledWith(
      'nugget:capture-processing:capture-locked',
      { mode: 'exclusive' },
      expect.any(Function),
    );
    expect(pipeline.run).toHaveBeenCalledTimes(1);
  });

  it('serializes same-capture work across isolated browser realms with Web Locks', async () => {
    const lockTails = new Map<string, Promise<unknown>>();
    const request = vi.fn(
      <T>(name: string, _options: LockOptions, callback: LockGrantedCallback<T>): Promise<T> => {
        const prior = lockTails.get(name) ?? Promise.resolve();
        const work = prior.then(() =>
          callback({ name, mode: 'exclusive' } as Lock),
        ) as Promise<T>;
        lockTails.set(name, work.catch(() => undefined));
        return work;
      },
    );
    vi.stubGlobal('navigator', { locks: { request } });

    let releaseFirst: (() => void) | undefined;
    const firstDeferred = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let concurrent = 0;
    let maxConcurrent = 0;
    const pipeline = {
      run: vi
        .fn<() => Promise<void>>()
        .mockImplementationOnce(async () => {
          concurrent += 1;
          maxConcurrent = Math.max(maxConcurrent, concurrent);
          await firstDeferred;
          concurrent -= 1;
        })
        .mockImplementationOnce(async () => {
          concurrent += 1;
          maxConcurrent = Math.max(maxConcurrent, concurrent);
          concurrent -= 1;
        }),
    };
    const firstRealm = createProcessingService(pipeline, { inFlight: new Map() });
    const secondRealm = createProcessingService(pipeline, { inFlight: new Map() });

    const first = firstRealm.process('capture-cross-tab');
    const forced = secondRealm.process('capture-cross-tab', { force: true });
    await vi.waitFor(() => expect(pipeline.run).toHaveBeenCalledTimes(1));
    releaseFirst?.();
    await Promise.all([first, forced]);

    expect(pipeline.run).toHaveBeenCalledTimes(2);
    expect(maxConcurrent).toBe(1);
    expect(request).toHaveBeenCalledTimes(2);
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
