'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { captureRepository, categoryRepository, ideaRepository } from '@/lib/repositories';
import type { CaptureSession, Category, Idea } from '@/types';

export function ConfirmedIdeasPreview() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviewQueue, setReviewQueue] = useState<CaptureSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState<string>();

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(undefined);
    try {
      const [nextIdeas, nextCategories, captures] = await Promise.all([
        ideaRepository.listConfirmed(),
        categoryRepository.ensureDefaults(),
        captureRepository.listRecent(100),
      ]);
      setIdeas(nextIdeas);
      setCategories(nextCategories);
      setReviewQueue(
        captures.filter((capture) =>
          ['ready_for_review', 'partially_confirmed'].includes(capture.processingState),
        ),
      );
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'The local idea library could not be read.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <p aria-live="polite">Loading your ideas...</p>;

  if (failure) {
    return (
      <div className="review-mutation-error" role="alert">
        <p>{failure}</p>
        <button className="button-quiet" onClick={() => void load()} type="button">Try again</button>
      </div>
    );
  }

  const categoriesById = new Map(categories.map((category) => [category.id, category.name]));

  return (
    <div className="idea-library-preview">
      {reviewQueue.length > 0 ? (
        <section aria-labelledby="review-queue-heading" className="idea-library-preview__queue">
          <div className="section-heading-row">
            <h2 id="review-queue-heading">Ready to review</h2>
            <span className="metadata">{reviewQueue.length}</span>
          </div>
          <ul>
            {reviewQueue.map((capture) => (
              <li key={capture.id}>
                <Link href={`/review/${capture.id}`}>
                  <span>{capture.source === 'audio' ? 'Voice capture' : 'Pasted ramble'}</span>
                  <strong>Review ideas</strong>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="confirmed-ideas-heading">
        <header className="idea-library-preview__header">
          <p className="route-placeholder__eyebrow">Your library</p>
          <h1 id="confirmed-ideas-heading">Ideas</h1>
          <p>Confirmed ideas stay organized here and linked to the capture they came from.</p>
        </header>

        {ideas.length === 0 ? (
          <div className="idea-library-preview__empty">
            <h2>No confirmed ideas yet</h2>
            <p>Record a thought, organize it, and confirm the ideas you want to keep.</p>
            <Link className="button-primary" href="/">Record an idea</Link>
          </div>
        ) : (
          <ul aria-label="Confirmed ideas" className="idea-library-preview__list">
            {ideas.map((idea) => (
              <li key={idea.id}>
                <article className="idea-library-preview__idea">
                  <div className="idea-library-preview__meta">
                    <span>{categoriesById.get(idea.categoryId) ?? 'Unknown category'}</span>
                    <span className="metadata">Confirmed</span>
                  </div>
                  <h2>{idea.title}</h2>
                  <p>{idea.summary.text}</p>
                  <Link href={`/capture/${idea.captureSessionId}?stay=1`}>View source capture</Link>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
