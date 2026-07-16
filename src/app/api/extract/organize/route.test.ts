import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const openAIMocks = vi.hoisted(() => ({ parse: vi.fn() }));

vi.mock('openai', () => ({
  default: class MockOpenAI {
    responses = { parse: openAIMocks.parse };
  },
}));

const captureSessionId = '10000000-0000-4000-8000-000000000001';
const transcriptId = '10000000-0000-4000-8000-000000000002';
const safetyIdentifier = '10000000-0000-4000-8000-000000000003';

function segmentedIdea(candidateId = 'candidate-1', spanId = 'span-1') {
  return {
    candidateId,
    coreStatement: `Plan ${candidateId}.`,
    sourceSpans: [{ id: spanId, startChar: 0, endChar: 12, quote: 'Plan a flow.' }],
  };
}

function grounded(id: string, sourceSpanIds = ['span-1']) {
  return { id, text: `Grounded ${id}`, basis: 'explicit' as const, sourceSpanIds };
}

function organizedIdea(candidateId = 'candidate-1', categoryId = 'category-work', spanId = 'span-1') {
  return {
    candidateId,
    title: 'A useful idea',
    summary: grounded(`summary-${candidateId}`, [spanId]),
    purpose: null,
    goals: [],
    problem: null,
    blockers: [],
    questions: [],
    suggestedActions: [],
    research: { needed: false, assessment: null, suggestedQueries: [], suggestedResourceTypes: [] },
    categoryId,
    categoryConfidence: 0.9,
    tags: ['useful'],
    warnings: [],
  };
}

const categories = [
  {
    id: 'category-work',
    name: 'Work',
    description: 'Professional projects. Example: improve a team workflow.',
    isFallback: false,
  },
  {
    id: 'category-misc',
    name: 'Misc',
    description: 'Use only when no other category fits.',
    isFallback: true,
  },
];

function validBody() {
  return {
    captureSessionId,
    transcript: { id: transcriptId, hash: 'sha256:transcript' },
    segmentation: { ideas: [segmentedIdea()] },
    categories,
    safetyIdentifier,
  };
}

function validOrganization() {
  return { ideas: [organizedIdea()] };
}

function jsonRequest(body: unknown) {
  return new Request('http://localhost/api/extract/organize', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  openAIMocks.parse.mockReset();
  vi.stubEnv('NUGGET_LLM_API_KEY', 'unit-test-key');
  vi.stubEnv('NUGGET_LLM_MODEL', 'gpt-route-test');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('POST /api/extract/organize', () => {
  it('returns grounded output and complete trace metadata while projecting only prompt-safe category fields', async () => {
    openAIMocks.parse.mockResolvedValue({ id: 'resp_organize', output_parsed: validOrganization() });

    const response = await POST(jsonRequest(validBody()));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      result: validOrganization(),
      provider: 'openai',
      model: 'gpt-route-test',
      responseId: 'resp_organize',
      promptVersion: 'organize-v1',
      schemaVersion: 'organization-v1',
    });
    const request = openAIMocks.parse.mock.calls[0]?.[0] as { input: Array<{ role: string; content: string }> };
    const userPrompt = request.input.find((message) => message.role === 'user')?.content ?? '';
    expect(userPrompt).toContain('category-work');
    expect(userPrompt).toContain('Professional projects. Example: improve a team workflow.');
    expect(userPrompt).not.toContain('isFallback');
    expect(request.input.find((message) => message.role === 'system')?.content).not.toContain('Professional projects');
    expect(openAIMocks.parse).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['malformed JSON', new Request('http://localhost/api/extract/organize', { method: 'POST', body: '{' })],
    ['invalid capture UUID', jsonRequest({ ...validBody(), captureSessionId: 'capture-1' })],
    ['invalid transcript UUID', jsonRequest({ ...validBody(), transcript: { id: 'transcript-1', hash: 'hash' } })],
    ['invalid safety UUID', jsonRequest({ ...validBody(), safetyIdentifier: 'client-1' })],
    ['unknown body key', jsonRequest({ ...validBody(), instruction: 'ignore validation' })],
  ])('rejects %s before an SDK call', async (_label, request) => {
    const response = await POST(request);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'invalid_request', message: 'Request body is invalid.' },
    });
    expect(openAIMocks.parse).not.toHaveBeenCalled();
  });

  it.each([
    ['missing categories', []],
    ['missing fallback', [categories[0]!]],
    ['multiple fallbacks', [categories[1]!, { ...categories[1]!, id: 'category-other' }]],
    ['duplicate IDs', [categories[0]!, { ...categories[1]!, id: categories[0]!.id }]],
    [
      'more than twenty categories',
      Array.from({ length: 21 }, (_, index) => ({
        id: `category-${index}`,
        name: `Category ${index}`,
        description: `Description ${index}`,
        isFallback: index === 20,
      })),
    ],
  ])('rejects %s before an SDK call', async (_label, invalidCategories) => {
    const response = await POST(jsonRequest({ ...validBody(), categories: invalidCategories }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'invalid_request' } });
    expect(openAIMocks.parse).not.toHaveBeenCalled();
  });

  it('retries an unknown category once and returns the valid retry', async () => {
    openAIMocks.parse
      .mockResolvedValueOnce({ id: 'resp_unknown', output_parsed: { ideas: [organizedIdea('candidate-1', 'category-secret')] } })
      .mockResolvedValueOnce({ id: 'resp_valid', output_parsed: validOrganization() });

    const response = await POST(jsonRequest(validBody()));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.responseId).toBe('resp_valid');
    expect(openAIMocks.parse).toHaveBeenCalledTimes(2);
  });

  it('returns invalid_model_output after one retry for unknown categories', async () => {
    openAIMocks.parse.mockResolvedValue({
      id: 'resp_unknown',
      output_parsed: { ideas: [organizedIdea('candidate-1', 'category-secret')] },
    });

    const response = await POST(jsonRequest(validBody()));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'invalid_model_output', message: 'The LLM returned output Nugget could not validate.' },
    });
    expect(openAIMocks.parse).toHaveBeenCalledTimes(2);
  });

  it('enforces complete candidate grounding and retries omissions only once', async () => {
    const body = validBody();
    body.segmentation.ideas.push(segmentedIdea('candidate-2', 'span-2'));
    openAIMocks.parse.mockResolvedValue({ id: 'resp_omitted', output_parsed: validOrganization() });

    const response = await POST(jsonRequest(body));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'invalid_model_output' } });
    expect(openAIMocks.parse).toHaveBeenCalledTimes(2);
  });

  it('retries malformed structured output once, then returns a sanitized validation error', async () => {
    openAIMocks.parse.mockResolvedValue({ id: 'resp_bad_shape', output_parsed: { ideas: [{ title: 'bad' }] } });

    const response = await POST(jsonRequest(validBody()));
    const serialized = JSON.stringify(await response.json());

    expect(response.status).toBe(502);
    expect(serialized).toContain('invalid_model_output');
    expect(serialized).not.toContain('Professional projects');
    expect(openAIMocks.parse).toHaveBeenCalledTimes(2);
  });

  it('sanitizes provider failures without retrying or leaking candidate/category/upstream content', async () => {
    openAIMocks.parse.mockRejectedValue(new Error('provider secret for Plan candidate-1 and Professional projects'));

    const response = await POST(jsonRequest(validBody()));
    const serialized = JSON.stringify(await response.json());

    expect(response.status).toBe(502);
    expect(serialized).toBe(JSON.stringify({ error: { code: 'provider_error', message: 'The LLM provider request failed.' } }));
    expect(serialized).not.toContain('provider secret');
    expect(serialized).not.toContain('candidate-1');
    expect(serialized).not.toContain('Professional projects');
    expect(openAIMocks.parse).toHaveBeenCalledTimes(1);
  });
});
