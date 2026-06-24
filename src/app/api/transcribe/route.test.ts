import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function formRequest(file: File) {
  const form = new FormData();
  form.set('file', file);
  form.set('ideaId', 'idea-1');
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
  });
});
