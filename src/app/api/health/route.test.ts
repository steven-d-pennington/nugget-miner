import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('/api/health', () => {
  it('reports sanitized provider readiness without returning keys', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'secret-test-key');
    vi.stubEnv('NUGGET_LLM_MODEL', 'gpt-5.6');
    vi.stubEnv('NUGGET_TRANSCRIPTION_MODEL', 'gpt-4o-mini-transcribe');
    const { GET } = await import('./route');

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: 'ok',
      transcription: { available: true, model: 'gpt-4o-mini-transcribe' },
      organization: { available: true, model: 'gpt-5.6' },
    });
    expect(JSON.stringify(body)).not.toContain('secret-test-key');
  }, 15_000);
});
