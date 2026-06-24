import { afterEach, describe, expect, it, vi } from 'vitest';
import { db, resetClientDatabaseForTests } from '@/lib/db';
import { actionItemRepository, extractionRunRepository, ideaRepository, nuggetRepository, questionRepository, transcriptRepository } from '@/lib/repositories';
import { ReviewService } from './ReviewService';

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

async function seedTranscribedIdea(text = 'We should build a review flow. It needs source-linked suggestions. What should happen next?') {
  const idea = await ideaRepository.create({ durationMs: 1000, status: 'transcribed' });
  const transcript = await transcriptRepository.upsert(idea.id, { text, provider: 'mock' });
  return { idea, transcript };
}

describe('ReviewService', () => {
  it('runs mock extraction, persists a run, and materializes pending suggestions', async () => {
    const { idea } = await seedTranscribedIdea();

    const snapshot = await ReviewService.runMockExtraction({ ideaId: idea.id, preset: 'product-idea' });

    expect(snapshot.run.preset).toBe('product-idea');
    await expect(extractionRunRepository.latestForIdea(idea.id)).resolves.toMatchObject({ id: snapshot.run.id, status: 'complete' });
    await expect(nuggetRepository.listByRun(snapshot.run.id)).resolves.toHaveLength(snapshot.nuggets.length);
    await expect(questionRepository.listByRun(snapshot.run.id)).resolves.toHaveLength(snapshot.questions.length);
    await expect(ideaRepository.getById(idea.id)).resolves.toMatchObject({ status: 'reviewed' });
  });

  it('accepts and rejects suggestions and creates linked action items', async () => {
    const { idea } = await seedTranscribedIdea('Remember to send the launch notes. We need a follow up action.');
    const snapshot = await ReviewService.runMockExtraction({ ideaId: idea.id, preset: 'work-reminder' });
    const firstNugget = snapshot.nuggets[0];
    const firstQuestion = snapshot.questions[0];

    expect(firstNugget).toBeDefined();
    expect(firstQuestion).toBeDefined();

    await ReviewService.acceptNugget(firstNugget!.id);
    await ReviewService.rejectQuestion(firstQuestion!.id);
    const action = await ReviewService.acceptAction(snapshot.run.id, 0, { title: 'Send launch notes' });

    await expect(nuggetRepository.listByRun(snapshot.run.id)).resolves.toContainEqual(expect.objectContaining({ id: firstNugget!.id, status: 'accepted' }));
    await expect(questionRepository.listByRun(snapshot.run.id)).resolves.toContainEqual(expect.objectContaining({ id: firstQuestion!.id, status: 'rejected' }));
    await expect(actionItemRepository.listByIdea(idea.id)).resolves.toContainEqual(expect.objectContaining({ id: action.id, title: 'Send launch notes', status: 'open' }));
    await expect(ideaRepository.getById(idea.id)).resolves.toMatchObject({ actionCount: 1 });
  });

  it('creates a new extraction run on regenerate without deleting old runs', async () => {
    const { idea } = await seedTranscribedIdea();

    const first = await ReviewService.runMockExtraction({ ideaId: idea.id, preset: 'general-thought' });
    const second = await ReviewService.runMockExtraction({ ideaId: idea.id, preset: 'story-idea' });

    expect(second.run.id).not.toBe(first.run.id);
    await expect(db.extractionRuns.where('ideaId').equals(idea.id).count()).resolves.toBe(2);
  });

  it('runs cloud extraction through the same persistence path after consent', async () => {
    const { idea } = await seedTranscribedIdea('We should extract this with the real model.');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ result: cloudResult, provider: 'cloud', model: 'gpt-test', promptVersion: 'extract-product-idea-v1' }), { status: 200 }),
    );

    const snapshot = await ReviewService.runCloudExtraction({ ideaId: idea.id, preset: 'product-idea', requestConsent: async () => true });

    expect(snapshot.run).toMatchObject({ provider: 'cloud', promptVersion: 'extract-product-idea-v1', preset: 'product-idea' });
    expect(snapshot.nuggets[0]).toMatchObject({ title: 'Cloud nugget', status: 'pending' });
    await expect(ideaRepository.getById(idea.id)).resolves.toMatchObject({ status: 'reviewed' });
  });
});
