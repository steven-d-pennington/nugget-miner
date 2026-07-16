import { errorDetails } from '@/lib/errors';

export interface UserErrorMessage {
  title: string;
  detail: string;
  actionLabel?: string;
}

const recoveries = {
  microphoneBlocked: {
    title: 'Microphone access is blocked',
    detail: 'Allow microphone access in browser settings, then try again. Nothing was recorded.',
    actionLabel: 'Try again',
  },
  unsupportedRecorder: {
    title: 'Recording is not supported here',
    detail: 'Use Paste a ramble or open Nugget in a current Safari, Chrome, or Edge browser.',
    actionLabel: 'Paste a ramble',
  },
  quota: {
    title: 'This device is low on storage',
    detail: 'The unsaved recording is still available on this screen. Free space, export/delete older data, then retry save.',
    actionLabel: 'Retry save',
  },
  offline: {
    title: 'Waiting for connection',
    detail: 'Your capture is saved locally. Open Nugget when connected to continue processing.',
  },
  providerUnconfigured: {
    title: 'Processing is not configured',
    detail: 'The recording is saved. Configure OpenAI on the server or use the deployed demo.',
  },
  providerError: {
    title: 'Processing did not finish',
    detail: 'Your recording and completed stages are saved. Retry from the last successful step.',
    actionLabel: 'Retry',
  },
  invalidModelOutput: {
    title: 'Nugget could not organize this result',
    detail: 'Your recording and transcript are saved. Retry once or edit the transcript first.',
    actionLabel: 'Retry',
  },
  cloudConsentRequired: {
    title: 'Cloud processing is off',
    detail: 'Enable cloud processing to transcribe and organize this capture.',
    actionLabel: 'Review privacy',
  },
  fallback: {
    title: 'Something needs attention',
    detail: 'Nugget could not complete that step. Your existing local work is still available.',
    actionLabel: 'Try again',
  },
} as const satisfies Record<string, UserErrorMessage>;

function contains(value: string | undefined, expression: RegExp) {
  return expression.test(value ?? '');
}

export function userErrorMessage(error: unknown): UserErrorMessage {
  const details = errorDetails(error);
  const normalizedCode = details.code?.toLowerCase();

  if (details.name === 'NotAllowedError' || normalizedCode === 'notallowederror' || contains(details.message, /permission (?:was )?denied|microphone access (?:is )?blocked/i)) {
    return recoveries.microphoneBlocked;
  }

  if (
    normalizedCode === 'unsupported_recorder' ||
    contains(details.message, /(?:does not support|unsupported).*(?:recording|microphone)|mediarecorder/i)
  ) {
    return recoveries.unsupportedRecorder;
  }

  if (details.name === 'QuotaExceededError' || normalizedCode === 'quota_exceeded' || contains(details.message, /\bquota\b/i)) {
    return recoveries.quota;
  }

  if (normalizedCode === 'offline' || contains(details.message, /\boffline\b/i)) return recoveries.offline;

  if (normalizedCode === 'provider_unconfigured') return recoveries.providerUnconfigured;
  if (normalizedCode === 'invalid_model_output' || normalizedCode === 'bad_output') return recoveries.invalidModelOutput;
  if (normalizedCode === 'cloud_consent_required') return recoveries.cloudConsentRequired;
  if (
    normalizedCode === 'provider_error' ||
    normalizedCode === 'provider_failed' ||
    normalizedCode === 'transcription_failed' ||
    normalizedCode === 'segmentation_failed' ||
    normalizedCode === 'organization_failed' ||
    normalizedCode === 'legacy_extraction_failed'
  ) {
    return recoveries.providerError;
  }

  return recoveries.fallback;
}
