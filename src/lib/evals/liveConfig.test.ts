import { describe, expect, it } from 'vitest';
import {
  LIVE_EVAL_MODEL,
  LIVE_EVAL_REASONING_EFFORT,
  OFFICIAL_OPENAI_BASE_URL,
  resolveAuthorizedLiveConfig,
} from './liveConfig';

const explicitKey = 'test-explicit-openai-key';

describe('live evaluation configuration preflight', () => {
  it('requires an explicit OPENAI_API_KEY', () => {
    expect(() => resolveAuthorizedLiveConfig({})).toThrow(
      'OPENAI_API_KEY is required for the live evaluation.',
    );
  });

  it.each(['NUGGET_LLM_API_KEY', 'NUGGET_TRANSCRIPTION_API_KEY'] as const)(
    'rejects a non-empty %s even when OPENAI_API_KEY is present',
    (alternateName) => {
      const alternateKey = 'test-alternate-key-that-must-not-appear';
      let error: unknown;
      try {
        resolveAuthorizedLiveConfig({
          OPENAI_API_KEY: explicitKey,
          [alternateName]: alternateKey,
        });
      } catch (caught) {
        error = caught;
      }

      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('rejects alternate API key sources');
      expect((error as Error).message).not.toContain(explicitKey);
      expect((error as Error).message).not.toContain(alternateKey);
    },
  );

  it('requires the official resolved base URL', () => {
    expect(() =>
      resolveAuthorizedLiveConfig({
        OPENAI_API_KEY: explicitKey,
        OPENAI_BASE_URL: 'https://proxy.invalid/v1',
      }),
    ).toThrow(`requires the official OpenAI base URL: ${OFFICIAL_OPENAI_BASE_URL}`);
  });

  it('requires the exact GPT-5.6 Terra model alias', () => {
    expect(() =>
      resolveAuthorizedLiveConfig({
        OPENAI_API_KEY: explicitKey,
        OPENAI_MODEL: 'gpt-5.6-preview',
      }),
    ).toThrow(`requires model ${LIVE_EVAL_MODEL}`);
  });

  it('requires medium reasoning effort', () => {
    expect(() =>
      resolveAuthorizedLiveConfig({
        OPENAI_API_KEY: explicitKey,
        NUGGET_LLM_REASONING_EFFORT: 'high',
      }),
    ).toThrow(`requires ${LIVE_EVAL_REASONING_EFFORT} reasoning effort`);
  });

  it('resolves only the explicit key and makes it non-serializable', () => {
    const config = resolveAuthorizedLiveConfig({
      OPENAI_API_KEY: explicitKey,
      NUGGET_LLM_API_KEY: '',
      NUGGET_TRANSCRIPTION_API_KEY: '',
    });

    expect(config.apiKey).toBe(explicitKey);
    expect(config.baseUrl).toBe(OFFICIAL_OPENAI_BASE_URL);
    expect(config.model).toBe(LIVE_EVAL_MODEL);
    expect(config.reasoningEffort).toBe(LIVE_EVAL_REASONING_EFFORT);
    expect(Object.keys(config)).not.toContain('apiKey');
    expect(JSON.stringify(config)).not.toContain('apiKey');
    expect(JSON.stringify(config)).not.toContain(explicitKey);
  });
});
