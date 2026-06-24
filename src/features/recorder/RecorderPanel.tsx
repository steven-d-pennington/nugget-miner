'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useRecorder } from '@/hooks/useRecorder';
import { saveRecording } from './saveRecording';

function formatDuration(durationMs: number) {
  const seconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

export function RecorderPanel({ onSaved }: { onSaved?: () => void }) {
  const router = useRouter();
  const recorder = useRecorder();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function persist(transcribe: boolean) {
    if (!recorder.draft) return;
    setSaving(true);
    setSaveError(null);
    try {
      const { idea } = await saveRecording({ draft: recorder.draft, transcribe });
      onSaved?.();
      router.push(`/idea/${idea.id}`);
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : 'Could not save recording.');
    } finally {
      setSaving(false);
    }
  }

  const isRecording = recorder.state === 'recording';
  const canStart = (recorder.state === 'idle' || recorder.state === 'error') && !recorder.draft;

  return (
    <section className="rounded-[var(--radius)] border border-white/10 bg-surface p-5 shadow-2xl shadow-black/20" aria-labelledby="record-heading">
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-2 inline-flex rounded-full border border-accent/40 px-3 py-1 text-sm text-accent">Local-only prototype</p>
          <h2 id="record-heading" className="text-2xl font-semibold">Record a thought</h2>
          <p className="mt-2 text-muted">Stored on this device. Mock transcription runs locally and never calls a cloud service.</p>
        </div>

        <div className="rounded-2xl bg-[var(--surface-2)] p-4" aria-live="polite">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-muted">Status</p>
              <p className="mt-1 text-xl font-medium capitalize">{recorder.draft ? 'ready to save' : recorder.state.replace('-', ' ')}</p>
            </div>
            <div className="font-mono text-4xl">{formatDuration(recorder.elapsedMs)}</div>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/30" aria-hidden="true">
            <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${Math.max(4, recorder.level * 100)}%` }} />
          </div>
          <p className="mt-2 text-sm text-muted">Level meter is visual only; recording state is announced in text above.</p>
        </div>

        {recorder.error ? <p className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{recorder.error}</p> : null}
        {saveError ? <p className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{saveError}</p> : null}

        <div className="flex flex-wrap gap-3">
          {canStart ? (
            <button className="rounded-full bg-accent px-6 py-3 font-semibold text-black" onClick={recorder.start} type="button">
              Record
            </button>
          ) : null}
          {isRecording ? (
            <button className="rounded-full bg-danger px-6 py-3 font-semibold text-white" onClick={recorder.stop} type="button">
              Stop
            </button>
          ) : null}
          {recorder.draft ? (
            <>
              <button className="rounded-full bg-accent px-6 py-3 font-semibold text-black disabled:opacity-50" disabled={saving} onClick={() => persist(true)} type="button">
                Save & Mock Transcribe
              </button>
              <button className="rounded-full border border-white/20 px-6 py-3 font-semibold disabled:opacity-50" disabled={saving} onClick={() => persist(false)} type="button">
                Save Only
              </button>
              <button className="rounded-full border border-danger/50 px-6 py-3 font-semibold text-danger disabled:opacity-50" disabled={saving} onClick={recorder.discard} type="button">
                Discard
              </button>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
