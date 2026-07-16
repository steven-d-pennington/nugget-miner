'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useRecorder } from '@/hooks/useRecorder';
import { useWakeLock } from '@/hooks/useWakeLock';
import { settingsRepository } from '@/lib/repositories';
import { CaptureService } from '@/lib/services/CaptureService';
import { ProcessingService } from '@/lib/services/ProcessingService';
import type { RecordingDraft } from '@/types';

function formatDuration(durationMs: number) {
  const seconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
}

function storageMessage(error: unknown) {
  const detail = error instanceof Error && error.message ? ` ${error.message}` : '';
  return `This recording is still ready to save. Free some browser storage if needed, then try again.${detail}`;
}

export interface RecorderPanelProps {
  onRecordingChange?: (active: boolean) => void;
}

export function RecorderPanel({ onRecordingChange }: RecorderPanelProps) {
  const router = useRouter();
  const recorder = useRecorder();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [followupError, setFollowupError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const isRecording = recorder.state === 'recording' || recorder.state === 'stopping';

  useWakeLock(recorder.state === 'recording');

  useEffect(() => {
    onRecordingChange?.(isRecording);
  }, [isRecording, onRecordingChange]);

  useEffect(() => {
    if (!isRecording && !saving && !recorder.draft) return;
    const protectUnsavedWork = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', protectUnsavedWork);
    return () => window.removeEventListener('beforeunload', protectUnsavedWork);
  }, [isRecording, recorder.draft, saving]);

  async function persistDraft(draft: RecordingDraft) {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
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
      setSaveError(storageMessage(error));
      setSaving(false);
      savingRef.current = false;
      return;
    }

    recorder.clearSavedDraft();
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

  const canStart = (recorder.state === 'idle' || recorder.state === 'error') && !recorder.draft;

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

      {recorder.error ? <p className="inline-error" role="alert">{recorder.error}</p> : null}
      {saveError ? <p className="inline-error" role="alert">{saveError}</p> : null}
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
