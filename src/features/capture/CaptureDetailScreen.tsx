'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { AudioPlayer } from '@/components/AudioPlayer';
import { captureRepository, recordingRepository, transcriptRepository } from '@/lib/repositories';
import { ReviewService } from '@/lib/services/ReviewService';
import type { CaptureSession, Recording, Transcript } from '@/types';
import { ProcessCaptureButton } from './ProcessCaptureButton';
import { ProcessingTimeline } from './ProcessingTimeline';

const activeStates = new Set<CaptureSession['processingState']>([
  'queued',
  'transcribing',
  'segmenting',
  'organizing',
]);

function formatDuration(durationMs: number) {
  const seconds = Math.max(0, Math.round(durationMs / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp);
}

function preservationCopy(recording?: Recording, transcript?: Transcript) {
  if (recording && transcript) return 'Your saved recording and transcript remain safe in this browser.';
  if (recording) return 'Your saved recording remains safe in this browser.';
  if (transcript) return 'Your saved transcript remains safe in this browser.';
  return 'Your saved capture remains safe in this browser.';
}

interface CaptureDetailScreenProps {
  captureId: string;
  stayOnCapture?: boolean;
}

export function CaptureDetailScreen({ captureId, stayOnCapture = false }: CaptureDetailScreenProps) {
  const router = useRouter();
  const [capture, setCapture] = useState<CaptureSession | null>(null);
  const [recording, setRecording] = useState<Recording | undefined>();
  const [transcript, setTranscript] = useState<Transcript | undefined>();
  const [draftText, setDraftText] = useState('');
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editNotice, setEditNotice] = useState<string | null>(null);
  const [lifecycleObserved, setLifecycleObserved] = useState(false);
  const refreshPromise = useRef<Promise<void> | null>(null);
  const automaticProbeCount = useRef(0);
  const dirtyRef = useRef(false);
  const redirected = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshPromise.current) return refreshPromise.current;
    const work = (async () => {
      try {
        const [nextCapture, nextRecording, nextTranscript] = await Promise.all([
          captureRepository.getById(captureId),
          recordingRepository.getByCaptureId(captureId),
          transcriptRepository.getCurrent(captureId),
        ]);
        setCapture(nextCapture ?? null);
        setRecording((current) => current?.id === nextRecording?.id ? current : nextRecording);
        setTranscript(nextTranscript);
        if (!dirtyRef.current) setDraftText(nextTranscript?.text ?? '');
        setLoadError(null);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'The local capture could not be read.');
      } finally {
        setLoading(false);
      }
    })();
    refreshPromise.current = work;
    try {
      await work;
    } finally {
      if (refreshPromise.current === work) refreshPromise.current = null;
    }
  }, [captureId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (capture && activeStates.has(capture.processingState)) setLifecycleObserved(true);
  }, [capture]);

  const shouldPoll = Boolean(
    capture &&
      lifecycleObserved &&
      (activeStates.has(capture.processingState) || capture.processingState === 'transcript_ready'),
  );

  useEffect(() => {
    if (!shouldPoll) return;
    const interval = window.setInterval(() => void refresh(), 1_000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [refresh, shouldPoll]);

  const shouldProbeAutomaticTranscript = Boolean(
    capture &&
      capture.processingPreference === 'automatic' &&
      capture.processingState === 'transcript_ready' &&
      !lifecycleObserved &&
      automaticProbeCount.current < 3,
  );

  useEffect(() => {
    if (!shouldProbeAutomaticTranscript) return;
    let cancelled = false;
    let timeout: number | undefined;
    const scheduleProbe = () => {
      timeout = window.setTimeout(async () => {
        automaticProbeCount.current += 1;
        await refresh();
        if (!cancelled && automaticProbeCount.current < 3) scheduleProbe();
      }, 1_000);
    };
    scheduleProbe();
    return () => {
      cancelled = true;
      if (timeout !== undefined) window.clearTimeout(timeout);
    };
  }, [refresh, shouldProbeAutomaticTranscript]);

  useEffect(() => {
    if (capture?.processingState !== 'ready_for_review' || stayOnCapture || redirected.current) return;
    redirected.current = true;
    router.replace(`/review/${capture.id}`);
  }, [capture, router, stayOnCapture]);

  const processing = Boolean(
    capture &&
      (activeStates.has(capture.processingState) ||
        (lifecycleObserved && capture.processingState === 'transcript_ready')),
  );

  function changeTranscript(value: string) {
    setDraftText(value);
    const nextDirty = value !== (transcript?.text ?? '');
    dirtyRef.current = nextDirty;
    setDirty(nextDirty);
    setEditNotice(null);
  }

  async function persistTranscript() {
    if (!capture || !transcript) throw new Error('Transcript not found.');
    const updated = draftText === transcript.text
      ? transcript
      : await transcriptRepository.updateText(capture.id, draftText);
    await captureRepository.transition(capture.id, 'transcript_ready', { transcriptId: updated.id });
    dirtyRef.current = false;
    setDirty(false);
    setTranscript(updated);
    setDraftText(updated.text);
    return updated;
  }

  async function saveTranscript() {
    setEditBusy(true);
    setEditNotice(null);
    try {
      await persistTranscript();
      await refresh();
      setEditNotice('Transcript edit saved. It will not be reprocessed unless you choose Save and reprocess.');
    } catch (error) {
      setEditNotice(`${error instanceof Error ? error.message : 'The transcript could not be saved.'} ${preservationCopy(recording, transcript)}`);
    } finally {
      setEditBusy(false);
    }
  }

  async function saveAndReprocess() {
    setEditBusy(true);
    setEditNotice(null);
    try {
      await persistTranscript();
      setLifecycleObserved(true);
      await refresh();
      await ReviewService.reprocess(captureId);
      await refresh();
    } catch (error) {
      setEditNotice(`${error instanceof Error ? error.message : 'Reprocessing could not continue.'} ${preservationCopy(recording, transcript)}`);
      await refresh().catch(() => undefined);
    } finally {
      setEditBusy(false);
    }
  }

  if (loading) {
    return <AppShell backHref="/" title="Capture"><p aria-live="polite">Loading capture…</p></AppShell>;
  }

  if (loadError) {
    return (
      <AppShell backHref="/" title="Capture">
        <section className="capture-detail__empty" role="alert">
          <h1>Unable to load capture</h1>
          <p>{loadError}</p>
          <button className="button-primary" onClick={() => void refresh()} type="button">Try again</button>
        </section>
      </AppShell>
    );
  }

  if (!capture) {
    return (
      <AppShell backHref="/" title="Capture">
        <section className="capture-detail__empty">
          <h1>Capture not found</h1>
          <p>This capture is not stored in this browser profile.</p>
          <Link className="button-primary capture-detail__link-button" href="/">Capture</Link>
        </section>
      </AppShell>
    );
  }

  const reviewReady = ['ready_for_review', 'partially_confirmed', 'confirmed'].includes(capture.processingState);

  return (
    <AppShell backHref="/" title="Capture">
      <article className="capture-detail">
        <header className="capture-detail__header">
          <p className="capture-detail__eyebrow">Saved on this device</p>
          <h1>Recording saved</h1>
          <p>You can leave. We’ll resume when the app is open and connected.</p>
        </header>

        <section aria-labelledby="source-heading" className="capture-detail__section">
          <div className="section-heading-row">
            <h2 id="source-heading">Source</h2>
            <time dateTime={new Date(capture.createdAt).toISOString()}>{formatDate(capture.createdAt)}</time>
          </div>
          {recording ? (
            <>
              <AudioPlayer recording={recording} />
              <p className="metadata capture-detail__metadata">
                {formatDuration(recording.durationMs)} · {recording.mimeType} · {(recording.sizeBytes / 1_024).toFixed(1)} KB
              </p>
            </>
          ) : capture.source === 'text' ? (
            <p className="capture-detail__typed-label">Typed capture · saved locally in this browser</p>
          ) : (
            <p className="inline-error" role="alert">
              Audio playback is unavailable. The capture record is still saved in this browser.
            </p>
          )}
        </section>

        <section aria-labelledby="progress-heading" className="capture-detail__section capture-detail__progress">
          <h2 id="progress-heading">Processing</h2>
          <ProcessingTimeline
            hasTranscript={Boolean(transcript)}
            recoverableStage={capture.recoverableStage}
            state={capture.processingState}
          />
          {capture.processingState === 'failed' && capture.lastError ? (
            <p className="inline-error" role="alert">
              {capture.lastError.message} {preservationCopy(recording, transcript)}
            </p>
          ) : null}
          {reviewReady && (stayOnCapture || capture.processingState !== 'ready_for_review') ? (
            <Link
              className="button-primary capture-detail__link-button"
              href={capture.processingState === 'confirmed' ? '/ideas' : `/review/${capture.id}`}
            >
              {capture.processingState === 'confirmed' ? 'Browse ideas' : 'Review ideas'}
            </Link>
          ) : null}
          {!reviewReady ? (
            <ProcessCaptureButton
              capture={capture}
              hasRecording={Boolean(recording)}
              hasTranscript={Boolean(transcript)}
              blockedByUnsavedTranscript={dirty}
              lifecycleActive={processing}
              onRefresh={refresh}
            />
          ) : null}
        </section>

        {transcript ? (
          <section aria-labelledby="transcript-heading" className="capture-detail__section">
            <div className="section-heading-row">
              <h2 id="transcript-heading">Transcript</h2>
              <span>Version {transcript.version}</span>
            </div>
            <textarea
              aria-label="Transcript text"
              disabled={processing || editBusy}
              onChange={(event) => changeTranscript(event.target.value)}
              value={draftText}
            />
            <div className="capture-detail__edit-actions">
              <button className="button-quiet" disabled={!dirty || processing || editBusy} onClick={() => void saveTranscript()} type="button">
                {editBusy ? 'Saving…' : 'Save transcript edit'}
              </button>
              <button className="button-primary" disabled={processing || editBusy} onClick={() => void saveAndReprocess()} type="button">
                Save and reprocess
              </button>
            </div>
            <p className="capture-detail__edit-note">
              Reprocessing creates drafts for this transcript version. Confirmed ideas are preserved.
            </p>
            {editNotice ? <p aria-live="polite" className={editNotice.includes('saved.') ? 'success-note' : 'inline-error'}>{editNotice}</p> : null}
          </section>
        ) : null}
      </article>
    </AppShell>
  );
}
