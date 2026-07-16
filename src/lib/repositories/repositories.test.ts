import { afterEach, describe, expect, it } from 'vitest';
import { db, resetClientDatabaseForTests } from '@/lib/db';
import { DEFAULT_CATEGORIES, DEFAULT_CATEGORY_IDS } from '@/lib/db/defaultCategories';
import { ValidationError } from '@/lib/errors';
import {
  captureRepository,
  extractionRunRepository,
  ideaRepository,
  recordingRepository,
  transcriptRepository,
} from '@/lib/repositories';
import type { GroundedText, Idea, RecordingDraft } from '@/types';

const draft: RecordingDraft = {
  blob: new Blob(['audio-bytes'], { type: 'audio/webm' }),
  mimeType: 'audio/webm',
  durationMs: 1_234,
  sizeBytes: 11,
  waveformPreview: [0, 0.2, 0.1],
};

afterEach(async () => {
  await resetClientDatabaseForTests();
});

function grounded(id: string, text: string, basis: GroundedText['basis'] = 'inferred', sourceSpanIds: string[] = []): GroundedText {
  return { id, text, basis, sourceSpanIds };
}

function draftIdea(captureSessionId: string, id = crypto.randomUUID()): Idea {
  const timestamp = Date.now();
  return {
    id,
    captureSessionId,
    status: 'draft',
    title: 'Organize a neighborhood tool library',
    summary: grounded(`${id}-summary`, 'A shared lending system for nearby households.'),
    goals: [],
    blockers: [],
    questions: [],
    suggestedActions: [],
    research: { needed: false, suggestedQueries: [], suggestedResourceTypes: [] },
    categoryId: DEFAULT_CATEGORY_IDS.misc,
    tagIds: [],
    sourceSpans: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

describe('capture, recording, and transcript repositories', () => {
  it('stores recordings against capture sessions', async () => {
    const capture = await captureRepository.create({
      source: 'audio',
      durationMs: draft.durationMs,
      processingPreference: 'manual',
    });
    const recording = await recordingRepository.add(capture.id, draft);

    expect(recording.captureSessionId).toBe(capture.id);
    await expect(recordingRepository.getByCaptureId(capture.id)).resolves.toMatchObject({
      id: recording.id,
      sizeBytes: 11,
    });
    await expect(captureRepository.listRecent()).resolves.toContainEqual(expect.objectContaining({ id: capture.id }));
  });

  it('creates immutable transcript versions with deterministic content hashes', async () => {
    const capture = await captureRepository.create({ source: 'text', processingPreference: 'manual' });
    const transcriptV1 = await transcriptRepository.createVersion(capture.id, {
      text: 'Original transcript',
      provider: 'typed',
    });
    const transcriptV2 = await transcriptRepository.updateText(capture.id, 'Edited transcript');

    expect(transcriptV1.version).toBe(1);
    expect(transcriptV1.source).toBe('typed');
    expect(transcriptV2.version).toBe(2);
    expect(transcriptV2.source).toBe('edited');
    expect(transcriptV2.contentHash).not.toBe(transcriptV1.contentHash);
    await expect(transcriptRepository.listVersions(capture.id)).resolves.toEqual([
      expect.objectContaining({ id: transcriptV1.id, text: 'Original transcript' }),
      expect.objectContaining({ id: transcriptV2.id, text: 'Edited transcript' }),
    ]);
  });

  it('returns queued and due retryable captures as runnable', async () => {
    const capture = await captureRepository.create({
      source: 'audio',
      processingPreference: 'automatic',
      initialState: 'queued',
    });
    const retryable = await captureRepository.create({ source: 'text', processingPreference: 'automatic' });
    await captureRepository.transition(retryable.id, 'failed', {
      lastError: {
        stage: 'organization',
        code: 'temporary_failure',
        message: 'Try again.',
        retryable: true,
        occurredAt: Date.now(),
      },
      nextRetryAt: Date.now() - 1,
    });
    const futureRetry = await captureRepository.create({ source: 'text', processingPreference: 'automatic' });
    await captureRepository.transition(futureRetry.id, 'failed', {
      lastError: {
        stage: 'organization',
        code: 'backoff',
        message: 'Wait.',
        retryable: true,
        occurredAt: Date.now(),
      },
      nextRetryAt: Date.now() + 60_000,
    });

    expect(await captureRepository.listRunnable()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: capture.id }),
        expect.objectContaining({ id: retryable.id }),
      ]),
    );
    expect(await captureRepository.listRunnable()).not.toContainEqual(expect.objectContaining({ id: futureRetry.id }));
  });
});

describe('canonical idea repository', () => {
  it('rejects confirmation when explicit content has no source evidence', async () => {
    const capture = await captureRepository.create({ source: 'text', processingPreference: 'manual' });
    await db.categories.bulkAdd(DEFAULT_CATEGORIES);
    const idea = draftIdea(capture.id, 'idea-without-evidence');
    await ideaRepository.addDrafts([idea]);

    await expect(
      ideaRepository.confirm(idea.id, {
        title: idea.title,
        summary: grounded('explicit-summary', 'The user explicitly said this.', 'explicit'),
        goals: [],
        blockers: [],
        questions: [],
        suggestedActions: [],
        research: idea.research,
        categoryId: DEFAULT_CATEGORY_IDS.misc,
        tagIds: [],
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    await expect(ideaRepository.getById(idea.id)).resolves.toMatchObject({ status: 'draft' });
  });

  it('confirms grounded ideas and advances the parent capture state', async () => {
    const capture = await captureRepository.create({ source: 'text', processingPreference: 'manual' });
    await db.categories.bulkAdd(DEFAULT_CATEGORIES);
    const idea = {
      ...draftIdea(capture.id, 'grounded-idea'),
      sourceSpans: [{ id: 'source-1', startChar: 0, endChar: 14, quote: 'Build a library' }],
    };
    await ideaRepository.addDrafts([idea]);

    const confirmed = await ideaRepository.confirm(idea.id, {
      title: idea.title,
      summary: grounded('explicit-summary', 'Build a library', 'explicit', ['source-1']),
      goals: [],
      blockers: [],
      questions: [],
      suggestedActions: [],
      research: idea.research,
      categoryId: DEFAULT_CATEGORY_IDS.personal,
      tagIds: [],
    });

    expect(confirmed).toMatchObject({ status: 'confirmed', categoryId: DEFAULT_CATEGORY_IDS.personal });
    await expect(captureRepository.getById(capture.id)).resolves.toMatchObject({ processingState: 'confirmed' });
  });
});

describe('extraction run repository', () => {
  it('reuses a succeeded run at the same idempotency boundary', async () => {
    const capture = await captureRepository.create({ source: 'text', processingPreference: 'manual' });
    const transcript = await transcriptRepository.createVersion(capture.id, { text: 'One idea', provider: 'typed' });
    const input = {
      captureSessionId: capture.id,
      transcriptId: transcript.id,
      transcriptHash: transcript.contentHash,
      provider: 'test',
      model: 'test-model',
      reasoningEffort: 'medium',
      segmentationPromptVersion: 'segment-v1',
      organizationPromptVersion: 'organize-v1',
      schemaVersion: '2',
      idempotencyKey: `${capture.id}:${transcript.contentHash}:segmentation:2`,
      stage: 'segmenting' as const,
    };
    const first = await extractionRunRepository.start(input);
    await extractionRunRepository.complete(first.id, '{"ideas":[]}', 25);

    const second = await extractionRunRepository.start(input);

    expect(second.id).toBe(first.id);
    await expect(extractionRunRepository.listByCapture(capture.id)).resolves.toHaveLength(1);
  });
});
