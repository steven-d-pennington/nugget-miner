'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ReviewService, type ReviewSnapshot } from '@/lib/services/ReviewService';
import { parseExtractionResult } from '@/lib/validation/extractionResult';
import { transcriptRepository } from '@/lib/repositories';
import type { ExtractionActionSuggestion, ExtractionPreset, SourceSpan, Transcript } from '@/types';
import { PresetSelector } from './PresetSelector';

function sourceSnippet(transcript: Transcript | undefined, span?: SourceSpan) {
  if (!transcript || !span) return 'Source unavailable';
  return transcript.text.slice(span.start, span.end).replace(/\s+/g, ' ').trim() || 'Source unavailable';
}

function ActionCard({ action, index, onAccept, transcript }: { action: ExtractionActionSuggestion; index: number; onAccept(index: number): void; transcript?: Transcript }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-accent/40 px-2 py-1 text-xs text-accent">Suggested action</span>
        <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-muted">{action.priority}</span>
        <span className="text-xs text-muted">{Math.round(action.confidence * 100)}% confidence</span>
      </div>
      <h3 className="mt-3 text-lg font-semibold">{action.title}</h3>
      {action.description ? <p className="mt-2 text-muted">{action.description}</p> : null}
      <blockquote className="mt-3 border-l-2 border-accent/50 pl-3 text-sm text-muted">{sourceSnippet(transcript, action.sourceSpan)}</blockquote>
      <button className="mt-4 rounded-full bg-success px-4 py-2 font-semibold text-black" onClick={() => onAccept(index)} type="button">
        Accept action
      </button>
    </article>
  );
}

export function ReviewScreen({ ideaId }: { ideaId: string }) {
  const [snapshot, setSnapshot] = useState<ReviewSnapshot | undefined>();
  const [transcript, setTranscript] = useState<Transcript | undefined>();
  const [preset, setPreset] = useState<ExtractionPreset>('general-thought');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [nextSnapshot, nextTranscript] = await Promise.all([
      ReviewService.latestSnapshot(ideaId),
      transcriptRepository.getByIdeaId(ideaId),
    ]);
    setSnapshot(nextSnapshot);
    setTranscript(nextTranscript);
    if (nextSnapshot) setPreset(nextSnapshot.run.preset);
    setLoading(false);
  }, [ideaId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runExtraction() {
    setRunning(true);
    setMessage(null);
    try {
      await ReviewService.runMockExtraction({ ideaId, preset });
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Extraction failed.');
    } finally {
      setRunning(false);
    }
  }

  async function acceptNugget(id: string) {
    await ReviewService.acceptNugget(id);
    await load();
  }

  async function rejectNugget(id: string) {
    await ReviewService.rejectNugget(id);
    await load();
  }

  async function acceptQuestion(id: string) {
    await ReviewService.acceptQuestion(id);
    await load();
  }

  async function rejectQuestion(id: string) {
    await ReviewService.rejectQuestion(id);
    await load();
  }

  async function acceptAction(index: number) {
    if (!snapshot) return;
    const action = await ReviewService.acceptAction(snapshot.run.id, index);
    setMessage(`Accepted action: ${action.title}`);
    await load();
  }

  const result = snapshot ? parseExtractionResult(JSON.parse(snapshot.run.rawJson)) : undefined;

  if (loading) return <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 text-muted">Loading review…</main>;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <Link className="text-accent" href={`/idea/${ideaId}`}>← Back to idea</Link>
      <header className="rounded-[var(--radius)] border border-white/10 bg-surface p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-accent">Nugget review</p>
        <h1 className="mt-2 text-3xl font-bold">Review suggested nuggets</h1>
        <p className="mt-2 max-w-2xl text-muted">Mock extraction runs locally. Suggestions are not trusted records until you accept them.</p>
      </header>

      <section className="rounded-[var(--radius)] border border-white/10 bg-surface p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <PresetSelector value={preset} onChange={setPreset} />
          <button className="rounded-full bg-accent px-5 py-3 font-semibold text-black disabled:opacity-50" disabled={running || !transcript} onClick={runExtraction} type="button">
            {snapshot ? 'Regenerate mock extraction' : 'Run mock extraction'}
          </button>
        </div>
        {!transcript ? <p className="mt-4 rounded-xl border border-danger/40 bg-danger/10 p-3 text-danger">A transcript is required before extraction.</p> : null}
        {message ? <p className="mt-4 rounded-xl border border-success/40 bg-success/10 p-3 text-success">{message}</p> : null}
      </section>

      {snapshot && result ? (
        <>
          <section className="rounded-[var(--radius)] border border-white/10 bg-surface p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-accent/40 px-3 py-1 text-sm text-accent">Suggested</span>
              <span className="text-sm text-muted">{snapshot.run.provider} · {snapshot.run.preset} · {snapshot.run.schemaVersion}</span>
            </div>
            <h2 className="mt-4 text-xl font-semibold">Summary</h2>
            <p className="mt-2 text-muted">{result.summary}</p>
            {result.tags.length ? <p className="mt-3 text-sm text-muted">Tags: {result.tags.join(', ')}</p> : null}
            {result.warnings.length ? <p className="mt-3 text-sm text-warning">Warnings: {result.warnings.join('; ')}</p> : null}
          </section>

          <section className="grid gap-4 md:grid-cols-2" aria-label="Suggested nuggets">
            {snapshot.nuggets.map((nugget) => (
              <article key={nugget.id} className="rounded-2xl border border-white/10 bg-surface p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-accent/40 px-2 py-1 text-xs text-accent">Suggested nugget</span>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-muted">{nugget.category}</span>
                  <span className="text-xs text-muted">{nugget.status}</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold">{nugget.title}</h3>
                {nugget.detail ? <p className="mt-2 text-muted">{nugget.detail}</p> : null}
                <blockquote className="mt-3 border-l-2 border-accent/50 pl-3 text-sm text-muted">{sourceSnippet(transcript, nugget.sourceSpan)}</blockquote>
                <div className="mt-4 flex gap-2">
                  <button className="rounded-full bg-success px-4 py-2 font-semibold text-black" onClick={() => acceptNugget(nugget.id)} type="button">Accept</button>
                  <button className="rounded-full border border-danger/50 px-4 py-2 font-semibold text-danger" onClick={() => rejectNugget(nugget.id)} type="button">Reject</button>
                </div>
              </article>
            ))}
          </section>

          <section className="grid gap-4 md:grid-cols-2" aria-label="Suggested actions">
            {result.actions.map((action, index) => (
              <ActionCard key={`${action.title}-${index}`} action={action} index={index} transcript={transcript} onAccept={acceptAction} />
            ))}
          </section>

          <section className="grid gap-4 md:grid-cols-2" aria-label="Suggested questions">
            {snapshot.questions.map((question) => (
              <article key={question.id} className="rounded-2xl border border-white/10 bg-surface p-4">
                <span className="rounded-full border border-accent/40 px-2 py-1 text-xs text-accent">Suggested question</span>
                <h3 className="mt-3 text-lg font-semibold">{question.text}</h3>
                <blockquote className="mt-3 border-l-2 border-accent/50 pl-3 text-sm text-muted">{sourceSnippet(transcript, question.sourceSpan)}</blockquote>
                <div className="mt-4 flex gap-2">
                  <button className="rounded-full bg-success px-4 py-2 font-semibold text-black" onClick={() => acceptQuestion(question.id)} type="button">Accept</button>
                  <button className="rounded-full border border-danger/50 px-4 py-2 font-semibold text-danger" onClick={() => rejectQuestion(question.id)} type="button">Reject</button>
                </div>
              </article>
            ))}
          </section>
        </>
      ) : (
        <section className="rounded-[var(--radius)] border border-dashed border-white/20 bg-surface p-6 text-muted">
          No extraction run yet. Run mock extraction to create source-linked suggestions.
        </section>
      )}
    </main>
  );
}
