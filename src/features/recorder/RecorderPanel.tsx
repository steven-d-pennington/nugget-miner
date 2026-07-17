'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useRecorder } from '@/hooks/useRecorder';
import { useWakeLock } from '@/hooks/useWakeLock';
import { settingsRepository } from '@/lib/repositories';
import { userErrorMessage } from '@/lib/userErrorMessage';
import { CaptureService } from '@/lib/services/CaptureService';
import { ProcessingService } from '@/lib/services/ProcessingService';
import type { RecordingDraft } from '@/types';

function formatDuration(durationMs: number) {
  const seconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
}

export interface RecorderPanelProps {
  onCaptureLockChange?: (locked: boolean) => void;
  onCaptureSaved?: () => void;
}

export function RecorderPanel({ onCaptureLockChange, onCaptureSaved }: RecorderPanelProps) {
  const router = useRouter();
  const recorder = useRecorder();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<ReturnType<typeof userErrorMessage> | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [followupError, setFollowupError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const isRecording = recorder.state === 'recording' || recorder.state === 'stopping';
  const captureLocked = recorder.state === 'requesting-permission' || isRecording || saving || Boolean(recorder.draft);

  useWakeLock(recorder.state === 'recording');

  useEffect(() => {
    onCaptureLockChange?.(captureLocked);
  }, [captureLocked, onCaptureLockChange]);

  useEffect(() => {
    if (!captureLocked) return;
    const protectUnsavedWork = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', protectUnsavedWork);
    return () => window.removeEventListener('beforeunload', protectUnsavedWork);
  }, [captureLocked]);

  async function persistDraft(draft: RecordingDraft) {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    setSaveNotice(null);
    setFollowupError(null);
    let savedCaptureId: string;
    let automaticProcessing = false;
    try {
      const settings = await settingsRepository.get();
      automaticProcessing = settings.automaticProcessing && settings.cloudProcessingConsent === 'granted';
      const saved = await CaptureService.saveRecording({
        draft,
        processingPreference: automaticProcessing ? 'automatic' : 'manual',
      });
      savedCaptureId = saved.capture.id;
    } catch (error) {
      setSaveError(userErrorMessage(error));
      setSaving(false);
      savingRef.current = false;
      return;
    }

    recorder.clearSavedDraft();
    onCaptureSaved?.();
    if (!navigator.onLine) {
      setSaveNotice('Recording saved locally. Reconnect to continue processing.');
      setSaving(false);
      savingRef.current = false;
      return;
    }
    try {
      router.push(`/capture/${savedCaptureId}`);
    } catch {
      setFollowupError('Your recording was saved locally, but the capture screen could not open. Open it from Recent captures.');
      setSaving(false);
      savingRef.current = false;
      return;
    }
    if (automaticProcessing) {
      void ProcessingService.process(savedCaptureId).catch(() => undefined);
    }
    setSaving(false);
    savingRef.current = false;
  }

  async function stopAndSave() {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    setSaveNotice(null);
    setFollowupError(null);
    const draft = await recorder.stop();
    if (!draft) {
      setSaving(false);
      savingRef.current = false;
      return;
    }
    savingRef.current = false;
    await persistDraft(draft);
  }

  function openPasteRamble() {
    document.querySelector<HTMLButtonElement>('[aria-controls="text-capture-panel"]')?.click();
  }

  const recorderRecovery = recorder.error ? userErrorMessage(recorder.error) : null;
  const canStart = (recorder.state === 'idle' || recorder.state === 'error') && !recorder.draft;

  if (recorder.state === 'requesting-permission') {
    return (
      <section aria-labelledby="permission-heading" aria-live="polite" className="permission-state">
        <p className="capture-hero__eyebrow">Microphone</p>
        <h1 id="permission-heading">Requesting microphone access…</h1>
        <p>Choose Allow in your browser to begin recording. Nothing is saved until recording starts.</p>
        <button className="button-quiet" onClick={recorder.discard} type="button">Cancel</button>
      </section>
    );
  }

  if (isRecording) {
    return (
      <section aria-labelledby="recording-heading" className="recording-state">
        <p className="recording-state__eyebrow" id="recording-heading">Listening&hellip;</p>
        <time aria-label={`Recording time ${formatDuration(recorder.elapsedMs)}`} className="recording-state__timer">
          {formatDuration(recorder.elapsedMs)}
        </time>
        <div
          aria-label="Live microphone level"
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(recorder.level * 100)}
          className="recording-waveform"
          role="meter"
        >
          {Array.from({ length: 13 }, (_, index) => (
            <span
              aria-hidden="true"
              key={index}
              style={{ transform: `scaleY(${Math.max(0.18, recorder.level * (0.55 + ((index * 7) % 9) / 10))})` }}
            />
          ))}
        </div>
        <button className="record-stop-button" disabled={saving || recorder.state === 'stopping'} onClick={stopAndSave} type="button">
          {saving || recorder.state === 'stopping' ? 'Saving…' : 'Stop & save'}
        </button>
        <p className="recording-state__reassurance">Saved on this device when you stop</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="capture-heading" className="capture-hero">
      <p className="capture-hero__eyebrow">Quick capture</p>
      <h1 id="capture-heading">What&apos;s on your mind?</h1>
      <p className="capture-hero__lede">Speak freely. Your recording is stored in this browser before any processing starts.</p>

      {recorderRecovery ? (
        <div className="inline-error" role="alert">
          <strong>{recorderRecovery.title}</strong>
          <p>{recorderRecovery.detail}</p>
          {recorderRecovery.actionLabel ? (
            <button
              className="button-quiet"
              onClick={recorderRecovery.actionLabel === 'Paste a ramble' ? openPasteRamble : recorder.start}
              type="button"
            >
              {recorderRecovery.actionLabel}
            </button>
          ) : null}
        </div>
      ) : null}
      {saveError ? (
        <div className="inline-error" role="alert">
          <strong>{saveError.title}</strong>
          <p>{saveError.detail}</p>
        </div>
      ) : null}
      {saveNotice ? <p aria-live="polite" className="success-note">{saveNotice}</p> : null}
      {followupError ? <p className="inline-error" role="alert">{followupError}</p> : null}

      {canStart ? (
        <button aria-label="Record" className="record-button" onClick={recorder.start} type="button">
          <span aria-hidden="true" className="record-button__icon" />
          <span>Record</span>
        </button>
      ) : null}

      {recorder.draft ? (
        <button className="retry-save-button" disabled={saving} onClick={() => persistDraft(recorder.draft!)} type="button">
          {saving ? 'Saving…' : 'Retry save'}
        </button>
      ) : null}
    </section>
  );
}
