import { captureRepository } from '@/lib/repositories';
import {
  capturePipeline,
  createMockCapturePipeline,
  type CapturePipeline,
} from './CapturePipeline';

export interface ProcessCaptureOptions {
  force?: boolean;
  signal?: AbortSignal;
}

export function createProcessingService(pipeline: CapturePipeline) {
  const inFlight = new Map<string, Promise<void>>();

  async function process(captureSessionId: string, options: ProcessCaptureOptions = {}) {
    const existing = inFlight.get(captureSessionId);
    // `force` may bypass persisted reuse decisions inside a future pipeline,
    // but it must never create overlapping writes/model calls for one capture.
    if (existing) return existing;

    const work = pipeline.run(captureSessionId, options.signal).finally(() => {
      if (inFlight.get(captureSessionId) === work) inFlight.delete(captureSessionId);
    });
    inFlight.set(captureSessionId, work);
    return work;
  }

  return {
    async enqueue(captureSessionId: string) {
      await captureRepository.transition(captureSessionId, 'queued');
    },
    process,
    async resumePending() {
      const runnable = await captureRepository.listRunnable();
      await Promise.allSettled(runnable.map((capture) => process(capture.id)));
    },
  };
}

/** Production processing uses consent-gated cloud transcription and organization. */
export const ProcessingService = createProcessingService(capturePipeline);

/** Explicit deterministic service for demos, tests, and offline development. */
export const MockProcessingService = createProcessingService(createMockCapturePipeline());
