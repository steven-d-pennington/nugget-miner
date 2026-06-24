import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';

const validExtraction = {
  summary: 'Real structured summary',
  nuggets: [{ title: 'Real nugget', detail: 'Detail', category: 'idea', confidence: 0.8, sourceSpan: { start: 0, end: 12 } }],
  actions: [{ title: 'Real action', description: 'Do it', priority: 'medium', dueDate: null, project: null, confidence: 0.7, sourceSpan: { start: 0, end: 12 } }],
  questions: [{ text: 'What next?', confidence: 0.6, sourceSpan: { start: 0, end: 12 } }],
  tags: ['real'],
  warnings: [],
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

function jsonRequest(body: unknown) {
  return new Request('http://localhost/api/extract', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
}

describe('/api/extract', () => {
  it('reports sanitized LLM config', async () => {
    vi.stubEnv('NUGGET_LLM_API_KEY', 'secret-key');
    vi.stubEnv('NUGGET_LLM_MODEL', 'gpt-test');

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({ available: true, model: 'gpt-test' });
    expect(JSON.stringify(json)).not.toContain('secret-key');
  });

  it('returns 503 before provider call when env is missing', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    const response = await POST(jsonRequest({ ideaId: 'idea-1', transcript: { id: 't1', text: 'Transcript text' }, preset: 'general-thought' }));
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.error.code).toBe('provider_unconfigured');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('validates model JSON before returning it', async () => {
    vi.stubEnv('NUGGET_LLM_API_KEY', 'secret-key');
    vi.stubEnv('NUGGET_LLM_MODEL', 'gpt-test');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(validExtraction) } }] }), { status: 200 }),
    );

    const response = await POST(jsonRequest({ ideaId: 'idea-1', transcript: { id: 't1', text: 'Transcript text' }, preset: 'product-idea' }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({ provider: 'cloud', model: 'gpt-test', promptVersion: 'extract-product-idea-v1', result: { summary: 'Real structured summary' } });
  });

  it('rejects malformed model output with a sanitized error', async () => {
    vi.stubEnv('NUGGET_LLM_API_KEY', 'secret-key');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: '{"summary":"bad"}' } }] }), { status: 200 }),
    );

    const response = await POST(jsonRequest({ ideaId: 'idea-1', transcript: { id: 't1', text: 'Transcript text' }, preset: 'general-thought' }));
    const json = await response.json();

    expect(response.status).toBe(502);
    expect(json.error.code).toBe('invalid_model_output');
    expect(JSON.stringify(json)).not.toContain('Transcript text');
  });
});
