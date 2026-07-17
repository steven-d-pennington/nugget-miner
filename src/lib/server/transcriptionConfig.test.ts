import { describe, expect, it } from 'vitest';
import { resolveTranscriptionConfig } from './transcriptionConfig';

describe('resolveTranscriptionConfig', () => {
  it('uses gpt-4o-mini-transcribe as the production default', () => {
    expect(resolveTranscriptionConfig({ OPENAI_API_KEY: 'key' }).model).toBe('gpt-4o-mini-transcribe');
  });

  it('reports unavailable without exposing a fake key when no API key exists', () => {
    const config = resolveTranscriptionConfig({});

    expect(config.available).toBe(false);
    expect(config.missing).toEqual(['apiKey']);
    expect(config.apiKey).toBeUndefined();
    expect(config.baseUrl).toBe('https://api.openai.com/v1');
    expect(config.model).toBe('gpt-4o-mini-transcribe');
    expect(config.timeoutMs).toBe(60_000);
    expect(config.maxBytes).toBe(26_214_400);
  });

  it('prefers NUGGET_TRANSCRIPTION variables over OpenAI fallbacks', () => {
    const config = resolveTranscriptionConfig({
      OPENAI_API_KEY: 'fallback-key',
      OPENAI_BASE_URL: 'https://fallback.example/v1',
      OPENAI_TRANSCRIPTION_MODEL: 'fallback-model',
      NUGGET_TRANSCRIPTION_API_KEY: 'preferred-key',
      NUGGET_TRANSCRIPTION_BASE_URL: 'https://preferred.example/v1',
      NUGGET_TRANSCRIPTION_MODEL: 'preferred-model',
      NUGGET_TRANSCRIPTION_TIMEOUT_MS: '12000',
      NUGGET_TRANSCRIPTION_MAX_BYTES: '1234',
    });

    expect(config.available).toBe(true);
    expect(config.apiKey).toBe('preferred-key');
    expect(config.baseUrl).toBe('https://preferred.example/v1');
    expect(config.model).toBe('preferred-model');
    expect(config.timeoutMs).toBe(12_000);
    expect(config.maxBytes).toBe(1_234);
  });
});
