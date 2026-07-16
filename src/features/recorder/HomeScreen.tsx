'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { captureRepository, settingsRepository } from '@/lib/repositories';
import type { AppSettings, CaptureSession } from '@/types';
import { RecorderPanel } from './RecorderPanel';
import { TextCaptureForm } from './TextCaptureForm';

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp);
}

function statusLabel(capture: CaptureSession) {
  switch (capture.processingState) {
    case 'ready_for_review':
    case 'partially_confirmed':
      return 'Ready for review';
    case 'failed':
      return 'Needs attention';
    case 'queued':
    case 'transcribing':
    case 'transcript_ready':
    case 'segmenting':
    case 'organizing':
      return 'Processing';
    case 'confirmed':
      return 'Reviewed';
    default:
      return 'Saved';
  }
}

export function HomeScreen() {
  const [captures, setCaptures] = useState<CaptureSession[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [recordingActive, setRecordingActive] = useState(false);
  const [preferenceError, setPreferenceError] = useState<string | null>(null);
  const [invitationDismissed, setInvitationDismissed] = useState(false);

  const loadHome = useCallback(async () => {
    const [recent, storedSettings] = await Promise.all([
      captureRepository.listRecent(),
      settingsRepository.get(),
    ]);
    setCaptures(recent);
    setSettings(storedSettings);
  }, []);

  useEffect(() => {
    void loadHome().catch(() => {
      // Durable capture remains available even when the home summary cannot refresh.
    });
  }, [loadHome]);

  const reviewReadyCount = useMemo(
    () => captures.filter((capture) =>
      capture.processingState === 'ready_for_review' || capture.processingState === 'partially_confirmed').length,
    [captures],
  );

  async function updateAutomaticPreference(enabled: boolean) {
    setPreferenceError(null);
    try {
      const updated = await settingsRepository.update(enabled
        ? { automaticProcessing: true, cloudProcessingConsent: 'granted' }
        : { automaticProcessing: false });
      setSettings(updated);
      if (!enabled) setInvitationDismissed(true);
    } catch {
      setPreferenceError('That preference could not be saved. Your captures were not changed.');
    }
  }

  return (
    <AppShell showNavigation={!recordingActive}>
      <div className="capture-home">
        <RecorderPanel onRecordingChange={setRecordingActive} />

        {!recordingActive ? (
          <>
            <Link
              aria-label={`${reviewReadyCount} ${reviewReadyCount === 1 ? 'capture' : 'captures'} ready to review`}
              className="review-callout"
              href="/ideas"
            >
              <span className="review-callout__count">{reviewReadyCount}</span>
              <span>{reviewReadyCount === 1 ? 'capture' : 'captures'} ready to review</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>

            {settings?.cloudProcessingConsent === 'unknown' && !invitationDismissed ? (
              <section aria-labelledby="automatic-heading" className="preference-invitation">
                <h2 id="automatic-heading">Organize captures automatically</h2>
                <p>
                  When enabled, audio and transcript text are sent securely to OpenAI for transcription and GPT-5.6 organization. Saved recordings and ideas remain in this browser.
                </p>
                {preferenceError ? <p className="inline-error" role="alert">{preferenceError}</p> : null}
                <div className="preference-invitation__actions">
                  <button className="button-primary" onClick={() => updateAutomaticPreference(true)} type="button">
                    Enable automatic organization
                  </button>
                  <button className="button-quiet" onClick={() => updateAutomaticPreference(false)} type="button">
                    Not now
                  </button>
                </div>
              </section>
            ) : null}

            <TextCaptureForm />

            <section aria-labelledby="recent-heading" className="recent-captures">
              <div className="section-heading-row">
                <h2 id="recent-heading">Recent captures</h2>
                <span>{captures.length} saved</span>
              </div>
              {captures.length === 0 ? (
                <p className="empty-note">Your saved thoughts will appear here.</p>
              ) : (
                <ul>
                  {captures.map((capture) => (
                    <li key={capture.id}>
                      <Link href={`/capture/${capture.id}`}>
                        <span>
                          <strong>{capture.source === 'audio' ? 'Audio capture' : 'Pasted ramble'}</strong>
                          <small>{formatDate(capture.createdAt)}</small>
                        </span>
                        <span className={`capture-status capture-status--${capture.processingState}`}>
                          {statusLabel(capture)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
