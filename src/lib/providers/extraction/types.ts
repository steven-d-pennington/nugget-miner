import type { ExtractionPreset, ExtractionResult, Transcript } from '@/types';

export interface ExtractionContext {
  preset: ExtractionPreset;
}

export interface ExtractionProviderInput {
  ideaId: string;
  transcript: Transcript;
  context: ExtractionContext;
  requestConsent?: () => Promise<boolean>;
  signal?: AbortSignal;
}

export interface ExtractionProviderOutput {
  result: ExtractionResult;
  provider: string;
  promptVersion: string;
  model?: string;
}

export interface ExtractionProvider {
  id: string;
  label: string;
  mode: 'mock' | 'cloud';
  isAvailable(): Promise<boolean>;
  extract(input: ExtractionProviderInput): Promise<ExtractionProviderOutput>;
}
