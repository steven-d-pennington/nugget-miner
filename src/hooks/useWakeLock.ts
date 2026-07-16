'use client';

import { useEffect } from 'react';

export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !navigator.wakeLock) return;

    let cancelled = false;
    let sentinel: WakeLockSentinel | null = null;

    void navigator.wakeLock.request('screen').then((lock) => {
      if (cancelled) {
        void lock.release().catch(() => undefined);
        return;
      }
      sentinel = lock;
    }).catch(() => {
      // Wake lock is progressive enhancement and must never block recording.
    });

    return () => {
      cancelled = true;
      if (sentinel) void sentinel.release().catch(() => undefined);
    };
  }, [active]);
}
