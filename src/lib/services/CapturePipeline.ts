import { ProviderError, StorageError, ValidationError } from '@/lib/errors';
import { cloudOrganizationProvider, mockOrganizationProvider } from '@/lib/providers/extraction';
import type {
  OrganizationProvider,
  OrganizationProviderDescriptor,
  OrganizeProviderOutput,
  SegmentProviderOutput,
} from '@/lib/providers/extraction/types';
import { cloudTranscriptionProvider } from '@/lib/providers/transcription/cloudProvider';
import { mockTranscriptionProvider } from '@/lib/providers/transcription/mockProvider';
import type { TranscriptionProvider } from '@/lib/providers/transcription/types';
import {
  captureRepository,
  categoryRepository,
  extractionRunRepository,
  ideaRepository,
  recordingRepository,
  settingsRepository,
  tagRepository,
  transcriptRepository,
} from '@/lib/repositories';
import { normalizeSegmentationSpans, validateOrganizationGrounding } from '@/lib/validation/grounding';
import { parseOrganizationResult, type OrganizationResult } from '@/lib/validation/organizationResult';
import { parseSegmentationResult, type SegmentationResult } from '@/lib/validation/segmentationResult';
import type {
  CaptureSession,
  Category,
  ExtractionRun,
  Idea,
  ProcessingError,
  ProcessingStage,
  Transcript,
} from '@/types';
import {
  classificationContextFingerprint,
  processingFingerprint,
} from './processingFingerprint';

const CANONICAL_PRESET = 'canonical';

export interface CapturePipeline {
  run(captureSessionId: string, signal?: AbortSignal): Promise<void>;
}

export interface CapturePipelineDependencies {
  organizationProvider: OrganizationProvider;
  transcriptionProvider: TranscriptionProvider;
}

interface StageResult<T> {
  run: ExtractionRun;
  result: T;
}

interface FailureDefinition {
  stage: ProcessingStage;
  code: string;
  message: string;
  retryable: boolean;
}

const failures = {
  consent: {
    stage: 'transcription',
    code: 'cloud_consent_required',
    message: 'Cloud processing consent is required.',
    retryable: false,
  },
  recordingMissing: {
    stage: 'transcription',
    code: 'recording_missing',
    message: 'The saved recording could not be found.',
    retryable: false,
  },
  transcriptMissing: {
    stage: 'transcription',
    code: 'transcript_missing',
    message: 'The saved transcript could not be found.',
    retryable: false,
  },
  transcription: {
    stage: 'transcription',
    code: 'transcription_failed',
    message: 'Transcription failed. Please try again.',
    retryable: true,
  },
  segmentation: {
    stage: 'segmentation',
    code: 'segmentation_failed',
    message: 'Idea separation failed. Please try again.',
    retryable: true,
  },
  organization: {
    stage: 'organization',
    code: 'organization_failed',
    message: 'Idea organization failed. Please try again.',
    retryable: true,
  },
  persistence: {
    stage: 'persistence',
    code: 'persistence_failed',
    message: 'Local processing results could not be saved. Please try again.',
    retryable: true,
  },
} as const satisfies Record<string, FailureDefinition>;

function processingError(failure: FailureDefinition): ProcessingError {
  return { ...failure, occurredAt: Date.now() };
}

async function markCaptureFailed(capture: CaptureSession, failure: FailureDefinition) {
  await captureRepository.transition(capture.id, 'failed', {
    recoverableStage: failure.stage,
    processingAttempt: capture.processingAttempt + 1,
    nextRetryAt: undefined,
    lastError: processingError(failure),
  });
}

async function bestEffortFailRun(runId: string, code: string, rawJson?: string) {
  try {
    await extractionRunRepository.fail(runId, code, rawJson);
  } catch {
    // Preserve the original provider or persistence error if local failure
    // bookkeeping itself is unavailable.
  }
}

async function requireCapture(captureSessionId: string) {
  const capture = await captureRepository.getById(captureSessionId);
  if (!capture) throw new ValidationError('Capture not found.');
  return capture;
}

function metadataMatchesSegmentation(
  output: SegmentProviderOutput,
  descriptor: OrganizationProviderDescriptor,
) {
  return (
    output.provider === descriptor.provider &&
    output.model === descriptor.model &&
    output.promptVersion === descriptor.segmentationPromptVersion &&
    output.schemaVersion === descriptor.segmentationSchemaVersion
  );
}

function metadataMatchesOrganization(
  output: OrganizeProviderOutput,
  descriptor: OrganizationProviderDescriptor,
) {
  return (
    output.provider === descriptor.provider &&
    output.model === descriptor.model &&
    output.promptVersion === descriptor.organizationPromptVersion &&
    output.schemaVersion === descriptor.organizationSchemaVersion
  );
}

function stageFingerprint(
  capture: CaptureSession,
  transcript: Transcript,
  descriptor: OrganizationProviderDescriptor,
  stage: 'segmentation' | 'organization',
  contextFingerprint?: string,
) {
  return processingFingerprint({
    captureSessionId: capture.id,
    transcriptId: transcript.id,
    transcriptHash: transcript.contentHash,
    provider: descriptor.provider,
    model: descriptor.model,
    reasoningEffort: descriptor.reasoningEffort,
    preset: CANONICAL_PRESET,
    segmentationPromptVersion: descriptor.segmentationPromptVersion,
    organizationPromptVersion: descriptor.organizationPromptVersion,
    stage,
    schemaVersion:
      stage === 'segmentation'
        ? descriptor.segmentationSchemaVersion
        : descriptor.organizationSchemaVersion,
    classificationContextFingerprint: contextFingerprint,
  });
}

function startRunInput(
  capture: CaptureSession,
  transcript: Transcript,
  descriptor: OrganizationProviderDescriptor,
  stage: 'segmentation' | 'organization',
  idempotencyKey: string,
) {
  return {
    captureSessionId: capture.id,
    transcriptId: transcript.id,
    transcriptHash: transcript.contentHash,
    provider: descriptor.provider,
    model: descriptor.model,
    reasoningEffort: descriptor.reasoningEffort,
    segmentationPromptVersion: descriptor.segmentationPromptVersion,
    organizationPromptVersion: descriptor.organizationPromptVersion,
    schemaVersion:
      stage === 'segmentation'
        ? descriptor.segmentationSchemaVersion
        : descriptor.organizationSchemaVersion,
    idempotencyKey,
    stage: stage === 'segmentation' ? ('segmenting' as const) : ('organizing' as const),
  };
}

async function materializeDraftIdeas(input: {
  capture: CaptureSession;
  transcript: Transcript;
  segmentation: SegmentationResult;
  organization: OrganizationResult;
  organizationRun: ExtractionRun;
  categories: Category[];
}) {
  const { capture, transcript, segmentation, organization, organizationRun, categories } = input;
  validateOrganizationGrounding(segmentation, organization);

  const segmentedCandidates = new Map(segmentation.ideas.map((candidate) => [candidate.candidateId, candidate]));
  const allowedCategoryIds = new Set(categories.map((category) => category.id));
  const prepared = organization.ideas.map((candidate) => {
    const segmented = segmentedCandidates.get(candidate.candidateId);
    if (!segmented) throw new ValidationError('Organization referenced an unknown candidate.');
    if (!allowedCategoryIds.has(candidate.categoryId)) {
      throw new ValidationError('Organization returned an unknown category.');
    }
    return { candidate, segmented };
  });

  const timestamp = Date.now();
  const ideas: Idea[] = [];
  for (const { candidate, segmented } of prepared) {
    const tags = await tagRepository.findOrCreate(candidate.tags);
    ideas.push({
      // Provider candidate IDs are unique within a persisted organization run.
      // Keeping this identity stable lets materialization recover without
      // duplicating (or overwriting) an already-confirmed candidate.
      id: `idea:${organizationRun.id}:${candidate.candidateId}`,
      captureSessionId: capture.id,
      extractionRunId: organizationRun.id,
      status: 'draft',
      title: candidate.title,
      summary: candidate.summary,
      ...(candidate.purpose === null ? {} : { purpose: candidate.purpose }),
      goals: candidate.goals,
      ...(candidate.problem === null
        ? {}
        : {
            problem: {
              statement: candidate.problem.statement,
              ...(candidate.problem.type === null ? {} : { type: candidate.problem.type }),
            },
          }),
      blockers: candidate.blockers,
      questions: candidate.questions,
      suggestedActions: candidate.suggestedActions,
      research: {
        needed: candidate.research.needed,
        ...(candidate.research.assessment === null
          ? {}
          : { assessment: candidate.research.assessment }),
        suggestedQueries: candidate.research.suggestedQueries,
        suggestedResourceTypes: candidate.research.suggestedResourceTypes,
      },
      categoryId: candidate.categoryId,
      categoryConfidence: candidate.categoryConfidence,
      tagIds: tags.map((tag) => tag.id),
      sourceSpans: segmented.sourceSpans,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  await ideaRepository.replaceDraftsForTranscript(capture.id, transcript.contentHash, ideas);
}

export function createCapturePipeline(
  dependencies: Partial<CapturePipelineDependencies> = {},
): CapturePipeline {
  const organizationProvider = dependencies.organizationProvider ?? cloudOrganizationProvider;
  const transcriptionProvider = dependencies.transcriptionProvider ?? cloudTranscriptionProvider;

  async function runOrReuseSegmentation(
    capture: CaptureSession,
    transcript: Transcript,
    safetyIdentifier: string,
    signal?: AbortSignal,
  ): Promise<StageResult<SegmentationResult>> {
    let run: ExtractionRun | undefined;
    let rawJson: string | undefined;
    try {
      const descriptor = await organizationProvider.getDescriptor();
      const idempotencyKey = stageFingerprint(capture, transcript, descriptor, 'segmentation');
      run = await extractionRunRepository.start(
        startRunInput(capture, transcript, descriptor, 'segmentation', idempotencyKey),
      );
      if (run.status === 'succeeded') {
        rawJson = run.rawJson;
        const parsed = parseSegmentationResult(JSON.parse(rawJson));
        return { run, result: normalizeSegmentationSpans(transcript.text, parsed) };
      }

      const output = await organizationProvider.segment({
        captureSessionId: capture.id,
        transcript,
        safetyIdentifier,
        signal,
      });
      const result = normalizeSegmentationSpans(
        transcript.text,
        parseSegmentationResult(output.result),
      );
      rawJson = JSON.stringify(result);
      if (!metadataMatchesSegmentation(output, descriptor)) {
        throw new ProviderError('Segmentation provider metadata did not match its descriptor.');
      }
      const startedAt = run.startedAt;
      await extractionRunRepository.complete(run.id, rawJson, Math.max(0, Date.now() - startedAt));
      return {
        run: { ...run, status: 'succeeded', rawJson, completedAt: Date.now() },
        result,
      };
    } catch (error) {
      const failure = error instanceof StorageError ? failures.persistence : failures.segmentation;
      if (run) await bestEffortFailRun(run.id, failure.code, rawJson);
      await markCaptureFailed(capture, failure);
      throw error;
    }
  }

  async function runOrReuseOrganization(
    capture: CaptureSession,
    transcript: Transcript,
    segmentation: SegmentationResult,
    categories: Category[],
    safetyIdentifier: string,
    signal?: AbortSignal,
  ): Promise<StageResult<OrganizationResult>> {
    let run: ExtractionRun | undefined;
    let rawJson: string | undefined;
    try {
      const descriptor = await organizationProvider.getDescriptor();
      const contextFingerprint = classificationContextFingerprint(categories);
      const idempotencyKey = stageFingerprint(
        capture,
        transcript,
        descriptor,
        'organization',
        contextFingerprint,
      );
      run = await extractionRunRepository.start(
        startRunInput(capture, transcript, descriptor, 'organization', idempotencyKey),
      );
      const allowedCategoryIds = new Set(categories.map((category) => category.id));
      if (run.status === 'succeeded') {
        rawJson = run.rawJson;
        const result = parseOrganizationResult(JSON.parse(rawJson));
        validateOrganizationGrounding(segmentation, result);
        if (result.ideas.some((idea) => !allowedCategoryIds.has(idea.categoryId))) {
          throw new ValidationError('Persisted organization referenced an unknown category.');
        }
        return { run, result };
      }

      const output = await organizationProvider.organize({
        captureSessionId: capture.id,
        transcript,
        segmentation,
        categories,
        safetyIdentifier,
        signal,
      });
      const result = parseOrganizationResult(output.result);
      validateOrganizationGrounding(segmentation, result);
      rawJson = JSON.stringify(result);
      if (!metadataMatchesOrganization(output, descriptor)) {
        throw new ProviderError('Organization provider metadata did not match its descriptor.');
      }
      if (result.ideas.some((idea) => !allowedCategoryIds.has(idea.categoryId))) {
        throw new ValidationError('Organization returned an unknown category.');
      }
      await extractionRunRepository.complete(
        run.id,
        rawJson,
        Math.max(0, Date.now() - run.startedAt),
      );
      return {
        run: { ...run, status: 'succeeded', rawJson, completedAt: Date.now() },
        result,
      };
    } catch (error) {
      const failure = error instanceof StorageError ? failures.persistence : failures.organization;
      if (run) await bestEffortFailRun(run.id, failure.code, rawJson);
      await markCaptureFailed(capture, failure);
      throw error;
    }
  }

  return {
    async run(captureSessionId, signal) {
      const capture = await requireCapture(captureSessionId);
      const settings = await settingsRepository.get();
      let transcript = await transcriptRepository.getCurrent(capture.id);
      const requiresCloudConsent =
        organizationProvider.mode === 'cloud' ||
        (!transcript && capture.source === 'audio' && transcriptionProvider.mode === 'cloud');
      if (requiresCloudConsent && settings.cloudProcessingConsent !== 'granted') {
        await markCaptureFailed(capture, failures.consent);
        return;
      }

      if (!transcript) {
        if (capture.source !== 'audio') {
          await markCaptureFailed(capture, failures.transcriptMissing);
          return;
        }
        const recording = await recordingRepository.getByCaptureId(capture.id);
        if (!recording) {
          await markCaptureFailed(capture, failures.recordingMissing);
          return;
        }
        await captureRepository.transition(capture.id, 'transcribing');
        try {
          const result = await transcriptionProvider.transcribe({
            captureSessionId: capture.id,
            recordingId: recording.id,
            audioBlob: recording.blob,
            signal,
          });
          transcript = await transcriptRepository.createVersion(capture.id, result);
          await captureRepository.transition(capture.id, 'transcript_ready', {
            transcriptId: transcript.id,
          });
        } catch (error) {
          const failure = error instanceof StorageError ? failures.persistence : failures.transcription;
          await markCaptureFailed(capture, failure);
          throw error;
        }
      }

      let categories: Category[];
      try {
        categories = await categoryRepository.ensureDefaults();
      } catch (error) {
        await markCaptureFailed(capture, failures.persistence);
        throw error;
      }
      await captureRepository.transition(capture.id, 'segmenting');
      const segmentation = await runOrReuseSegmentation(
        capture,
        transcript,
        settings.clientId,
        signal,
      );

      await captureRepository.transition(capture.id, 'organizing');
      const organization = await runOrReuseOrganization(
        capture,
        transcript,
        segmentation.result,
        categories,
        settings.clientId,
        signal,
      );

      try {
        await materializeDraftIdeas({
          capture,
          transcript,
          segmentation: segmentation.result,
          organization: organization.result,
          organizationRun: organization.run,
          categories,
        });
        await captureRepository.transition(capture.id, 'ready_for_review', {
          activeExtractionRunId: organization.run.id,
          recoverableStage: undefined,
          nextRetryAt: undefined,
          lastError: undefined,
        });
      } catch (error) {
        await markCaptureFailed(capture, failures.persistence);
        throw error;
      }
    },
  };
}

export const capturePipeline = createCapturePipeline();

export function createMockCapturePipeline() {
  return createCapturePipeline({
    organizationProvider: mockOrganizationProvider,
    transcriptionProvider: mockTranscriptionProvider,
  });
}
