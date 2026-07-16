import { buildExtractionPrompt, type ExtractionPromptInput } from './extractionPrompts';
import {
  buildOrganizationPrompt,
  type OrganizationPromptInput,
} from './organizationPrompt';
import {
  buildSegmentationPrompt,
  type PromptDefinition,
  type SegmentationPromptInput,
} from './segmentationPrompt';

export function getSegmentationPrompt(input: SegmentationPromptInput): PromptDefinition {
  return buildSegmentationPrompt(input);
}

export function getOrganizationPrompt(input: OrganizationPromptInput): PromptDefinition {
  return buildOrganizationPrompt(input);
}

/** @deprecated Remove after the legacy extraction endpoint migrates to the two-stage API. */
export function getExtractionPrompt(input: ExtractionPromptInput) {
  return buildExtractionPrompt(input);
}

export type { OrganizationPromptInput } from './organizationPrompt';
export type { PromptDefinition, SegmentationPromptInput } from './segmentationPrompt';
