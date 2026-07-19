export type CaptureSource = 'audio' | 'text';
export type ProcessingStage = 'transcription' | 'segmentation' | 'organization' | 'persistence';
export type ProcessingState =
  | 'saved'
  | 'queued'
  | 'transcribing'
  | 'transcript_ready'
  | 'segmenting'
  | 'organizing'
  | 'ready_for_review'
  | 'partially_confirmed'
  | 'confirmed'
  | 'failed';
export type ContentBasis = 'explicit' | 'inferred' | 'suggested';
export type IdeaStatus = 'draft' | 'confirmed' | 'archived';
export type CloudProcessingConsent = 'unknown' | 'granted' | 'denied';
export type ActionStatus = 'open' | 'completed';
export type ActivationIntent = 'explore' | 'plan' | 'agent';

export type ProviderMode = 'mock' | 'local' | 'browser' | 'cloud';
export type Priority = 'low' | 'medium' | 'high';
export type ExtractionPreset = 'product-idea' | 'work-reminder' | 'story-idea' | 'general-thought';

export interface ProcessingError {
  stage: ProcessingStage;
  code: string;
  message: string;
  retryable: boolean;
  occurredAt: number;
}

export interface CaptureSession {
  id: string;
  source: CaptureSource;
  recordingId?: string;
  transcriptId?: string;
  activeExtractionRunId?: string;
  processingState: ProcessingState;
  recoverableStage?: ProcessingStage;
  processingPreference: 'automatic' | 'manual';
  processingAttempt: number;
  nextRetryAt?: number;
  lastError?: ProcessingError;
  durationMs: number;
  createdAt: number;
  updatedAt: number;
}

export interface SourceSpan {
  id: string;
  startChar: number;
  endChar: number;
  quote: string;
}

export interface GroundedText {
  id: string;
  text: string;
  basis: ContentBasis;
  sourceSpanIds: string[];
}

export interface Idea {
  id: string;
  captureSessionId: string;
  extractionRunId?: string;
  status: IdeaStatus;
  title: string;
  summary: GroundedText;
  purpose?: GroundedText;
  goals: GroundedText[];
  problem?: { statement: GroundedText; type?: string };
  blockers: GroundedText[];
  questions: GroundedText[];
  suggestedActions: GroundedText[];
  research: {
    needed: boolean;
    assessment?: GroundedText;
    suggestedQueries: string[];
    suggestedResourceTypes: string[];
  };
  categoryId: string;
  categoryConfidence?: number;
  tagIds: string[];
  sourceSpans: SourceSpan[];
  createdAt: number;
  updatedAt: number;
  confirmedAt?: number;
}

export interface Category {
  id: string;
  name: string;
  normalizedName: string;
  description: string;
  isDefault: boolean;
  isFallback: boolean;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface Tag {
  id: string;
  name: string;
  normalizedName: string;
  createdAt: number;
}

export interface ActionItem {
  id: string;
  ideaId: string;
  sourceSuggestionId?: string;
  text: string;
  status: ActionStatus;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface ActivationQuestion {
  id: string;
  question: string;
  reason: string;
  answer?: string;
}

export interface ActivationBriefContent {
  title: string;
  objective: string;
  context: string;
  assumptions: string[];
  constraints: string[];
  deliverables: string[];
  successCriteria: string[];
  prompt: string;
}

export interface ActivationBrief {
  id: string;
  ideaId: string;
  intent: ActivationIntent;
  includeTranscript: boolean;
  needsClarification: boolean;
  clarifyingQuestions: ActivationQuestion[];
  brief: ActivationBriefContent;
  provider: 'local' | 'openai';
  model?: string;
  responseId?: string;
  promptVersion: string;
  schemaVersion: string;
  createdAt: number;
  updatedAt: number;
}

export interface Recording {
  id: string;
  captureSessionId: string;
  blob: Blob;
  mimeType: string;
  sizeBytes: number;
  durationMs: number;
  waveformPreview: number[];
  checksum?: string;
  createdAt: number;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface Transcript {
  id: string;
  captureSessionId: string;
  version: number;
  text: string;
  segments?: TranscriptSegment[];
  language?: string;
  confidence?: number;
  provider: string;
  model?: string;
  source: 'transcription' | 'typed' | 'edited';
  contentHash: string;
  createdAt: number;
  updatedAt: number;
}

export interface RecordingDraft {
  blob: Blob;
  mimeType: string;
  durationMs: number;
  sizeBytes: number;
  waveformPreview: number[];
}

export interface TranscriptResult {
  text: string;
  segments?: TranscriptSegment[];
  language?: string;
  confidence?: number;
  provider: string;
  model?: string;
}

export interface ExtractionRun {
  id: string;
  captureSessionId: string;
  transcriptId: string;
  transcriptHash: string;
  provider: string;
  model: string;
  reasoningEffort: string;
  segmentationPromptVersion: string;
  organizationPromptVersion: string;
  schemaVersion: string;
  idempotencyKey: string;
  status: 'running' | 'succeeded' | 'failed' | 'superseded';
  stage: 'segmenting' | 'organizing';
  attempt: number;
  rawJson: string;
  startedAt: number;
  completedAt?: number;
  latencyMs?: number;
  errorCode?: string;
}

export interface AppSettings {
  key: 'app';
  automaticProcessing: boolean;
  cloudProcessingConsent: CloudProcessingConsent;
  clientId: string;
  createdAt: number;
  updatedAt: number;
}

/** @deprecated Sprint 2 migration bridge */
export interface LegacySourceSpan {
  start: number;
  end: number;
}

/** @deprecated Sprint 2 migration bridge */
export type LegacyNuggetCategory = 'idea' | 'decision' | 'risk' | 'note';

/** @deprecated Sprint 2 migration bridge */
export type LegacyItemStatus = 'pending' | 'accepted' | 'rejected';

/** @deprecated Sprint 2 migration bridge */
export interface ExtractionNuggetSuggestion {
  title: string;
  detail?: string;
  category: LegacyNuggetCategory;
  confidence: number;
  sourceSpan: LegacySourceSpan;
}

/** @deprecated Sprint 2 migration bridge */
export interface ExtractionActionSuggestion {
  title: string;
  description?: string;
  priority: Priority;
  dueDate: number | null;
  project: string | null;
  confidence: number;
  sourceSpan: LegacySourceSpan;
}

/** @deprecated Sprint 2 migration bridge */
export interface ExtractionQuestionSuggestion {
  text: string;
  confidence: number;
  sourceSpan: LegacySourceSpan;
}

/** @deprecated Sprint 2 migration bridge */
export interface ExtractionResult {
  summary: string;
  nuggets: ExtractionNuggetSuggestion[];
  actions: ExtractionActionSuggestion[];
  questions: ExtractionQuestionSuggestion[];
  tags: string[];
  warnings: string[];
}

/** @deprecated Sprint 2 migration bridge */
export interface Nugget {
  id: string;
  captureSessionId: string;
  extractionRunId: string;
  title: string;
  detail?: string;
  category: LegacyNuggetCategory;
  confidence?: number;
  sourceSpan?: LegacySourceSpan;
  status: LegacyItemStatus;
  createdAt: number;
  updatedAt: number;
}

/** @deprecated Sprint 2 migration bridge */
export interface Question {
  id: string;
  captureSessionId: string;
  extractionRunId?: string;
  text: string;
  status: LegacyItemStatus;
  sourceSpan?: LegacySourceSpan;
  createdAt: number;
  updatedAt: number;
}
