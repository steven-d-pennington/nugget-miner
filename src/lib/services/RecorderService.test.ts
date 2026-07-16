import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrowserRecorderService } from './RecorderService';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function installMediaRecorder() {
  const construct = vi.fn();
  class FakeMediaRecorder {
    static isTypeSupported() {
      return true;
    }

    constructor() {
      construct();
    }
  }
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
  return construct;
}

function installGetUserMedia(getUserMedia: ReturnType<typeof vi.fn>) {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, 'mediaDevices');
});

describe('BrowserRecorderService permission lifecycle', () => {
  it('stops a late permission stream without constructing an unowned recorder', async () => {
    const permission = deferred<MediaStream>();
    const getUserMedia = vi.fn(() => permission.promise);
    const constructRecorder = installMediaRecorder();
    const stopTrack = vi.fn();
    const stream = { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream;
    installGetUserMedia(getUserMedia);
    const service = new BrowserRecorderService();

    const starting = service.start();
    expect(service.state).toBe('requesting-permission');
    service.cancel();
    expect(service.state).toBe('idle');
    permission.resolve(stream);
    await starting;

    expect(stopTrack).toHaveBeenCalledTimes(1);
    expect(constructRecorder).not.toHaveBeenCalled();
    expect(service.state).toBe('idle');
  });

  it('ignores a permission rejection that arrives after cancellation', async () => {
    const permission = deferred<MediaStream>();
    installMediaRecorder();
    installGetUserMedia(vi.fn(() => permission.promise));
    const service = new BrowserRecorderService();

    const starting = service.start();
    service.cancel();
    permission.reject(new DOMException('Permission denied', 'NotAllowedError'));

    await expect(starting).resolves.toBeUndefined();
    expect(service.state).toBe('idle');
  });
});
