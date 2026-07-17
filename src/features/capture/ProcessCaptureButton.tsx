'use client';

import { useEffect, useState } from 'react';
import { ConsentSheet } from '@/components/ConsentSheet';
import { settingsRepository } from '@/lib/repositories';
import { ProcessingService } from '@/lib/services/ProcessingService';
import type { CaptureSession } from '@/types';

const activeLabels: Partial<Record<CaptureSession['processingState'], string>> = {
  queued: 'Queued',
  transcribing: 'Transcribing…',
  segmenting: 'Separating ideas…',
  organizing: 'Organizing ideas…',
};

interface ProcessCaptureButtonProps {
  capture: CaptureSession;
  hasRecording: boolean;
  hasTranscript: boolean;
  blockedByUnsavedTranscript?: boolean;
  lifecycleActive?: boolean;
  onRefresh(): Promise<void>;
}

function preservedSource(hasRecording: boolean, hasTranscript: boolean) {
  if (hasRecording && hasTranscript) return 'Your saved recording and transcript remain safe in this browser.';
  if (hasRecording) return 'Your saved recording remains safe in this browser.';
  return hasTranscript
    ? 'Your saved transcript remains safe in this browser.'
    : 'Your saved capture remains safe in this browser.';
}

export function ProcessCaptureButton({
  capture,
  hasRecording,
  hasTranscript,
  blockedByUnsavedTranscript = false,
  lifecycleActive = false,
  onRefresh,
}: ProcessCaptureButtonProps) {
  const [busy, setBusy] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  const consentRequiredFailure = capture.lastError?.code === 'cloud_consent_required';
  const activeLabel = activeLabels[capture.processingState] ?? (lifecycleActive ? 'Organizing ideas…' : undefined);
  const waitingOffline = capture.processingState === 'queued' && !online;
  const retryable = capture.processingState !== 'failed' || capture.lastError?.retryable === true || consentRequiredFailure;
  const sendsTranscript = hasTranscript;

  async function runProcessing({ grantConsent = false }: { grantConsent?: boolean } = {}) {
    setActionError(null);
    setBusy(true);
    try {
      const settings = await settingsRepository.get();
      if (!grantConsent && (consentRequiredFailure || settings.cloudProcessingConsent !== 'granted')) {
        setConsentOpen(true);
        return;
      }
      if (grantConsent) {
        await settingsRepository.update({ cloudProcessingConsent: 'granted' });
      }
      await ProcessingService.enqueue(capture.id);
      await onRefresh();
      if (!navigator.onLine) return;
      await ProcessingService.process(capture.id);
      await onRefresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Processing could not continue.');
      await onRefresh().catch(() => undefined);
    } finally {
      setBusy(false);
    }
  }

  async function confirmConsent() {
    setConsentOpen(false);
    await runProcessing({ grantConsent: true });
  }

  const buttonLabel = blockedByUnsavedTranscript
    ? 'Save transcript changes first'
    : waitingOffline
    ? 'Waiting for connection'
    : activeLabel ?? (capture.processingState === 'failed' ? 'Retry' : 'Process now');

  return (
    <div className="process-capture-action">
      <p className="process-capture-action__disclosure">
        Processing sends {sendsTranscript ? 'this transcript text' : 'this audio recording'} securely to OpenAI
        {sendsTranscript ? ' for GPT-5.6 organization' : ' for transcription and GPT-5.6 organization'}.
        {' '}Saved sources and ideas remain in this browser.
      </p>
      <button
        className="button-primary"
        disabled={busy || Boolean(activeLabel) || waitingOffline || !retryable || blockedByUnsavedTranscript}
        onClick={() => void runProcessing()}
        type="button"
      >
        {busy ? 'Starting…' : buttonLabel}
      </button>
      {actionError ? (
        <p className="inline-error" role="alert">
          {actionError} {preservedSource(hasRecording, hasTranscript)}
        </p>
      ) : null}
      <ConsentSheet
        busy={busy}
        dataLabel={sendsTranscript ? 'transcript text' : 'audio recording and any resulting transcript'}
        onCancel={() => setConsentOpen(false)}
        onConfirm={() => void confirmConsent()}
        open={consentOpen}
        providerLabel="OpenAI"
        purpose={sendsTranscript ? 'organize ideas with GPT-5.6' : 'transcribe it and organize ideas with GPT-5.6'}
      />
    </div>
  );
}
