'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { settingsRepository } from '@/lib/repositories';
import { CaptureService } from '@/lib/services/CaptureService';
import { ProcessingService } from '@/lib/services/ProcessingService';

export function TextCaptureForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [followupError, setFollowupError] = useState<string | null>(null);

  useEffect(() => {
    if (!text.trim()) return;
    const protectUnsavedWork = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', protectUnsavedWork);
    return () => window.removeEventListener('beforeunload', protectUnsavedWork);
  }, [text]);

  function cancel() {
    setText('');
    setSaveError(null);
    setOpen(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaveError(null);
    setFollowupError(null);
    let captureId: string;
    let automaticProcessing = false;
    try {
      const settings = await settingsRepository.get();
      automaticProcessing = settings.automaticProcessing && settings.cloudProcessingConsent === 'granted';
      const { capture } = await CaptureService.saveText({
        text,
        processingPreference: automaticProcessing ? 'automatic' : 'manual',
      });
      captureId = capture.id;
      setText('');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Could not save your ramble.';
      setSaveError(`${message} Your text is still here.`);
      setSaving(false);
      return;
    }

    try {
      router.push(`/capture/${captureId}`);
    } catch {
      setFollowupError('Your ramble was saved locally, but the capture screen could not open. Open it from Recent captures.');
      setSaving(false);
      return;
    }
    if (automaticProcessing) {
      void ProcessingService.process(captureId).catch(() => undefined);
    }
    setSaving(false);
  }

  return (
    <section aria-label="Typed capture" className="text-capture">
      <button
        aria-controls="text-capture-panel"
        aria-expanded={open}
        className="text-capture__toggle"
        disabled={saving}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span>Paste a ramble</span>
        <span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>

      {open ? (
        <form id="text-capture-panel" onSubmit={submit}>
          <label htmlFor="ramble-text">Ramble text</label>
          <p id="ramble-help">Paste or type the thought you want Nugget to organize.</p>
          <textarea
            aria-describedby={`ramble-help ramble-count${saveError ? ' ramble-error' : ''}`}
            disabled={saving}
            id="ramble-text"
            onChange={(event) => setText(event.target.value)}
            placeholder="What's on your mind?"
            value={text}
          />
          <p id="ramble-count">{text.length} {text.length === 1 ? 'character' : 'characters'}</p>
          {saveError ? <p className="inline-error" id="ramble-error" role="alert">{saveError}</p> : null}
          {followupError ? <p className="inline-error" role="alert">{followupError}</p> : null}
          <div className="text-capture__actions">
            <button className="button-quiet" disabled={saving} onClick={cancel} type="button">Cancel</button>
            <button className="button-primary" disabled={saving} type="submit">
              {saving ? 'Saving…' : 'Save ramble'}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
