'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { tagRepository } from '@/lib/repositories';
import { ReviewService, type CanonicalReviewSnapshot } from '@/lib/services/ReviewService';
import type { Idea, Tag } from '@/types';
import {
  IdeaCandidateForm,
  initializeIdeaDraftFormValue,
  type IdeaDraftFormValue,
  validateIdeaDraftFormValue,
} from './IdeaCandidateForm';

interface MutationFailure {
  ideaId?: string;
  message: string;
  retry: 'confirm' | 'confirm-all' | 'discard' | 'reprocess';
}

function confirmationInput(value: IdeaDraftFormValue, tagIds: string[]) {
  return {
    title: value.title.trim(),
    summary: value.summary,
    purpose: value.purpose,
    goals: value.goals,
    problem: value.problem,
    blockers: value.blockers,
    questions: value.questions,
    suggestedActions: value.suggestedActions,
    research: value.research,
    categoryId: value.categoryId,
    tagIds,
  };
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function ReviewScreen({ captureId }: { captureId: string }) {
  const [snapshot, setSnapshot] = useState<CanonicalReviewSnapshot>();
  const [pendingIdeas, setPendingIdeas] = useState<Idea[]>([]);
  const [drafts, setDrafts] = useState<Map<string, IdeaDraftFormValue>>(new Map());
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [activeIdeaId, setActiveIdeaId] = useState<string>();
  const [initialIdeaCount, setInitialIdeaCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadFailure, setLoadFailure] = useState<string>();
  const [mutationFailure, setMutationFailure] = useState<MutationFailure>();
  const [notice, setNotice] = useState<string>();
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailure(undefined);
    try {
      const [nextSnapshot, tags] = await Promise.all([
        ReviewService.load(captureId),
        tagRepository.list(),
      ]);
      const nextDrafts = new Map<string, IdeaDraftFormValue>();
      for (const idea of nextSnapshot.ideas) {
        nextDrafts.set(idea.id, initializeIdeaDraftFormValue(idea, tags));
      }
      setSnapshot(nextSnapshot);
      setAllTags(tags);
      setPendingIdeas(nextSnapshot.ideas);
      setDrafts(nextDrafts);
      setActiveIdeaId(nextSnapshot.ideas[0]?.id);
      setInitialIdeaCount(nextSnapshot.ideas.length);
    } catch (error) {
      setLoadFailure(errorMessage(error, 'The local review could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [captureId]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeIndex = Math.max(
    0,
    pendingIdeas.findIndex((idea) => idea.id === activeIdeaId),
  );
  const activeIdea = pendingIdeas[activeIndex];
  const activeDraft = activeIdea ? drafts.get(activeIdea.id) : undefined;
  const readyCount = useMemo(
    () =>
      snapshot
        ? pendingIdeas.filter((idea) => {
            const value = drafts.get(idea.id);
            return value && validateIdeaDraftFormValue(idea, value, snapshot.categories).valid;
          }).length
        : 0,
    [drafts, pendingIdeas, snapshot],
  );

  function removeCandidate(ideaId: string) {
    setDrafts((current) => {
      const next = new Map(current);
      next.delete(ideaId);
      return next;
    });
    setPendingIdeas((current) => {
      const removedIndex = current.findIndex((idea) => idea.id === ideaId);
      const next = current.filter((idea) => idea.id !== ideaId);
      setActiveIdeaId((currentActive) => {
        if (currentActive !== ideaId && next.some((idea) => idea.id === currentActive)) {
          return currentActive;
        }
        return next[Math.min(Math.max(removedIndex, 0), Math.max(next.length - 1, 0))]?.id;
      });
      return next;
    });
  }

  function changeDraft(ideaId: string, value: IdeaDraftFormValue) {
    setDrafts((current) => {
      const next = new Map(current);
      next.set(ideaId, value);
      return next;
    });
    setMutationFailure(undefined);
    setNotice(undefined);
  }

  async function persistConfirmation(idea: Idea, value: IdeaDraftFormValue) {
    const tags = await tagRepository.findOrCreate(value.tagNames);
    await ReviewService.confirm(
      idea.id,
      confirmationInput(value, tags.map((tag) => tag.id)),
      [...new Set(value.acceptedActionSuggestionIds)],
    );
    setAllTags((current) => {
      const byId = new Map(current.map((tag) => [tag.id, tag]));
      for (const tag of tags) byId.set(tag.id, tag);
      return [...byId.values()];
    });
  }

  async function confirmOne(ideaId = activeIdea?.id) {
    if (!ideaId || inFlight.current || !snapshot) return;
    const idea = pendingIdeas.find((candidate) => candidate.id === ideaId);
    const value = drafts.get(ideaId);
    if (!idea || !value || !validateIdeaDraftFormValue(idea, value, snapshot.categories).valid) return;

    inFlight.current = true;
    setBusy(true);
    setMutationFailure(undefined);
    setNotice(undefined);
    try {
      await persistConfirmation(idea, value);
      removeCandidate(idea.id);
      setNotice('Idea added to your library');
    } catch (error) {
      setMutationFailure({
        ideaId,
        message: errorMessage(error, 'This idea could not be confirmed.'),
        retry: 'confirm',
      });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  async function confirmAllReady() {
    if (inFlight.current || !snapshot) return;
    const ready = pendingIdeas.filter((idea) => {
      const value = drafts.get(idea.id);
      return value && validateIdeaDraftFormValue(idea, value, snapshot.categories).valid;
    });
    if (ready.length === 0) return;

    inFlight.current = true;
    setBusy(true);
    setMutationFailure(undefined);
    setNotice(undefined);
    let succeeded = 0;
    try {
      for (const idea of ready) {
        const value = drafts.get(idea.id)!;
        try {
          await persistConfirmation(idea, value);
          succeeded += 1;
          removeCandidate(idea.id);
        } catch (error) {
          setActiveIdeaId(idea.id);
          setMutationFailure({
            ideaId: idea.id,
            message: `${succeeded} of ${ready.length} ready ideas confirmed before this stopped. ${errorMessage(
              error,
              'The next idea could not be confirmed.',
            )}`,
            retry: 'confirm-all',
          });
          return;
        }
      }
      setNotice(
        succeeded === 1
          ? '1 idea added to your library'
          : `${succeeded} ideas added to your library`,
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  async function discardIdea(ideaId = activeIdea?.id) {
    if (!ideaId || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setMutationFailure(undefined);
    setNotice(undefined);
    try {
      await ReviewService.discard(ideaId);
      removeCandidate(ideaId);
      setNotice('Draft idea discarded. Your source capture is still available.');
    } catch (error) {
      setMutationFailure({
        ideaId,
        message: errorMessage(error, 'This draft could not be discarded.'),
        retry: 'discard',
      });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  async function reprocess() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setMutationFailure(undefined);
    setNotice(undefined);
    try {
      await ReviewService.reprocess(captureId);
      await load();
    } catch (error) {
      setMutationFailure({
        message: errorMessage(error, 'This capture could not be reprocessed.'),
        retry: 'reprocess',
      });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function retryMutation() {
    if (!mutationFailure) return;
    if (mutationFailure.retry === 'confirm') void confirmOne(mutationFailure.ideaId);
    else if (mutationFailure.retry === 'confirm-all') void confirmAllReady();
    else if (mutationFailure.retry === 'discard') void discardIdea(mutationFailure.ideaId);
    else void reprocess();
  }

  if (loading) {
    return (
      <AppShell backHref={`/capture/${captureId}?stay=1`} title="Review">
        <p aria-live="polite">Loading ideas...</p>
      </AppShell>
    );
  }

  if (loadFailure) {
    const missingCapture = loadFailure === 'Capture not found.';
    const missingTranscript = loadFailure === 'A transcript is required before review.';
    return (
      <AppShell backHref="/" title="Review">
        <section className="review-empty" role="alert">
          <p className="review-screen__eyebrow">Review unavailable</p>
          <h1>{missingCapture ? 'Capture not found' : missingTranscript ? 'Transcript unavailable' : 'Unable to load review'}</h1>
          <p>{loadFailure}</p>
          <div className="review-empty__actions">
            {!missingCapture ? <Link className="button-primary" href={`/capture/${captureId}?stay=1`}>Back to capture</Link> : null}
            <button className="button-quiet" onClick={() => void load()} type="button">Try again</button>
          </div>
        </section>
      </AppShell>
    );
  }

  if (!snapshot) return null;

  const sourceHref = `/capture/${captureId}?stay=1`;
  const completed = pendingIdeas.length === 0 &&
    (initialIdeaCount > 0 || snapshot.capture.processingState === 'confirmed');

  if (completed) {
    return (
      <AppShell backHref="/ideas" title="Review">
        <section className="review-empty">
          <p className="review-screen__eyebrow">Review complete</p>
          <h1>All ideas reviewed</h1>
          <p>Your confirmed ideas are in the library. The original capture and transcript remain linked.</p>
          {notice ? <p aria-live="polite" className="success-note">{notice}</p> : null}
          <div className="review-empty__actions">
            <Link className="button-primary" href="/ideas">Browse ideas</Link>
            <Link className="button-quiet" href={sourceHref}>View source capture</Link>
          </div>
        </section>
      </AppShell>
    );
  }

  if (pendingIdeas.length === 0) {
    return (
      <AppShell backHref={sourceHref} title="Review">
        <section className="review-empty">
          <p className="review-screen__eyebrow">Nothing separated yet</p>
          <h1>No clear ideas found</h1>
          <p>Edit the transcript if speech was missed, or try organizing this capture again. Your source text is unchanged.</p>
          <blockquote className="review-empty__transcript">{snapshot.transcript.text}</blockquote>
          {mutationFailure ? (
            <div className="review-mutation-error" role="alert">
              <p>{mutationFailure.message}</p>
              <button className="button-quiet" disabled={busy} onClick={retryMutation} type="button">Retry</button>
            </div>
          ) : null}
          <div className="review-empty__actions">
            <Link className="button-quiet" href={sourceHref}>Edit transcript</Link>
            <button className="button-primary" disabled={busy} onClick={() => void reprocess()} type="button">Reprocess</button>
            <Link className="review-source-link" href={sourceHref}>Back to capture</Link>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell backHref={sourceHref} title="Review">
      <article className="review-screen">
        <header className="review-screen__header">
          <p className="review-screen__eyebrow">Organized from your ramble</p>
          <h1>{initialIdeaCount} {initialIdeaCount === 1 ? 'idea' : 'ideas'} found</h1>
          <div className="review-screen__context">
            <span className="metadata">{activeIndex + 1} of {pendingIdeas.length}</span>
            <Link className="review-source-link" href={sourceHref}>View source capture</Link>
          </div>
          <div aria-label="Idea navigation" className="review-screen__navigation" role="group">
            <button
              className="button-quiet"
              disabled={busy || activeIndex === 0}
              onClick={() => setActiveIdeaId(pendingIdeas[activeIndex - 1]?.id)}
              type="button"
            >
              Previous idea
            </button>
            <button
              className="button-quiet"
              disabled={busy || activeIndex >= pendingIdeas.length - 1}
              onClick={() => setActiveIdeaId(pendingIdeas[activeIndex + 1]?.id)}
              type="button"
            >
              Next idea
            </button>
          </div>
          <button
            className="review-confirm-all"
            disabled={busy || readyCount === 0}
            onClick={() => void confirmAllReady()}
            type="button"
          >
            Confirm all ready ideas ({readyCount})
          </button>
        </header>

        {notice ? <p aria-live="polite" className="success-note">{notice}</p> : null}
        {mutationFailure && mutationFailure.retry !== 'discard' ? (
          <div className="review-mutation-error" role="alert">
            <p>{mutationFailure.message}</p>
            <button className="button-quiet" disabled={busy} onClick={retryMutation} type="button">Retry</button>
          </div>
        ) : null}

        {activeIdea && activeDraft ? (
          <IdeaCandidateForm
            busy={busy}
            categories={snapshot.categories}
            discardError={
              mutationFailure?.retry === 'discard' && mutationFailure.ideaId === activeIdea.id
                ? mutationFailure.message
                : undefined
            }
            idea={activeIdea}
            key={activeIdea.id}
            onChange={(value) => changeDraft(activeIdea.id, value)}
            onConfirm={() => void confirmOne(activeIdea.id)}
            onDiscard={() => void discardIdea(activeIdea.id)}
            tags={allTags}
            value={activeDraft}
          />
        ) : null}
      </article>
    </AppShell>
  );
}
