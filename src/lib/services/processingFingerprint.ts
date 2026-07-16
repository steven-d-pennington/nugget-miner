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
  });
}
