import { buildExtractionPrompt, type ExtractionPromptInput } from './extractionPrompts';

export function getExtractionPrompt(input: ExtractionPromptInput) {
  return buildExtractionPrompt(input);
}
