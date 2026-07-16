import { afterEach, describe, expect, it, vi } from 'vitest';
import { db, resetClientDatabaseForTests } from '@/lib/db';
import {
  actionItemRepository,
  captureRepository,
  extractionRunRepository,
  ideaRepository,
  nuggetRepository,
  questionRepository,
  transcriptRepository,
} from '@/lib/repositories';
import { createMockCapturePipeline } from './CapturePipeline';
import { createReviewService, ReviewService } from './ReviewService';
import type { GroundedText, Idea } from '@/types';

const cloudResult = {
  summary: 'Cloud summary',
  nuggets: [{ title: 'Cloud nugget', category: 'idea', confidence: 0.8, sourceSpan: { start: 0, end: 10 } }],
  actions: [],
  questions: [],
  tags: ['cloud'],
  warnings: [],
};

afterEach(async () => {
  vi.restoreAllMocks();
  await resetClientDatabaseForTests();
});

async function seedTranscriptCapture(
  text = 'We should build a review flow. It needs source-linked suggestions. What should happen next?',
) {
  const capture = await captureRepository.create({
    source: 'text',
    processingPreference: 'manual',
    initialState: 'transcript_ready',
  });
  const transcript = await transcriptRepository.createVersion(capture.id, { text, provider: 'typed' });
  await captureRepository.transition(capture.id, 'transcript_ready', { transcriptId: transcript.id });
  return { capture, transcript };
}

function confirmInput(idea: Idea) {
  return {
    title: idea.title,
    summary: idea.summary,
    purpose: idea.purpose,
    goals: idea.goals,
    problem: idea.problem,
    blockers: idea.blockers,
    questions: idea.questions,
    suggestedActions: idea.suggestedActions,
    research: idea.research,
    categoryId: idea.categoryId,
    tagIds: idea.tagIds,
  };
}

describe('ReviewService compatibility bridge', () => {
  it('runs mock extraction, persists a canonical run, and materializes pending legacy suggestions', async () => {
    const { capture } = await seedTranscriptCapture();

    const snapshot = await ReviewService.runMockExtraction({
      captureSessionId: capture.id,
      preset: 'product-idea',
    });

    expect(snapshot.preset).toBe('product-idea');
    expect(snapshot.run).toMatchObject({
      captureSessionId: capture.id,
      status: 'succeeded',
      stage: 'organizing',
    });
    await expect(nuggetRepository.listByRun(snapshot.run.id)).resolves.toHaveLength(snapshot.nuggets.length);
    await expect(questionRepository.listByRun(snapshot.run.id)).resolves.toHaveLength(snapshot.questions.length);
    await expect(captureRepository.getById(capture.id)).resolves.toMatchObject({
      processingState: 'ready_for_review',
      activeExtractionRunId: snapshot.run.id,
    });
  });

  it('accepts legacy suggestions and creates one duplicate-safe linked action', async () => {
    const { capture } = await seedTranscriptCapture(
      'Remember to send the launch notes. We need a follow up action. What is blocked?',
    );
    const snapshot = await ReviewService.runMockExtraction({
      captureSessionId: capture.id,
      preset: 'work-reminder',
    });
    const firstNugget = snapshot.nuggets[0];
    const firstQuestion = snapshot.questions[0];
    expect(firstNugget).toBeDefined();
    expect(firstQuestion).toBeDefined();

    await ReviewService.acceptNugget(firstNugget!.id);
    await ReviewService.rejectQuestion(firstQuestion!.id);
    const firstAction = await ReviewService.acceptAction(snapshot.run.id, 0, 'Send launch notes');
    const duplicate = await ReviewService.acceptAction(snapshot.run.id, 0, 'Send launch notes');

    await expect(nuggetRepository.listByRun(snapshot.run.id)).resolves.toContainEqual(
      expect.objectContaining({ id: firstNugget!.id, status: 'accepted' }),
    );
    await expect(questionRepository.listByRun(snapshot.run.id)).resolves.toContainEqual(
      expect.objectContaining({ id: firstQuestion!.id, status: 'rejected' }),
    );
    expect(duplicate.id).toBe(firstAction.id);
    await expect(actionItemRepository.listByIdea(capture.id)).resolves.toEqual([
      expect.objectContaining({ id: firstAction.id, text: 'Send launch notes', status: 'open' }),
    ]);
  });

  it('reuses the succeeded run on retry without duplicating records', async () => {
    const { capture } = await seedTranscriptCapture();

    const first = await ReviewService.runMockExtraction({
      captureSessionId: capture.id,
      preset: 'general-thought',
    });
    const second = await ReviewService.runMockExtraction({
      captureSessionId: capture.id,
      preset: 'general-thought',
    });

    expect(second.run.id).toBe(first.run.id);
    await expect(extractionRunRepository.listByCapture(capture.id)).resolves.toHaveLength(1);
    await expect(db.nuggets.where('captureSessionId').equals(capture.id).count()).resolves.toBe(first.nuggets.length);
    await expect(captureRepository.getById(capture.id)).resolves.toMatchObject({ processingState: 'ready_for_review' });
  });

  it('creates a distinct run and output when the preset fingerprint changes', async () => {
    const { capture } = await seedTranscriptCapture('Remember to send the launch notes and review the product idea.');

    const general = await ReviewService.runMockExtraction({
      captureSessionId: capture.id,
      preset: 'general-thought',
    });
    const work = await ReviewService.runMockExtraction({
      captureSessionId: capture.id,
      preset: 'work-reminder',
    });

    expect(work.run.id).not.toBe(general.run.id);
    expect(JSON.parse(work.run.rawJson).summary).not.toBe(JSON.parse(general.run.rawJson).summary);
    await expect(extractionRunRepository.listByCapture(capture.id)).resolves.toHaveLength(2);
  });

  it('creates distinct runs when provider, model, and organization prompt metadata change', async () => {
    const { capture } = await seedTranscriptCapture('Use cloud organization for this transcript.');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    fetchSpy
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            result: { ...cloudResult, summary: 'First cloud output' },
            provider: 'cloud-a',
            model: 'model-a',
            promptVersion: 'organize-a',
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            result: { ...cloudResult, summary: 'Second cloud output' },
            provider: 'cloud-b',
            model: 'model-b',
            promptVersion: 'organize-b',
          }),
          { status: 200 },
        ),
      );

    const first = await ReviewService.runCloudExtraction({
      captureSessionId: capture.id,
      preset: 'product-idea',
      requestConsent: async () => true,
    });
    const second = await ReviewService.runCloudExtraction({
      captureSessionId: capture.id,
      preset: 'product-idea',
      requestConsent: async () => true,
    });

    expect(second.run.id).not.toBe(first.run.id);
    expect(first.run).toMatchObject({ provider: 'cloud-a', model: 'model-a', organizationPromptVersion: 'organize-a' });
    expect(second.run).toMatchObject({ provider: 'cloud-b', model: 'model-b', organizationPromptVersion: 'organize-b' });
    expect(JSON.parse(first.run.rawJson).summary).toBe('First cloud output');
    expect(JSON.parse(second.run.rawJson).summary).toBe('Second cloud output');
  });

  it('marks a started run failed and preserves provider output when persistence fails', async () => {
    const { capture } = await seedTranscriptCapture();
    vi.spyOn(nuggetRepository, 'createMany').mockRejectedValueOnce(new Error('IndexedDB write failed'));

    await expect(
      ReviewService.runMockExtraction({ captureSessionId: capture.id, preset: 'general-thought' }),
    ).rejects.toThrow('IndexedDB write failed');

    const [failedRun] = await extractionRunRepository.listByCapture(capture.id);
    expect(failedRun).toMatchObject({ status: 'failed', errorCode: 'legacy_persistence_failed', attempt: 1 });
    expect(JSON.parse(failedRun!.rawJson).summary).toContain('General thought summary');
    await expect(captureRepository.getById(capture.id)).resolves.toMatchObject({ processingState: 'failed' });
  });

  it('runs cloud extraction through the same canonical persistence path after consent', async () => {
    const { capture } = await seedTranscriptCapture('We should extract this with the real model.');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          result: cloudResult,
          provider: 'cloud',
          model: 'gpt-test',
          promptVersion: 'extract-product-idea-v1',
        }),
        { status: 200 },
      ),
    );

    const snapshot = await ReviewService.runCloudExtraction({
      captureSessionId: capture.id,
      preset: 'product-idea',
      requestConsent: async () => true,
    });

    expect(snapshot.run).toMatchObject({
      provider: 'cloud',
      model: 'gpt-test',
      organizationPromptVersion: 'extract-product-idea-v1',
      status: 'succeeded',
    });
    expect(snapshot.nuggets[0]).toMatchObject({ title: 'Cloud nugget', status: 'pending' });
    await expect(captureRepository.getById(capture.id)).resolves.toMatchObject({ processingState: 'ready_for_review' });
  });
});

describe('ReviewService canonical review operations', () => {
  it('loads the current organized revision with classifier-ready categories and tags', async () => {
    const { capture } = await seedTranscriptCapture('Plan a neighborhood tool-sharing library for personal use.');
    await createMockCapturePipeline().run(capture.id);

    const snapshot = await ReviewService.load(capture.id);

    expect(snapshot.capture.id).toBe(capture.id);
    expect(snapshot.ideas).toHaveLength(1);
    expect(snapshot.categories.map((category) => category.name)).toEqual(['Work', 'School', 'Personal', 'Family', 'Misc']);
    expect(snapshot.tags.map((tag) => tag.id)).toEqual(expect.arrayContaining(snapshot.ideas[0]!.tagIds));
    expect(snapshot.ideas.every((idea) => idea.extractionRunId === snapshot.capture.activeExtractionRunId)).toBe(true);
  });

  it('returns no stale ideas when the current transcript has not been organized', async () => {
    const { capture } = await seedTranscriptCapture('Plan a personal reading tracker.');
    await createMockCapturePipeline().run(capture.id);
    await transcriptRepository.updateText(capture.id, 'Plan a personal reading tracker with school notes.');

    const snapshot = await ReviewService.load(capture.id);

    expect(snapshot.transcript.text).toContain('school notes');
    expect(snapshot.ideas).toEqual([]);
  });

  it('reloads only the remaining drafts after one idea is confirmed', async () => {
    const { capture } = await seedTranscriptCapture(
      'Plan a family archive.\n\nCreate a work handoff checklist.',
    );
    await createMockCapturePipeline().run(capture.id);
    const initial = await ReviewService.load(capture.id);
    expect(initial.ideas).toHaveLength(2);
    const [confirmedCandidate, remainingCandidate] = initial.ideas;

    await ReviewService.confirm(
      confirmedCandidate!.id,
      {
        title: confirmedCandidate!.title,
        summary: confirmedCandidate!.summary,
        purpose: confirmedCandidate!.purpose,
        goals: confirmedCandidate!.goals,
        problem: confirmedCandidate!.problem,
        blockers: confirmedCandidate!.blockers,
        questions: confirmedCandidate!.questions,
        suggestedActions: confirmedCandidate!.suggestedActions,
        research: confirmedCandidate!.research,
        categoryId: confirmedCandidate!.categoryId,
        tagIds: confirmedCandidate!.tagIds,
      },
      [],
    );

    const reloaded = await ReviewService.load(capture.id);
    expect(reloaded.capture.processingState).toBe('partially_confirmed');
    expect(reloaded.ideas.map((idea) => idea.id)).toEqual([remainingCandidate!.id]);
    expect(reloaded.ideas.every((idea) => idea.status === 'draft')).toBe(true);
  });

  it('confirms only named action suggestions and creates one action across repeated confirmation', async () => {
    const { capture } = await seedTranscriptCapture('Plan a work handoff checklist.');
    await createMockCapturePipeline().run(capture.id);
    const [draft] = await ideaRepository.listDraftsByCapture(capture.id);
    expect(draft?.suggestedActions[0]).toBeDefined();
    const input = confirmInput(draft!);
    const suggestionId = draft!.suggestedActions[0]!.id;

    await expect(ReviewService.confirm(draft!.id, input, ['invented-action-id'])).rejects.toThrow(
      'Accepted action suggestion was not part of this idea.',
    );
    await ReviewService.confirm(draft!.id, input, [suggestionId, suggestionId]);
    await ReviewService.confirm(draft!.id, input, [suggestionId]);

    await expect(actionItemRepository.listByIdea(draft!.id)).resolves.toEqual([
      expect.objectContaining({ sourceSuggestionId: suggestionId, text: draft!.suggestedActions[0]!.text }),
    ]);
    await expect(ideaRepository.getById(draft!.id)).resolves.toMatchObject({ status: 'confirmed' });
  });

  it('rolls back idea, capture, and newly accepted actions when a later action fails', async () => {
    const { capture } = await seedTranscriptCapture('Plan a work handoff and send two follow-up notes.');
    await createMockCapturePipeline().run(capture.id);
    const [originalDraft] = await ideaRepository.listDraftsByCapture(capture.id);
    const secondAction: GroundedText = {
      id: 'second-action',
      text: 'Send the second follow-up note.',
      basis: 'suggested',
      sourceSpanIds: [],
    };
    const draft = {
      ...originalDraft!,
      suggestedActions: [...originalDraft!.suggestedActions, secondAction],
    };
    await db.ideas.put(draft);
    const preExisting = await actionItemRepository.acceptSuggestion({
      ideaId: draft.id,
      sourceSuggestionId: 'pre-existing',
      text: 'Already accepted',
    });
    const originalAccept = actionItemRepository.acceptSuggestion.bind(actionItemRepository);
    const acceptSpy = vi.spyOn(actionItemRepository, 'acceptSuggestion');
    acceptSpy
      .mockImplementationOnce(originalAccept)
      .mockRejectedValueOnce(new Error('second action write failed'));

    await expect(
      ReviewService.confirm(
        draft.id,
        confirmInput(draft),
        draft.suggestedActions.map((suggestion) => suggestion.id),
      ),
    ).rejects.toThrow('second action write failed');

    await expect(ideaRepository.getById(draft.id)).resolves.toMatchObject({ status: 'draft' });
    await expect(captureRepository.getById(capture.id)).resolves.toMatchObject({
      processingState: 'ready_for_review',
    });
    await expect(actionItemRepository.listByIdea(draft.id)).resolves.toEqual([preExisting]);
  });

  it('discards drafts only and delegates reprocessing through the duplicate-safe processing service', async () => {
    const { capture } = await seedTranscriptCapture('Plan a family archive.');
    await createMockCapturePipeline().run(capture.id);
    const [draft] = await ideaRepository.listDraftsByCapture(capture.id);
    const enqueue = vi.fn(async () => undefined);
    const process = vi.fn(async () => undefined);
    const service = createReviewService({ enqueue, process });

    await service.reprocess(capture.id);
    expect(enqueue).toHaveBeenCalledWith(capture.id);
    expect(process).toHaveBeenCalledWith(capture.id);

    await service.discard(draft!.id);
    await expect(ideaRepository.getById(draft!.id)).resolves.toBeUndefined();
  });

  it('keeps a capture ready when one of two drafts is discarded', async () => {
    const { capture } = await seedTranscriptCapture('Plan a family archive.\n\nCreate a work checklist.');
    await createMockCapturePipeline().run(capture.id);
    const drafts = await ideaRepository.listDraftsByCapture(capture.id);
    expect(drafts).toHaveLength(2);

    await ReviewService.discard(drafts[0]!.id);

    await expect(ideaRepository.listDraftsByCapture(capture.id)).resolves.toHaveLength(1);
    await expect(captureRepository.getById(capture.id)).resolves.toMatchObject({
      processingState: 'ready_for_review',
    });
  });

  it('marks a capture confirmed after confirming one draft and discarding the last draft', async () => {
    const { capture } = await seedTranscriptCapture('Plan a family archive.\n\nCreate a work checklist.');
    await createMockCapturePipeline().run(capture.id);
    const drafts = await ideaRepository.listDraftsByCapture(capture.id);

    await ReviewService.confirm(drafts[0]!.id, confirmInput(drafts[0]!), []);
    await ReviewService.discard(drafts[1]!.id);

    await expect(captureRepository.getById(capture.id)).resolves.toMatchObject({
      processingState: 'confirmed',
    });
  });

  it('rolls back an orphan draft deletion when its parent capture cannot be updated', async () => {
    const timestamp = Date.now();
    const orphan: Idea = {
      id: 'orphan-draft',
      captureSessionId: 'missing-capture',
      status: 'draft',
      title: 'Orphan idea',
      summary: { id: 'orphan-summary', text: 'Keep this draft.', basis: 'inferred', sourceSpanIds: [] },
      goals: [],
      blockers: [],
      questions: [],
      suggestedActions: [],
      research: { needed: false, suggestedQueries: [], suggestedResourceTypes: [] },
      categoryId: 'category-misc',
      tagIds: [],
      sourceSpans: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await db.ideas.add(orphan);

    await expect(ReviewService.discard(orphan.id)).rejects.toThrow('Parent capture not found.');

    await expect(ideaRepository.getById(orphan.id)).resolves.toEqual(orphan);
  });
});
