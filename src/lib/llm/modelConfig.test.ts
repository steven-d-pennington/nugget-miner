import { describe, expect, it } from 'vitest';
import { publicLlmConfig, resolveLlmConfig } from './modelConfig';

describe('resolveLlmConfig', () => {
  it('uses feature-specific env first and does not expose the key publicly', () => {
    const configuredKey = ['llm', 'key'].join('-');
    const config = resolveLlmConfig({
      NUGGET_LLM_API_KEY: configuredKey,
      NUGGET_LLM_BASE_URL: 'https://models.example.com/v1/',
      NUGGET_LLM_MODEL: 'gpt-test',
      NUGGET_LLM_REASONING_EFFORT: 'high',
      OPENAI_API_KEY: 'fallback-key',
    });

    expect(config).toMatchObject({
      available: true,
      baseUrl: 'https://models.example.com/v1',
      model: 'gpt-test',
      reasoningEffort: 'high',
    });
    expect(config.apiKey).toBe(configuredKey);
    expect(publicLlmConfig(config)).toEqual({
      available: true,
      missing: [],
      model: 'gpt-test',
      reasoningEffort: 'high',
      maxInputChars: 24000,
      providerLabel: 'OpenAI-compatible LLM extraction',
    });
    expect(JSON.stringify(publicLlmConfig(config))).not.toContain(configuredKey);
  });

  it('falls back to existing OpenAI-compatible keys and reports missing apiKey', () => {
    const fallbackKey = ['transcription', 'key'].join('-');
    expect(resolveLlmConfig({ NUGGET_TRANSCRIPTION_API_KEY: fallbackKey }).apiKey).toBe(fallbackKey);
    expect(resolveLlmConfig({})).toMatchObject({
      missing: ['apiKey'],
      model: 'gpt-5.6-terra',
      reasoningEffort: 'medium',
      timeoutMs: 90_000,
    });
  });

  it('uses the GPT-5.6 Terra medium-reasoning production defaults', () => {
    expect(resolveLlmConfig({ OPENAI_API_KEY: 'key' })).toMatchObject({
      model: 'gpt-5.6-terra',
      reasoningEffort: 'medium',
      timeoutMs: 90_000,
    });
  });

  it('accepts supported reasoning effort values from the Nugget setting', () => {
    expect(
      resolveLlmConfig({
        OPENAI_API_KEY: 'key',
        NUGGET_LLM_REASONING_EFFORT: 'high',
      }).reasoningEffort,
    ).toBe('high');
  });

  it('falls back to medium for invalid or unrelated reasoning settings', () => {
    expect(
      resolveLlmConfig({
        OPENAI_API_KEY: 'key',
        NUGGET_LLM_REASONING_EFFORT: 'invalid',
      }).reasoningEffort,
    ).toBe('medium');
    expect(resolveLlmConfig({ OPENAI_API_KEY: 'key', OPENAI_REASONING_EFFORT: 'high' }).reasoningEffort).toBe(
      'medium',
    );
  });
});
