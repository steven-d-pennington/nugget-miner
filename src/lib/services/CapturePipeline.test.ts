import { afterEach, describe, expect, it, vi } from 'vitest';
import { db, resetClientDatabaseForTests } from '@/lib/db';
import { DEFAULT_CATEGORY_IDS } from '@/lib/db/defaultCategories';
import { ProviderError } from '@/lib/errors';
import { mockOrganizationProvider } from '@/lib/providers/extraction/mockProvider';
import type { OrganizationProvider } from '@/lib/providers/extraction/types';
import type { TranscriptionProvider } from '@/lib/providers/transcription/types';
import {
  captureRepository,
  categoryRepository,
  extractionRunRepository,
  ideaRepository,
  transcriptRepository,
} from '@/lib/repositories';
import type { Idea } from '@/types';
import { CaptureService } from './CaptureService';
import { createCapturePipeline } from './CapturePipeline';
import {
  classificationContextFingerprint,
  processingFingerprint,
} from './processingFingerprint';

afterEach(async () => {
  vi.restoreAllMocks();
  await resetClientDatabaseForTests();
});

function fakeTranscriber(overrides: Partial<TranscriptionProvider> = {}): TranscriptionProvider {
  return {
    id: 'test-transcriber',
    label: 'Test transcriber',
    mode: 'mock',
    async isAvailable() {
      return true;
    },
    async transcribe() {
      return { text: 'A transcribed neighborhood project.', provider: 'test-transcriber' };
    },
    ...overrides,
  };
}

function instrumentedOrganizer(overrides: Partial<OrganizationProvider> = {}) {
  const getDescriptor = vi.fn(mockOrganizationProvider.getDescriptor.bind(mockOrganizationProvider));
  const segment = vi.fn(mockOrganizationProvider.segment.bind(mockOrganizationProvider));
  const organize = vi.fn(mockOrganizationProvider.organize.bind(mockOrganizationProvider));
  const provider: OrganizationProvider = {
    ...mockOrganizationProvider,
    getDescriptor,
    segment,
    organize,
    ...overrides,
  };
  return { provider, getDescriptor, segment, organize };
}

async function textCapture(text: string) {
  return CaptureService.saveText({ text, processingPreference: 'manual' });
}

async function audioCapture() {
  return CaptureService.saveRecording({
    processingPreference: 'manual',
    draft: {
      blob: new Blob(['audio'], { type: 'audio/webm' }),
      mimeType: 'audio/webm',
      durationMs: 1_000,
      sizeBytes: 5,
      waveformPreview: [0.2, 0.7],
    },
  });
}

function confirmationInput(idea: Idea) {
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

describe('CapturePipeline', () => {
  it('transcribes an audio capture before segmentation', async () => {
    const events: string[] = [];
    const transcriber = fakeTranscriber({
      transcribe: vi.fn(async () => {
        events.push('transcribe');
        return { text: 'Plan a family photo archive.', provider: 'test-transcriber' };
      }),
    });
    const base = instrumentedOrganizer();
    const provider: OrganizationProvider = {
      ...base.provider,
      segment: vi.fn(async (input) => {
        events.push('segment');
        return mockOrganizationProvider.segment(input);
      }),
      organize: vi.fn(async (input) => {
        events.push('organize');
        return mockOrganizationProvider.organize(input);
      }),
    };
    const { capture } = await audioCapture();

    await createCapturePipeline({ organizationProvider: provider, transcriptionProvider: transcriber }).run(capture.id);

    expect(events).toEqual(['transcribe', 'segment', 'organize']);
    await expect(transcriptRepository.getCurrent(capture.id)).resolves.toMatchObject({ provider: 'test-transcriber' });
  });

  it('skips transcription for text and materializes one draft per paragraph', async () => {
    const transcribe = vi.fn();
    const { capture } = await textCapture('Plan a work handoff template.\n\nBuild a personal tool library.');
    const pipeline = createCapturePipeline({
      organizationProvider: mockOrganizationProvider,
      transcriptionProvider: fakeTranscriber({ transcribe }),
    });

    await pipeline.run(capture.id);

    expect(transcribe).not.toHaveBeenCalled();
    const ideas = await ideaRepository.listDraftsByCapture(capture.id);
    expect(ideas).toHaveLength(2);
    expect(ideas.every((idea) => idea.sourceSpans.length === 1 && idea.extractionRunId)).toBe(true);
    await expect(captureRepository.getById(capture.id)).resolves.toMatchObject({ processingState: 'ready_for_review' });
  });

  it('requires consent before any selected cloud provider is consulted', async () => {
    const { capture } = await textCapture('A private thought that must stay local.');
    const descriptor = vi.fn(mockOrganizationProvider.getDescriptor.bind(mockOrganizationProvider));
    const segment = vi.fn(mockOrganizationProvider.segment.bind(mockOrganizationProvider));
    const provider: OrganizationProvider = {
      ...mockOrganizationProvider,
      mode: 'cloud',
      getDescriptor: descriptor,
      segment,
    };

    await createCapturePipeline({ organizationProvider: provider }).run(capture.id);

    expect(descriptor).not.toHaveBeenCalled();
    expect(segment).not.toHaveBeenCalled();
    await expect(captureRepository.getById(capture.id)).resolves.toMatchObject({
      processingState: 'failed',
      recoverableStage: 'transcription',
      lastError: { code: 'cloud_consent_required', retryable: false },
    });
  });

  it('preserves a transcript and records a retryable sanitized provider failure', async () => {
    const { capture, transcript } = await textCapture('failed-extraction-fixture');
    const pipeline = createCapturePipeline({ organizationProvider: mockOrganizationProvider });

    await expect(pipeline.run(capture.id)).rejects.toThrow('Mock extraction fixture failed.');

    await expect(transcriptRepository.getCurrent(capture.id)).resolves.toMatchObject({ id: transcript!.id });
    await expect(captureRepository.getById(capture.id)).resolves.toMatchObject({
      processingState: 'failed',
      lastError: {
        stage: 'segmentation',
        code: 'segmentation_failed',
        message: 'Idea separation failed. Please try again.',
        retryable: true,
      },
    });
  });

  it('reuses successful segmentation while retrying a failed organization attempt', async () => {
    const { capture } = await textCapture('Plan a work project handoff.');
    const base = instrumentedOrganizer();
    const organize = vi
      .fn(mockOrganizationProvider.organize.bind(mockOrganizationProvider))
      .mockRejectedValueOnce(new ProviderError('Temporary organization failure.'));
    const provider = { ...base.provider, organize };
    const pipeline = createCapturePipeline({ organizationProvider: provider });

    await expect(pipeline.run(capture.id)).rejects.toThrow('Temporary organization failure.');
    await pipeline.run(capture.id);

    expect(base.segment).toHaveBeenCalledTimes(1);
    expect(organize).toHaveBeenCalledTimes(2);
    const runs = await extractionRunRepository.listByCapture(capture.id);
    expect(runs.map((run) => [run.stage, run.status, run.attempt])).toEqual([
      ['segmenting', 'succeeded', 1],
      ['organizing', 'failed', 1],
      ['organizing', 'succeeded', 2],
    ]);
  });

  it('keeps confirmed ideas when the same transcript is processed again', async () => {
    const { capture } = await textCapture('Build a family photo archive.');
    const pipeline = createCapturePipeline({ organizationProvider: mockOrganizationProvider });
    await pipeline.run(capture.id);
    const [draft] = await ideaRepository.listDraftsByCapture(capture.id);
    expect(draft).toBeDefined();
    await ideaRepository.confirm(draft!.id, {
      ...confirmationInput(draft!),
      title: 'My edited family archive title',
    });

    await pipeline.run(capture.id);

    const ideas = await ideaRepository.listByCapture(capture.id);
    expect(ideas).toEqual([
      expect.objectContaining({
        id: draft!.id,
        status: 'confirmed',
        title: 'My edited family archive title',
      }),
    ]);
    await expect(ideaRepository.listDraftsByCapture(capture.id)).resolves.toHaveLength(0);
  });

  it('changes only organization reuse when category classifier context changes', async () => {
    const { capture } = await textCapture('Plan a client workflow.');
    const base = instrumentedOrganizer();
    const pipeline = createCapturePipeline({ organizationProvider: base.provider });
    await pipeline.run(capture.id);
    await categoryRepository.update(DEFAULT_CATEGORY_IDS.work, {
      description: 'Professional client delivery, workplace systems, team projects, and consulting engagements.',
    });

    await pipeline.run(capture.id);

    expect(base.segment).toHaveBeenCalledTimes(1);
    expect(base.organize).toHaveBeenCalledTimes(2);
    const runs = await extractionRunRepository.listByCapture(capture.id);
    expect(runs.filter((run) => run.stage === 'segmenting')).toHaveLength(1);
    expect(runs.filter((run) => run.stage === 'organizing')).toHaveLength(2);
  });

  it('rejects descriptor-mismatched output and retries without corrupt reuse', async () => {
    const { capture } = await textCapture('Plan a personal home project.');
    const base = instrumentedOrganizer();
    const organize = vi.fn(async (input: Parameters<OrganizationProvider['organize']>[0]) => {
      const output = await mockOrganizationProvider.organize(input);
      return organize.mock.calls.length === 1 ? { ...output, model: 'unexpected-model' } : output;
    });
    const pipeline = createCapturePipeline({ organizationProvider: { ...base.provider, organize } });

    await expect(pipeline.run(capture.id)).rejects.toThrow('metadata did not match');
    await pipeline.run(capture.id);

    const organizationRuns = (await extractionRunRepository.listByCapture(capture.id)).filter(
      (run) => run.stage === 'organizing',
    );
    expect(organizationRuns).toMatchObject([
      { status: 'failed', attempt: 1, errorCode: 'organization_failed' },
      { status: 'succeeded', attempt: 2 },
    ]);
    expect(JSON.parse(organizationRuns[0]!.rawJson).ideas).toHaveLength(1);
    expect(base.segment).toHaveBeenCalledTimes(1);
    expect(organize).toHaveBeenCalledTimes(2);
  });

  it('recovers materialization after a succeeded run without new model calls', async () => {
    const { capture } = await textCapture('Build a neighborhood resource list.');
    const base = instrumentedOrganizer();
    const pipeline = createCapturePipeline({ organizationProvider: base.provider });
    vi.spyOn(ideaRepository, 'replaceDraftsForTranscript').mockRejectedValueOnce(new Error('disk full'));

    await expect(pipeline.run(capture.id)).rejects.toThrow('disk full');
    await expect(captureRepository.getById(capture.id)).resolves.toMatchObject({
      processingState: 'failed',
      lastError: { stage: 'persistence', code: 'persistence_failed', retryable: true },
    });
    await pipeline.run(capture.id);

    expect(base.segment).toHaveBeenCalledTimes(1);
    expect(base.organize).toHaveBeenCalledTimes(1);
    await expect(ideaRepository.listDraftsByCapture(capture.id)).resolves.toHaveLength(1);
  });

  it('classifies a run-completion storage failure as persistence and retries safely', async () => {
    const { capture } = await textCapture('Build a neighborhood resource list.');
    const base = instrumentedOrganizer();
    const pipeline = createCapturePipeline({ organizationProvider: base.provider });
    const update = vi
      .spyOn(db.extractionRuns, 'update')
      .mockRejectedValueOnce(new Error('IndexedDB completion write failed'));

    await expect(pipeline.run(capture.id)).rejects.toThrow('IndexedDB completion write failed');
    await expect(captureRepository.getById(capture.id)).resolves.toMatchObject({
      processingState: 'failed',
      recoverableStage: 'persistence',
      lastError: { stage: 'persistence', code: 'persistence_failed', retryable: true },
    });
    const [failedRun] = await extractionRunRepository.listByCapture(capture.id);
    expect(failedRun).toMatchObject({
      stage: 'segmenting',
      status: 'failed',
      errorCode: 'persistence_failed',
      attempt: 1,
    });
    expect(() => JSON.parse(failedRun!.rawJson)).not.toThrow();

    update.mockRestore();
    await pipeline.run(capture.id);

    const segmentationRuns = (await extractionRunRepository.listByCapture(capture.id)).filter(
      (run) => run.stage === 'segmenting',
    );
    expect(segmentationRuns).toMatchObject([
      { status: 'failed', errorCode: 'persistence_failed', attempt: 1 },
      { status: 'succeeded', attempt: 2 },
    ]);
    expect(base.segment).toHaveBeenCalledTimes(2);
    expect(base.organize).toHaveBeenCalledTimes(1);
    await expect(ideaRepository.listDraftsByCapture(capture.id)).resolves.toHaveLength(1);
  });

  it('marks descriptor failures and recovers instead of leaving a capture stuck', async () => {
    const { capture } = await textCapture('Plan a school research project.');
    const base = instrumentedOrganizer();
    base.getDescriptor.mockRejectedValueOnce(new ProviderError('Configuration unavailable.'));
    const pipeline = createCapturePipeline({ organizationProvider: base.provider });

    await expect(pipeline.run(capture.id)).rejects.toThrow('Configuration unavailable.');
    await expect(captureRepository.getById(capture.id)).resolves.toMatchObject({
      processingState: 'failed',
      recoverableStage: 'segmentation',
      lastError: { code: 'segmentation_failed', retryable: true },
    });
    await pipeline.run(capture.id);
    await expect(captureRepository.getById(capture.id)).resolves.toMatchObject({ processingState: 'ready_for_review' });
  });

  it('demotes corrupt reused output so the next retry can allocate a fresh attempt', async () => {
    const { capture, transcript } = await textCapture('Plan a work project.');
    const categories = await categoryRepository.ensureDefaults();
    const descriptor = await mockOrganizationProvider.getDescriptor();
    const key = processingFingerprint({
      captureSessionId: capture.id,
      transcriptId: transcript!.id,
      transcriptHash: transcript!.contentHash,
      provider: descriptor.provider,
      model: descriptor.model,
      reasoningEffort: descriptor.reasoningEffort,
      preset: 'canonical',
      segmentationPromptVersion: descriptor.segmentationPromptVersion,
      organizationPromptVersion: descriptor.organizationPromptVersion,
      stage: 'segmentation',
      schemaVersion: descriptor.segmentationSchemaVersion,
    });
    const corrupt = await extractionRunRepository.start({
      captureSessionId: capture.id,
      transcriptId: transcript!.id,
      transcriptHash: transcript!.contentHash,
      provider: descriptor.provider,
      model: descriptor.model,
      reasoningEffort: descriptor.reasoningEffort,
      segmentationPromptVersion: descriptor.segmentationPromptVersion,
      organizationPromptVersion: descriptor.organizationPromptVersion,
      schemaVersion: descriptor.segmentationSchemaVersion,
      idempotencyKey: key,
      stage: 'segmenting',
    });
    await extractionRunRepository.complete(corrupt.id, '{not-json', 0);
    const base = instrumentedOrganizer();
    const pipeline = createCapturePipeline({ organizationProvider: base.provider });

    await expect(pipeline.run(capture.id)).rejects.toThrow();
    await expect(extractionRunRepository.getById(corrupt.id)).resolves.toMatchObject({
      status: 'failed',
      errorCode: 'segmentation_failed',
    });
    await pipeline.run(capture.id);

    expect(base.segment).toHaveBeenCalledTimes(1);
    const segmentRuns = (await extractionRunRepository.listByCapture(capture.id)).filter(
      (run) => run.stage === 'segmenting',
    );
    expect(segmentRuns.map((run) => [run.status, run.attempt])).toEqual([
      ['failed', 1],
      ['succeeded', 2],
    ]);
    expect(classificationContextFingerprint(categories)).toContain('description');
  });
});
