import { captureRepository } from '@/lib/repositories';

export interface CapturePipeline {
  run(captureSessionId: string, signal?: AbortSignal): Promise<void>;
}

export interface ProcessCaptureOptions {
  force?: boolean;
  signal?: AbortSignal;
}

const inFlight = new Map<string, Promise<void>>();

export function createProcessingService(pipeline: CapturePipeline) {
  async function process(captureSessionId: string, options: ProcessCaptureOptions = {}) {
    const existing = inFlight.get(captureSessionId);
    if (existing && !options.force) return existing;

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
