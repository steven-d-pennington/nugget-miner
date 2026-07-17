export interface ProcessingFingerprintInput {
  captureSessionId: string;
  transcriptId: string;
  transcriptHash: string;
  provider: string;
  model: string;
  reasoningEffort: string;
  preset: string;
  segmentationPromptVersion: string;
  organizationPromptVersion: string;
  stage: 'segmentation' | 'organization';
  schemaVersion: string;
  classificationContextFingerprint?: string;
}

export function processingFingerprint(input: ProcessingFingerprintInput): string {
  return JSON.stringify({
    fingerprintVersion: 1,
    captureSessionId: input.captureSessionId,
    transcriptId: input.transcriptId,
    transcriptHash: input.transcriptHash,
    provider: input.provider,
    model: input.model,
    reasoningEffort: input.reasoningEffort,
    preset: input.preset,
    segmentationPromptVersion: input.segmentationPromptVersion,
    organizationPromptVersion: input.organizationPromptVersion,
    stage: input.stage,
    schemaVersion: input.schemaVersion,
    ...(input.classificationContextFingerprint === undefined
      ? {}
      : { classificationContextFingerprint: input.classificationContextFingerprint }),
  });
}

export interface ClassificationContextCategory {
  id: string;
  name: string;
  description: string;
  isFallback: boolean;
}

/**
 * Produces an order-independent representation of every classifier-relevant
 * category field. This value is folded into organization idempotency only.
 */
export function classificationContextFingerprint(
  categories: readonly ClassificationContextCategory[],
): string {
  return JSON.stringify(
    [...categories]
      .map(({ id, name, description, isFallback }) => ({ id, name, description, isFallback }))
      .sort((left, right) => left.id.localeCompare(right.id)),
  );
}
