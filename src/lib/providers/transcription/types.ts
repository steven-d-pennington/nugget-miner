import type { ProviderMode, TranscriptResult } from '@/types';

export interface TranscriptionInput {
  ideaId: string;
  recordingId: string;
  audioBlob: Blob;
  signal?: AbortSignal;
}

export interface TranscriptionProvider {
  id: string;
  label: string;
  mode: ProviderMode;
  isAvailable(): Promise<boolean>;
  transcribe(input: TranscriptionInput): Promise<TranscriptResult>;
}

export interface ProviderListOptions {
  includeUnavailable?: boolean;
}
