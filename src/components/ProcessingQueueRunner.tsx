'use client';

import { useEffect, useRef } from 'react';
import { ProcessingService } from '@/lib/services/ProcessingService';

export function ProcessingQueueRunner() {
  const runningRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function resume() {
      if (!active || runningRef.current || !navigator.onLine) return;
      runningRef.current = true;
      try {
        await ProcessingService.resumePending();
      } catch {
        // Capture state records actionable processing failures for the visible screens.
      } finally {
        runningRef.current = false;
      }
    }

    function handleOnline() {
      void resume();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void resume();
      }
    }

    void resume();
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      active = false;
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}
