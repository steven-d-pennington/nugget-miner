import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';

const openAIMocks = vi.hoisted(() => ({
  parse: vi.fn(),
}));

vi.mock('openai', () => ({
  default: class MockOpenAI {
    responses = { parse: openAIMocks.parse };
  },
}));

const validExtraction = {
  summary: 'Real structured summary',
  nuggets: [{ title: 'Real nugget', detail: 'Detail', category: 'idea', confidence: 0.8, sourceSpan: { start: 0, end: 12 } }],
  actions: [{ title: 'Real action', description: 'Do it', priority: 'medium', dueDate: null, project: null, confidence: 0.7, sourceSpan: { start: 0, end: 12 } }],
  questions: [{ text: 'What next?', confidence: 0.6, sourceSpan: { start: 0, end: 12 } }],
  tags: ['real'],
  warnings: [],
};

beforeEach(() => {
  openAIMocks.parse.mockReset();
});

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
    const response = await POST(jsonRequest({ ideaId: 'idea-1', transcript: { id: 't1', text: 'Transcript text' }, preset: 'general-thought' }));
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.error.code).toBe('provider_unconfigured');
    expect(openAIMocks.parse).not.toHaveBeenCalled();
  });

  it('validates structured model output before returning the legacy response', async () => {
    vi.stubEnv('NUGGET_LLM_API_KEY', 'secret-key');
    vi.stubEnv('NUGGET_LLM_MODEL', 'gpt-test');
    openAIMocks.parse.mockResolvedValue({ id: 'resp_legacy', output_parsed: validExtraction });

    const response = await POST(jsonRequest({ ideaId: 'idea-1', transcript: { id: 't1', text: 'Transcript text' }, preset: 'product-idea' }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({ provider: 'cloud', model: 'gpt-test', promptVersion: 'extract-product-idea-v1', result: { summary: 'Real structured summary' } });
    expect(openAIMocks.parse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-test',
        safety_identifier: 'idea-1',
        store: false,
        text: { format: expect.anything() },
      }),
      expect.any(Object),
    );
  });

  it('normalizes nullable structured fields to the legacy optional response shape', async () => {
    vi.stubEnv('NUGGET_LLM_API_KEY', 'secret-key');
    openAIMocks.parse.mockResolvedValue({
      id: 'resp_nullable',
      output_parsed: {
        ...validExtraction,
        nuggets: [{ ...validExtraction.nuggets[0], detail: null }],
        actions: [{ ...validExtraction.actions[0], description: null }],
      },
    });

    const response = await POST(jsonRequest({ ideaId: 'idea-1', transcript: { id: 't1', text: 'Transcript text' }, preset: 'general-thought' }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.result.nuggets[0]).not.toHaveProperty('detail');
    expect(json.result.actions[0]).not.toHaveProperty('description');
  });

  it('rejects malformed structured output with a sanitized error', async () => {
    vi.stubEnv('NUGGET_LLM_API_KEY', 'secret-key');
    openAIMocks.parse.mockResolvedValue({ id: 'resp_bad', output_parsed: { summary: 'bad' } });

    const response = await POST(jsonRequest({ ideaId: 'idea-1', transcript: { id: 't1', text: 'Transcript text' }, preset: 'general-thought' }));
    const json = await response.json();

    expect(response.status).toBe(502);
    expect(json.error.code).toBe('invalid_model_output');
    expect(JSON.stringify(json)).not.toContain('Transcript text');
  });

  it('maps provider failures to the legacy sanitized error', async () => {
    vi.stubEnv('NUGGET_LLM_API_KEY', 'secret-key');
    openAIMocks.parse.mockRejectedValue(new Error('secret provider body'));

    const response = await POST(jsonRequest({ ideaId: 'idea-1', transcript: { id: 't1', text: 'Transcript text' }, preset: 'general-thought' }));
    const json = await response.json();

    expect(response.status).toBe(502);
    expect(json.error).toEqual({ code: 'provider_error', message: 'The LLM provider request failed.' });
    expect(JSON.stringify(json)).not.toContain('secret provider body');
    expect(JSON.stringify(json)).not.toContain('Transcript text');
  });
});
