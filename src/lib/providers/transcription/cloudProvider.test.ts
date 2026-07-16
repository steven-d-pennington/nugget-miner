import { describe, expect, it, vi } from 'vitest';
import { createCloudTranscriptionProvider } from './cloudProvider';

describe('cloud transcription provider', () => {
  it('reports unavailable when the config endpoint is missing a provider key', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ available: false, missing: ['apiKey'] }), { status: 200 }));
    const provider = createCloudTranscriptionProvider({ fetcher });

    await expect(provider.isAvailable()).resolves.toBe(false);
  });

  it('posts audio FormData and maps the route response', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      if (String(input).endsWith('/api/transcribe')) {
        return new Response(JSON.stringify({ text: 'Cloud transcript', provider: 'cloud', model: 'whisper-test' }), { status: 200 });
      }
      return new Response(JSON.stringify({ available: true, model: 'whisper-test' }), { status: 200 });
    });
    const provider = createCloudTranscriptionProvider({ fetcher });

    const result = await provider.transcribe({
      captureSessionId: 'capture-1',
      recordingId: 'recording-1',
      audioBlob: new Blob(['audio'], { type: 'audio/webm' }),
    });

    expect(fetcher).toHaveBeenCalledWith('/api/transcribe', expect.objectContaining({ method: 'POST', body: expect.any(FormData) }));
    const body = (fetcher.mock.calls[0]?.[1] as RequestInit | undefined)?.body as FormData;
    expect(body.get('captureSessionId')).toBe('capture-1');
    expect(body.has('ideaId')).toBe(false);
    expect(result).toMatchObject({ text: 'Cloud transcript', provider: 'cloud', model: 'whisper-test' });
  });
});
