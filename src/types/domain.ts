export type IdeaStatus = 'captured' | 'transcribing' | 'transcribed' | 'extracting' | 'reviewed' | 'failed';
export type SourceType = 'recording' | 'manual';
export type ProviderMode = 'mock' | 'local' | 'browser' | 'cloud';
export type NuggetCategory = 'idea' | 'decision' | 'risk' | 'note';
export type ItemStatus = 'pending' | 'accepted' | 'rejected';
export type ActionStatus = 'open' | 'done' | 'archived';
export type Priority = 'low' | 'medium' | 'high';
export type JobStatus = 'queued' | 'processing' | 'complete' | 'failed' | 'canceled';
export type ExtractionPreset = 'product-idea' | 'work-reminder' | 'story-idea' | 'general-thought';

export interface SourceSpan {
  start: number;
  end: number;
}

export interface Idea {
  id: string;
  title: string;
  status: IdeaStatus;
  sourceType: SourceType;
  projectId?: string;
  tags: string[];
  favorite: boolean;
  archived: boolean;
  durationMs: number;
  actionCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface Recording {
  id: string;
  ideaId: string;
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
  ideaId: string;
  text: string;
  segments?: TranscriptSegment[];
  language?: string;
  confidence?: number;
  provider: string;
  model?: string;
  jobId?: string;
  edited: boolean;
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

export interface ExtractionNuggetSuggestion {
  title: string;
  detail?: string;
  category: NuggetCategory;
  confidence: number;
  sourceSpan: SourceSpan;
}

export interface ExtractionActionSuggestion {
  title: string;
  description?: string;
  priority: Priority;
  dueDate: number | null;
  project: string | null;
  confidence: number;
  sourceSpan: SourceSpan;
}

export interface ExtractionQuestionSuggestion {
  text: string;
  confidence: number;
  sourceSpan: SourceSpan;
}

export interface ExtractionResult {
  summary: string;
  nuggets: ExtractionNuggetSuggestion[];
  actions: ExtractionActionSuggestion[];
  questions: ExtractionQuestionSuggestion[];
  tags: string[];
  warnings: string[];
}

export interface ExtractionRun {
  id: string;
  ideaId: string;
  transcriptId: string;
  provider: string;
  preset: ExtractionPreset;
  promptVersion: string;
  schemaVersion: string;
  status: JobStatus;
  rawJson: string;
  summary?: string;
  warnings?: string[];
  createdAt: number;
}

export interface Nugget {
  id: string;
  ideaId: string;
  extractionRunId: string;
  title: string;
  detail?: string;
  category: NuggetCategory;
  confidence?: number;
  sourceSpan?: SourceSpan;
  status: ItemStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Question {
  id: string;
  ideaId: string;
  extractionRunId?: string;
  text: string;
  status: ItemStatus;
  sourceSpan?: SourceSpan;
  createdAt: number;
  updatedAt: number;
}

export interface ActionItem {
  id: string;
  ideaId?: string;
  extractionRunId?: string;
  title: string;
  description?: string;
  status: ActionStatus;
  priority: Priority;
  dueDate?: number;
  projectId?: string;
  tags: string[];
  sourceSpan?: SourceSpan;
  createdAt: number;
  updatedAt: number;
}
