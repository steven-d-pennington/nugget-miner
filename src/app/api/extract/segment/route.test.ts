import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const openAIMocks = vi.hoisted(() => ({ parse: vi.fn() }));

vi.mock('openai', () => ({
  default: class MockOpenAI {
    responses = { parse: openAIMocks.parse };
  },
}));

const captureSessionId = '00000000-0000-4000-8000-000000000001';
const transcriptId = '00000000-0000-4000-8000-000000000002';
const safetyIdentifier = '00000000-0000-4000-8000-000000000003';
const transcriptText = 'Build a better review flow. Then test it.';

function span(quote: string, startChar = transcriptText.indexOf(quote), id = 'span-1') {
  return { id, startChar, endChar: startChar + quote.length, quote };
}

function validSegmentation() {
  return {
    ideas: [
      {
        candidateId: 'candidate-1',
        coreStatement: 'Build and test a better review flow.',
        sourceSpans: [span('Build a better review flow.')],
      },
    ],
  };
}

function validBody(text = transcriptText) {
  return {
    captureSessionId,
    transcript: { id: transcriptId, hash: 'sha256:transcript', text },
    safetyIdentifier,
  };
}

function jsonRequest(body: unknown) {
  return new Request('http://localhost/api/extract/segment', {
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

describe('POST /api/extract/segment', () => {
  it('returns normalized structured output and complete trace metadata', async () => {
    const repairable = validSegmentation();
    repairable.ideas[0]!.sourceSpans[0] = span('Then test it.', 999);
    openAIMocks.parse.mockResolvedValue({ id: 'resp_segment', output_parsed: repairable });

    const response = await POST(jsonRequest(validBody()));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({
      result: {
        ideas: [
          expect.objectContaining({
            candidateId: 'candidate-1',
            sourceSpans: [span('Then test it.')],
          }),
        ],
      },
      provider: 'openai',
      model: 'gpt-route-test',
      responseId: 'resp_segment',
      promptVersion: 'segment-v2',
      schemaVersion: 'segmentation-v1',
    });
    expect(openAIMocks.parse).toHaveBeenCalledTimes(1);
    expect(openAIMocks.parse).toHaveBeenCalledWith(
      expect.objectContaining({
        safety_identifier: safetyIdentifier,
        store: false,
        input: [
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user', content: expect.stringContaining(transcriptText) }),
        ],
      }),
      expect.any(Object),
    );
  });

  it.each([
    ['malformed JSON', new Request('http://localhost/api/extract/segment', { method: 'POST', body: '{' })],
    ['invalid capture UUID', jsonRequest({ ...validBody(), captureSessionId: 'capture-1' })],
    ['invalid transcript UUID', jsonRequest({ ...validBody(), transcript: { ...validBody().transcript, id: 'transcript-1' } })],
    ['invalid safety UUID', jsonRequest({ ...validBody(), safetyIdentifier: 'client-1' })],
    ['unknown body key', jsonRequest({ ...validBody(), instructions: 'trust me' })],
  ])('rejects %s before an SDK call', async (_label, request) => {
    const response = await POST(request);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'invalid_request', message: 'Request body is invalid.' },
    });
    expect(openAIMocks.parse).not.toHaveBeenCalled();
  });

  it('rejects oversized transcript text before an SDK call', async () => {
    vi.stubEnv('NUGGET_LLM_MAX_INPUT_CHARS', '8');

    const response = await POST(jsonRequest(validBody('123456789')));

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'transcript_too_large', message: 'Transcript is too large for extraction.' },
    });
    expect(openAIMocks.parse).not.toHaveBeenCalled();
  });

  it('rejects an invalid ID before counting thirty valid requests from the same client', async () => {
    const sharedSafetyIdentifier = '00000000-0000-4000-8000-000000000030';
    openAIMocks.parse.mockResolvedValue({ id: 'resp_segment_limit', output_parsed: validSegmentation() });

    const invalid = await POST(jsonRequest({ ...validBody(), captureSessionId: 'capture-1', safetyIdentifier: sharedSafetyIdentifier }));
    expect(invalid.status).toBe(400);

    for (let index = 0; index < 30; index += 1) {
      await expect(POST(jsonRequest({ ...validBody(), safetyIdentifier: sharedSafetyIdentifier }))).resolves.toMatchObject({ status: 200 });
    }

    const limited = await POST(jsonRequest({ ...validBody(), safetyIdentifier: sharedSafetyIdentifier }));
    expect(limited.status).toBe(429);
    expect(limited.headers.get('Retry-After')).toMatch(/^\d+$/);
    expect(limited.headers.get('X-RateLimit-Remaining')).toBe('0');
    await expect(limited.json()).resolves.toEqual({
      error: { code: 'rate_limited', message: 'Too many processing requests. Try again in a few minutes.' },
    });
    expect(openAIMocks.parse).toHaveBeenCalledTimes(30);
  });

  it('retries ambiguous span output once and returns the valid retry', async () => {
    const repeatedText = 'repeat repeat';
    const ambiguous = {
      ideas: [
        {
          candidateId: 'candidate-1',
          coreStatement: 'Repeat.',
          sourceSpans: [{ id: 'span-1', startChar: 99, endChar: 105, quote: 'repeat' }],
        },
      ],
    };
    const validRetry = {
      ideas: [
        {
          candidateId: 'candidate-1',
          coreStatement: 'Repeat.',
          sourceSpans: [{ id: 'span-1', startChar: 0, endChar: repeatedText.length, quote: repeatedText }],
        },
      ],
    };
    openAIMocks.parse
      .mockResolvedValueOnce({ id: 'resp_bad', output_parsed: ambiguous })
      .mockResolvedValueOnce({ id: 'resp_good', output_parsed: validRetry });

    const response = await POST(jsonRequest(validBody(repeatedText)));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.responseId).toBe('resp_good');
    expect(openAIMocks.parse).toHaveBeenCalledTimes(2);
  });

  it('returns invalid_model_output after one retry for persistently invalid offsets', async () => {
    const ambiguous = {
      ideas: [
        {
          candidateId: 'candidate-1',
          coreStatement: 'Repeat.',
          sourceSpans: [{ id: 'span-1', startChar: 99, endChar: 105, quote: 'repeat' }],
        },
      ],
    };
    openAIMocks.parse.mockResolvedValue({ id: 'resp_bad', output_parsed: ambiguous });

    const response = await POST(jsonRequest(validBody('repeat repeat')));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'invalid_model_output', message: 'The LLM returned output Nugget could not validate.' },
    });
    expect(openAIMocks.parse).toHaveBeenCalledTimes(2);
  });

  it('retries malformed structured output once, then returns a sanitized validation error', async () => {
    openAIMocks.parse.mockResolvedValue({ id: 'resp_bad_shape', output_parsed: { ideas: [{ transcript: transcriptText }] } });

    const response = await POST(jsonRequest(validBody()));
    const serialized = JSON.stringify(await response.json());

    expect(response.status).toBe(502);
    expect(serialized).toContain('invalid_model_output');
    expect(serialized).not.toContain(transcriptText);
    expect(openAIMocks.parse).toHaveBeenCalledTimes(2);
  });

  it('returns provider_unconfigured after request validation without calling the SDK', async () => {
    vi.stubEnv('NUGGET_LLM_API_KEY', '');
    vi.stubEnv('OPENAI_API_KEY', '');
    vi.stubEnv('NUGGET_TRANSCRIPTION_API_KEY', '');

    const response = await POST(jsonRequest(validBody()));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ error: { code: 'provider_unconfigured' } });
    expect(openAIMocks.parse).not.toHaveBeenCalled();
  });

  it('sanitizes provider failures without retrying or leaking request/upstream content', async () => {
    openAIMocks.parse.mockRejectedValue(new Error(`upstream secret body: ${transcriptText}`));

    const response = await POST(jsonRequest(validBody()));
    const serialized = JSON.stringify(await response.json());

    expect(response.status).toBe(502);
    expect(serialized).toBe(JSON.stringify({ error: { code: 'provider_error', message: 'The LLM provider request failed.' } }));
    expect(serialized).not.toContain('upstream secret');
    expect(serialized).not.toContain(transcriptText);
    expect(openAIMocks.parse).toHaveBeenCalledTimes(1);
  });

  it('uses the one shared retry for a transient provider failure, then returns success', async () => {
    openAIMocks.parse
      .mockRejectedValueOnce(Object.assign(new Error(`transient secret: ${transcriptText}`), { status: 503 }))
      .mockResolvedValueOnce({ id: 'resp_after_transient', output_parsed: validSegmentation() });

    const response = await POST(jsonRequest(validBody()));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.responseId).toBe('resp_after_transient');
    expect(JSON.stringify(json)).not.toContain('transient secret');
    expect(openAIMocks.parse).toHaveBeenCalledTimes(2);
  });

  it('never makes a third call when a transient failure is followed by invalid output', async () => {
    openAIMocks.parse
      .mockRejectedValueOnce(Object.assign(new Error('temporary upstream body'), { name: 'APIConnectionError' }))
      .mockResolvedValueOnce({ id: 'resp_invalid', output_parsed: { ideas: [{ transcript: transcriptText }] } });

    const response = await POST(jsonRequest(validBody()));
    const serialized = JSON.stringify(await response.json());

    expect(response.status).toBe(502);
    expect(serialized).toContain('invalid_model_output');
    expect(serialized).not.toContain(transcriptText);
    expect(openAIMocks.parse).toHaveBeenCalledTimes(2);
  });
});
