export type IdeaStatus = 'captured' | 'transcribing' | 'transcribed' | 'extracting' | 'reviewed' | 'failed';
export type SourceType = 'recording' | 'manual';
export type ProviderMode = 'mock' | 'local' | 'browser' | 'cloud';

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
}
