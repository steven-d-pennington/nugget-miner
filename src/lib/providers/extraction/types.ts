import type { ExtractionPreset, ExtractionResult, Transcript } from '@/types';

export interface ExtractionContext {
  preset: ExtractionPreset;
}

export interface ExtractionProviderInput {
  ideaId: string;
  transcript: Transcript;
  context: ExtractionContext;
  signal?: AbortSignal;
}

export interface ExtractionProvider {
  id: string;
  label: string;
  mode: 'mock' | 'cloud';
  isAvailable(): Promise<boolean>;
  extract(input: ExtractionProviderInput): Promise<ExtractionResult>;
}
