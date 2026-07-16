import { afterEach, describe, expect, it, vi } from 'vitest';
import { db, resetClientDatabaseForTests } from '@/lib/db';
import {
  actionItemRepository,
  captureRepository,
  extractionRunRepository,
  nuggetRepository,
  questionRepository,
  transcriptRepository,
} from '@/lib/repositories';
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
