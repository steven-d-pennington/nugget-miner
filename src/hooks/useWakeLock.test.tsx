import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useWakeLock } from './useWakeLock';

function Harness({ active }: { active: boolean }) {
  useWakeLock(active);
  return null;
}

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, 'wakeLock');
});

describe('useWakeLock', () => {
  it('releases a wake lock that resolves after recording has already stopped', async () => {
    let resolveRequest!: (sentinel: WakeLockSentinel) => void;
    const request = vi.fn(() => new Promise<WakeLockSentinel>((resolve) => {
      resolveRequest = resolve;
    }));
    const release = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request } });
    const { rerender } = render(<Harness active />);

    expect(request).toHaveBeenCalledWith('screen');
    rerender(<Harness active={false} />);
    resolveRequest({ release } as unknown as WakeLockSentinel);

    await waitFor(() => expect(release).toHaveBeenCalledTimes(1));
  });

  it('silently falls back when wake lock is unsupported', () => {
    expect(() => render(<Harness active />)).not.toThrow();
  });
});
