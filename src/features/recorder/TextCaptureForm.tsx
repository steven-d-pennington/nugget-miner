'use client';

import { type FormEvent, useState } from 'react';
import { settingsRepository } from '@/lib/repositories';
import { CaptureService } from '@/lib/services/CaptureService';

export interface TextCaptureFormProps {
  onSaved: (captureSessionId: string) => void | Promise<void>;
}

export function TextCaptureForm({ onSaved }: TextCaptureFormProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function cancel() {
    setText('');
    setSaveError(null);
    setOpen(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      const settings = await settingsRepository.get();
      const { capture } = await CaptureService.saveText({
        text,
        processingPreference: settings.automaticProcessing ? 'automatic' : 'manual',
      });
      await onSaved(capture.id);
      setText('');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Could not save your ramble.';
      setSaveError(`${message} Your text is still here.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[var(--radius)] border border-white/10 bg-surface/70 p-4" aria-label="Typed capture">
      <button
        aria-controls="text-capture-panel"
        aria-expanded={open}
        className="flex min-h-12 w-full items-center justify-between rounded-xl px-2 text-left font-semibold text-accent hover:bg-white/5 disabled:opacity-50"
        disabled={saving}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span>Paste a ramble</span>
        <span aria-hidden="true">{open ? '-' : '+'}</span>
      </button>

      {open ? (
        <form className="mt-4 border-t border-white/10 pt-4" id="text-capture-panel" onSubmit={submit}>
          <label className="block font-medium" htmlFor="ramble-text">
            Ramble text
          </label>
          <p className="mt-1 text-sm text-muted" id="ramble-help">
            Paste or type the thought you want Nugget to organize.
          </p>
          <textarea
            aria-describedby={`ramble-help ramble-count${saveError ? ' ramble-error' : ''}`}
            className="mt-3 min-h-40 w-full resize-y rounded-2xl border border-white/20 bg-[var(--surface-2)] p-4 text-[var(--text)] placeholder:text-muted/70"
            disabled={saving}
            id="ramble-text"
            onChange={(event) => setText(event.target.value)}
            placeholder="What's on your mind?"
            value={text}
          />
          <p className="mt-2 text-right text-sm text-muted" id="ramble-count">
            {text.length} {text.length === 1 ? 'character' : 'characters'}
          </p>

          {saveError ? (
            <p className="mt-3 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger" id="ramble-error" role="alert">
              {saveError}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <button
              className="min-h-12 rounded-full border border-white/20 px-5 py-3 font-semibold disabled:opacity-50"
              disabled={saving}
              onClick={cancel}
              type="button"
            >
              Cancel
            </button>
            <button
              className="min-h-12 rounded-full bg-accent px-6 py-3 font-semibold text-black disabled:opacity-50"
              disabled={saving}
              type="submit"
            >
              {saving ? 'Saving...' : 'Save and organize'}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
