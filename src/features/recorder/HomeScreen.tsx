'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { captureRepository } from '@/lib/repositories';
import type { CaptureSession } from '@/types';
import { RecorderPanel } from './RecorderPanel';
import { TextCaptureForm } from './TextCaptureForm';

function formatDuration(durationMs: number) {
  const seconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp);
}

export function HomeScreen() {
  const router = useRouter();
  const [captures, setCaptures] = useState<CaptureSession[]>([]);

  const loadCaptures = useCallback(async () => {
    setCaptures(await captureRepository.listRecent());
  }, []);

  useEffect(() => {
    void loadCaptures();
  }, [loadCaptures]);

  const handleTextSaved = useCallback(async (captureSessionId: string) => {
    await loadCaptures();
    router.push(`/idea/${captureSessionId}`);
  }, [loadCaptures, router]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 rounded-[var(--radius)] border border-white/10 bg-surface/70 p-6 backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-accent">Nugget</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">Capture first. Organize later.</h1>
          </div>
          <span className="w-fit rounded-full border border-success/40 px-3 py-1 text-sm text-success">
            Local storage
          </span>
        </div>
        <p className="max-w-2xl text-muted">
          Recordings and saved ideas stay in this browser. When you choose cloud processing, audio or transcript text is sent securely to the configured provider.
        </p>
      </header>

      <RecorderPanel onSaved={loadCaptures} />

      <TextCaptureForm onSaved={handleTextSaved} />

      <section className="rounded-[var(--radius)] border border-white/10 bg-surface p-5" aria-labelledby="recent-heading">
        <div className="flex items-center justify-between gap-3">
          <h2 id="recent-heading" className="text-2xl font-semibold">Recent captures</h2>
          <span className="text-sm text-muted">{captures.length} saved</span>
        </div>
        {captures.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-white/20 p-6 text-muted">Record a thought. Nugget will help pull out the useful parts.</div>
        ) : (
          <ul className="mt-4 divide-y divide-white/10">
            {captures.map((capture) => (
              <li key={capture.id}>
                <Link className="flex flex-col gap-2 rounded-xl px-2 py-4 hover:bg-white/5 sm:flex-row sm:items-center sm:justify-between" href={`/idea/${capture.id}`}>
                  <span>
                    <span className="block font-medium">{capture.source === 'audio' ? 'Audio capture' : 'Text capture'}</span>
                    <span className="text-sm text-muted">{formatDate(capture.createdAt)} - {formatDuration(capture.durationMs)} - {capture.processingState}</span>
                  </span>
                  <span className="text-sm text-accent">Open</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
