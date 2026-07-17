import { describe, expect, it } from 'vitest';
import { userErrorMessage } from './userErrorMessage';

describe('userErrorMessage', () => {
  it.each([
    [
      new DOMException('Permission denied by browser', 'NotAllowedError'),
      {
        title: 'Microphone access is blocked',
        detail: 'Allow microphone access in browser settings, then try again. Nothing was recorded.',
        actionLabel: 'Try again',
      },
    ],
    [
      new Error('This browser does not support microphone recording.'),
      {
        title: 'Recording is not supported here',
        detail: 'Use Paste a ramble or open Nugget in a current Safari, Chrome, or Edge browser.',
        actionLabel: 'Paste a ramble',
      },
    ],
    [
      new DOMException('Quota exceeded', 'QuotaExceededError'),
      {
        title: 'This device is low on storage',
        detail: 'The unsaved recording is still available on this screen. Free space, export/delete older data, then retry save.',
        actionLabel: 'Retry save',
      },
    ],
    [
      { code: 'offline' },
      {
        title: 'Waiting for connection',
        detail: 'Your capture is saved locally. Open Nugget when connected to continue processing.',
      },
    ],
    [
      { code: 'provider_unconfigured' },
      {
        title: 'Processing is not configured',
        detail: 'The recording is saved. Configure OpenAI on the server or use the deployed demo.',
      },
    ],
    [
      { code: 'provider_error' },
      {
        title: 'Processing did not finish',
        detail: 'Your recording and completed stages are saved. Retry from the last successful step.',
        actionLabel: 'Retry',
      },
    ],
    [
      { code: 'invalid_model_output' },
      {
        title: 'Nugget could not organize this result',
        detail: 'Your recording and transcript are saved. Retry once or edit the transcript first.',
        actionLabel: 'Retry',
      },
    ],
    [
      { code: 'cloud_consent_required' },
      {
        title: 'Cloud processing is off',
        detail: 'Enable cloud processing to transcribe and organize this capture.',
        actionLabel: 'Review privacy',
      },
    ],
  ])('returns the required recovery copy for %#', (error, expected) => {
    expect(userErrorMessage(error)).toEqual(expected);
  });

  it('never includes an upstream response body or stack text in recovery copy', () => {
    const error = Object.assign(new Error('provider body: customer transcript and API secret'), {
      code: 'provider_error',
      stack: 'private stack trace',
    });

    const message = userErrorMessage(error);

    expect(message.detail).not.toContain('customer transcript');
    expect(message.detail).not.toContain('API secret');
    expect(message.detail).not.toContain('stack trace');
  });
});
