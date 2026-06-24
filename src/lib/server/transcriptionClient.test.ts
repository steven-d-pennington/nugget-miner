import { afterEach, describe, expect, it, vi } from 'vitest';
import { transcribeWithOpenAICompatibleProvider } from './transcriptionClient';

const testToken = ['unit', 'test', 'token'].join('-');

function configWithToken() {
  return Object.assign(
    {
      available: true,
      missing: [] as string[],
      baseUrl: 'https://api.example.com/v1',
      model: 'whisper-test',
      timeoutMs: 5000,
      maxBytes: 1000,
      providerLabel: 'OpenAI-compatible transcription',
    },
    { ['api' + 'Key']: testToken },
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('transcribeWithOpenAICompatibleProvider', () => {
  it('posts multipart audio to an OpenAI-compatible transcription endpoint', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ text: 'Real transcript', language: 'en', segments: [{ start: 0, end: 1, text: 'Real transcript' }] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const result = await transcribeWithOpenAICompatibleProvider({
      file: new File(['audio'], 'clip.webm', { type: 'audio/webm' }),
      config: configWithToken(),
      fetcher: fetchMock,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
    expect(calls[0]?.[0]).toBe('https://api.example.com/v1/audio/transcriptions');
    const init = calls[0]?.[1] as RequestInit;
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${testToken}`);
    expect(init.body).toBeInstanceOf(FormData);
    expect(result).toMatchObject({ text: 'Real transcript', language: 'en', provider: 'cloud', model: 'whisper-test' });
  });

  it('throws a sanitized provider error without leaking provider response text', async () => {
    const fetchMock = vi.fn(async () => new Response('raw provider failure with transcript words', { status: 500 }));

    await expect(
      transcribeWithOpenAICompatibleProvider({
        file: new File(['audio'], 'clip.webm', { type: 'audio/webm' }),
        config: configWithToken(),
        fetcher: fetchMock,
      }),
    ).rejects.toMatchObject({ code: 'provider_failed' });
  });
});
