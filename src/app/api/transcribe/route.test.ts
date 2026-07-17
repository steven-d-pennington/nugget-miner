// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function formRequest(file: File) {
  const form = new FormData();
  form.set('file', file);
  form.set('captureSessionId', 'capture-1');
  form.set('recordingId', 'recording-1');
  return new Request('http://localhost/api/transcribe', { method: 'POST', body: form });
}

describe('/api/transcribe', () => {
  it('reports config without leaking secrets', async () => {
    vi.stubEnv('NUGGET_TRANSCRIPTION_API_KEY', 'secret-key');
    vi.stubEnv('NUGGET_TRANSCRIPTION_MODEL', 'whisper-test');

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({ available: true, model: 'whisper-test' });
    expect(JSON.stringify(json)).not.toContain('secret-key');
  });

  it('returns 503 before provider call when server env is missing', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    const response = await POST(formRequest(new File(['audio'], 'clip.webm', { type: 'audio/webm' })));
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.error.code).toBe('provider_unconfigured');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects invalid MIME before provider call', async () => {
    vi.stubEnv('NUGGET_TRANSCRIPTION_API_KEY', 'secret-key');
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    const response = await POST(formRequest(new File(['nope'], 'clip.txt', { type: 'text/plain' })));
    const json = await response.json();

    expect(response.status).toBe(415);
    expect(json.error.code).toBe('unsupported_media_type');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects WebM lookalike MIME types before provider call', async () => {
    vi.stubEnv('NUGGET_TRANSCRIPTION_API_KEY', 'secret-key');
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    const response = await POST(formRequest(new File(['nope'], 'clip.webm', { type: 'audio/webm-not-a-real-type' })));

    expect(response.status).toBe(415);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'unsupported_media_type', message: 'This audio type is not supported.' },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts valid parameterized WebM MIME types', async () => {
    vi.stubEnv('NUGGET_TRANSCRIPTION_API_KEY', 'secret-key');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ text: 'Transcript' }), { status: 200, headers: { 'content-type': 'application/json' } }),
    );

    const response = await POST(formRequest(new File(['audio'], 'clip.webm', { type: 'audio/webm; codecs = "opus"' })));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ text: 'Transcript', provider: 'cloud' });
  });

  it('rejects empty audio before provider call', async () => {
    vi.stubEnv('NUGGET_TRANSCRIPTION_API_KEY', 'secret-key');
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    const response = await POST(formRequest(new File([], 'clip.webm', { type: 'audio/webm' })));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'empty_audio', message: 'The audio file must not be empty.' },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('limits the eleventh valid transcription request with a stable safe response', async () => {
    vi.stubEnv('NUGGET_TRANSCRIPTION_API_KEY', 'secret-key');
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ text: 'Transcript' }), { status: 200, headers: { 'content-type': 'application/json' } })),
    );
    const request = (file: File) => {
      const form = new FormData();
      form.set('file', file);
      return new Request('http://localhost/api/transcribe', {
        method: 'POST',
        headers: { 'x-forwarded-for': '198.51.100.42' },
        body: form,
      });
    };

    for (let index = 0; index < 10; index += 1) {
      await expect(POST(request(new File(['audio'], `clip-${index}.webm`, { type: 'audio/webm' })))).resolves.toMatchObject({ status: 200 });
    }

    const response = await POST(request(new File(['audio'], 'clip-11.webm', { type: 'audio/webm' })));

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toMatch(/^\d+$/);
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    await expect(response.json()).resolves.toEqual({
      error: { code: 'rate_limited', message: 'Too many processing requests. Try again in a few minutes.' },
    });
  });

  it('maps provider success to TranscriptResult JSON', async () => {
    vi.stubEnv('NUGGET_TRANSCRIPTION_API_KEY', 'secret-key');
    vi.stubEnv('NUGGET_TRANSCRIPTION_MODEL', 'whisper-test');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ text: 'Real transcript', language: 'en' }), { status: 200, headers: { 'content-type': 'application/json' } }),
    );

    const response = await POST(formRequest(new File(['audio'], 'clip.webm', { type: 'audio/webm' })));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({ text: 'Real transcript', provider: 'cloud', language: 'en', model: 'whisper-test' });
    const providerBody = (vi.mocked(globalThis.fetch).mock.calls[0]?.[1] as RequestInit | undefined)?.body as FormData;
    expect(providerBody.has('captureSessionId')).toBe(false);
    expect(providerBody.has('recordingId')).toBe(false);
  });
});
