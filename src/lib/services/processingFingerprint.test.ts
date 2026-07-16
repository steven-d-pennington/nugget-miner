import { describe, expect, it } from 'vitest';
import { processingFingerprint, type ProcessingFingerprintInput } from './processingFingerprint';

const base: ProcessingFingerprintInput = {
  captureSessionId: 'capture-1',
  transcriptId: 'transcript-1',
  transcriptHash: 'hash-1',
  provider: 'mock',
  model: 'deterministic-mock',
  reasoningEffort: 'legacy',
  preset: 'general-thought',
  segmentationPromptVersion: 'legacy-preset:general-thought',
  organizationPromptVersion: 'mock-extraction-v1',
  stage: 'organization',
  schemaVersion: 'extraction-result-v1',
};

describe('processingFingerprint', () => {
  it('is stable and unambiguous for identical pipeline inputs', () => {
    expect(processingFingerprint({ ...base })).toBe(processingFingerprint({ ...base }));
    expect(JSON.parse(processingFingerprint(base))).toMatchObject({
      fingerprintVersion: 1,
      provider: 'mock',
      preset: 'general-thought',
      stage: 'organization',
    });
  });

  it.each([
    ['captureSessionId', 'capture-2'],
    ['transcriptId', 'transcript-2'],
    ['transcriptHash', 'hash-2'],
    ['provider', 'cloud'],
    ['model', 'gpt-test'],
    ['reasoningEffort', 'medium'],
    ['preset', 'work-reminder'],
    ['segmentationPromptVersion', 'segment-v2'],
    ['organizationPromptVersion', 'organize-v2'],
    ['stage', 'segmentation'],
    ['schemaVersion', 'schema-v2'],
  ] satisfies Array<[keyof ProcessingFingerprintInput, string]>)('changes when %s changes', (field, value) => {
    const changed = { ...base, [field]: value } as ProcessingFingerprintInput;
    expect(processingFingerprint(changed)).not.toBe(processingFingerprint(base));
  });
});
