import type { Category, ExtractionPreset, ExtractionResult, Transcript } from '@/types';
import type { OrganizationResult } from '@/lib/validation/organizationResult';
import type { SegmentationResult } from '@/lib/validation/segmentationResult';

export type OrganizationProviderCategory = Pick<Category, 'id' | 'name' | 'description' | 'isFallback'>;

export interface OrganizationProviderDescriptor {
  provider: string;
  model: string;
  reasoningEffort: string;
  segmentationPromptVersion: string;
  organizationPromptVersion: string;
  segmentationSchemaVersion: string;
  organizationSchemaVersion: string;
}

export interface SegmentProviderInput {
  captureSessionId: string;
  transcript: Pick<Transcript, 'id' | 'contentHash' | 'text'>;
  safetyIdentifier: string;
  signal?: AbortSignal;
}

export interface OrganizeProviderInput {
  captureSessionId: string;
  transcript: Pick<Transcript, 'id' | 'contentHash'>;
  segmentation: SegmentationResult;
  categories: readonly OrganizationProviderCategory[];
  safetyIdentifier: string;
  signal?: AbortSignal;
}

interface ProviderOutputMetadata {
  provider: string;
  model: string;
  responseId: string;
  promptVersion: string;
  schemaVersion: string;
}

export interface SegmentProviderOutput extends ProviderOutputMetadata {
  result: SegmentationResult;
}

export interface OrganizeProviderOutput extends ProviderOutputMetadata {
  result: OrganizationResult;
}

export interface OrganizationProvider {
  id: string;
  label: string;
  mode: 'mock' | 'cloud';
  isAvailable(): Promise<boolean>;
  getDescriptor(): Promise<OrganizationProviderDescriptor>;
  segment(input: SegmentProviderInput): Promise<SegmentProviderOutput>;
  organize(input: OrganizeProviderInput): Promise<OrganizeProviderOutput>;
}

/** @deprecated Removed with the legacy ReviewService later in Sprint 2 Task 6. */
export interface ExtractionContext {
  preset: ExtractionPreset;
}

/** @deprecated Removed with the legacy ReviewService later in Sprint 2 Task 6. */
export interface ExtractionProviderInput {
  ideaId: string;
  transcript: Transcript;
  context: ExtractionContext;
  requestConsent?: () => Promise<boolean>;
  signal?: AbortSignal;
}

/** @deprecated Removed with the legacy ReviewService later in Sprint 2 Task 6. */
export interface ExtractionProviderOutput {
  result: ExtractionResult;
  provider: string;
  promptVersion: string;
  model?: string;
}

/** @deprecated Removed with the legacy ReviewService later in Sprint 2 Task 6. */
export interface ExtractionProvider {
  id: string;
  label: string;
  mode: 'mock' | 'cloud';
  isAvailable(): Promise<boolean>;
  extract(input: ExtractionProviderInput): Promise<ExtractionProviderOutput>;
}
