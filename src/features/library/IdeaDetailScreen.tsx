'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { ideaRepository, recordingRepository, transcriptRepository } from '@/lib/repositories';
import { ReviewService } from '@/lib/services/ReviewService';
import type { Idea, Recording, Transcript } from '@/types';

function formatDuration(durationMs: number) {
  const seconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp);
}

export function IdeaDetailScreen({ ideaId }: { ideaId: string }) {
  const router = useRouter();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [recording, setRecording] = useState<Recording | undefined>();
  const [transcript, setTranscript] = useState<Transcript | undefined>();
  const [draftText, setDraftText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [nextIdea, nextRecording, nextTranscript] = await Promise.all([
      ideaRepository.getById(ideaId),
      recordingRepository.getByIdeaId(ideaId),
      transcriptRepository.getByIdeaId(ideaId),
    ]);
    setIdea(nextIdea ?? null);
    setRecording(nextRecording);
    setTranscript(nextTranscript);
    setDraftText(nextTranscript?.text ?? '');
    setLoading(false);
  }, [ideaId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveTranscript() {
    await transcriptRepository.updateText(ideaId, draftText);
    setSaved(true);
    await load();
    window.setTimeout(() => setSaved(false), 1600);
  }

  async function extractNuggets() {
    setExtracting(true);
    setExtractionError(null);
    try {
      await transcriptRepository.updateText(ideaId, draftText);
      await ReviewService.runMockExtraction({ ideaId, preset: 'general-thought' });
      router.push(`/review/${ideaId}`);
    } catch (error) {
      setExtractionError(error instanceof Error ? error.message : 'Extraction failed.');
    } finally {
      setExtracting(false);
    }
  }

  if (loading) {
    return <main className="mx-auto min-h-screen max-w-4xl px-4 py-8 text-muted">Loading idea…</main>;
  }

  if (!idea) {
    return (
      <main className="mx-auto min-h-screen max-w-4xl px-4 py-8">
        <Link className="text-accent" href="/">← Back home</Link>
        <div className="mt-6 rounded-[var(--radius)] border border-danger/40 bg-danger/10 p-6">
          <h1 className="text-2xl font-semibold">Idea not found</h1>
          <p className="mt-2 text-muted">This local idea may have been deleted or belongs to another browser profile.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
      <Link className="text-accent" href="/">← Back home</Link>

      <header className="rounded-[var(--radius)] border border-white/10 bg-surface p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-accent">Idea detail</p>
            <h1 className="mt-2 text-3xl font-bold">{idea.title}</h1>
            <p className="mt-2 text-muted">{formatDate(idea.createdAt)} · {formatDuration(idea.durationMs)} · {idea.status}</p>
          </div>
          <span className="w-fit rounded-full border border-success/40 px-3 py-1 text-sm text-success">Stored on this device</span>
        </div>
      </header>

      <section className="rounded-[var(--radius)] border border-white/10 bg-surface p-6" aria-labelledby="playback-heading">
        <h2 id="playback-heading" className="text-xl font-semibold">Playback</h2>
        <div className="mt-4">
          <AudioPlayer recording={recording} />
        </div>
        {recording ? (
          <p className="mt-3 text-sm text-muted">{recording.mimeType} · {(recording.sizeBytes / 1024).toFixed(1)} KB · {formatDuration(recording.durationMs)}</p>
        ) : null}
      </section>

      <section className="rounded-[var(--radius)] border border-white/10 bg-surface p-6" aria-labelledby="transcript-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="transcript-heading" className="text-xl font-semibold">Transcript</h2>
          <span className="w-fit rounded-full border border-accent/40 px-3 py-1 text-sm text-accent">On this device (mock)</span>
        </div>
        {transcript ? (
          <>
            <textarea
              aria-label="Transcript text"
              className="mt-4 min-h-48 w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-text"
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
            />
            <div className="mt-4 flex items-center gap-3">
              <button className="rounded-full bg-accent px-5 py-3 font-semibold text-black" onClick={saveTranscript} type="button">
                Save transcript edit
              </button>
              <button className="rounded-full bg-success px-5 py-3 font-semibold text-black disabled:opacity-50" disabled={extracting} onClick={extractNuggets} type="button">
                {extracting ? 'Extracting…' : 'Extract Nuggets'}
              </button>
              {saved ? <span className="text-sm text-success">Saved</span> : null}
            </div>
            {extractionError ? <p className="mt-3 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{extractionError}</p> : null}
            <p className="mt-3 text-sm text-muted">Provider: {transcript.provider}{transcript.model ? ` · Model: ${transcript.model}` : ''}{transcript.edited ? ' · edited' : ''}</p>
          </>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-white/20 p-6 text-muted">
            No transcript yet. Record again and choose Save & Mock Transcribe.
          </div>
        )}
      </section>
    </main>
  );
}
