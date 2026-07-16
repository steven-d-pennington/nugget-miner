'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserRecorderService, type RecorderState } from '@/lib/services/RecorderService';
import type { RecordingDraft } from '@/types';

export function useRecorder() {
  const serviceRef = useRef<BrowserRecorderService | null>(null);
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [level, setLevel] = useState(0);
  const [draft, setDraft] = useState<RecordingDraft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const startAttemptRef = useRef(0);

  if (!serviceRef.current && typeof window !== 'undefined') {
    serviceRef.current = new BrowserRecorderService();
  }

  useEffect(() => {
    const service = serviceRef.current;
    if (!service) return;
    return service.onLevel(setLevel);
  }, []);

  useEffect(() => {
    if (state !== 'recording') return;
    const timer = window.setInterval(() => {
      if (startedAtRef.current) setElapsedMs(Math.round(performance.now() - startedAtRef.current));
    }, 250);
    return () => window.clearInterval(timer);
  }, [state]);

  useEffect(() => {
    return () => {
      startAttemptRef.current += 1;
      serviceRef.current?.cancel();
    };
  }, []);

  const start = useCallback(async () => {
    const service = serviceRef.current;
    if (!service) return;
    const attempt = ++startAttemptRef.current;
    setError(null);
    setDraft(null);
    setState('requesting-permission');
    try {
      await service.start();
      if (attempt !== startAttemptRef.current || service.state !== 'recording') return;
      startedAtRef.current = performance.now();
      setElapsedMs(0);
      setState(service.state);
    } catch (caught) {
      if (attempt !== startAttemptRef.current) return;
      setError(caught instanceof Error ? caught.message : 'Recording failed.');
      setState('error');
    }
  }, []);

  const stop = useCallback(async () => {
    const service = serviceRef.current;
    if (!service) return null;
    setState('stopping');
    try {
      const nextDraft = await service.stop();
      setDraft(nextDraft);
      setElapsedMs(nextDraft.durationMs);
      setState('idle');
      return nextDraft;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not stop recording.');
      setState('error');
      return null;
    }
  }, []);

  const discard = useCallback(() => {
    startAttemptRef.current += 1;
    serviceRef.current?.cancel();
    setDraft(null);
    setElapsedMs(0);
    setLevel(0);
    setError(null);
    setState('idle');
  }, []);

  const clearSavedDraft = useCallback(() => {
    setDraft(null);
    setElapsedMs(0);
    setLevel(0);
  }, []);

  return { state, elapsedMs, level, draft, error, start, stop, discard, clearSavedDraft };
}
