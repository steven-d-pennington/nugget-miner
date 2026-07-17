import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createOpenAIModelClient } from './modelClient';

const openAIMocks = vi.hoisted(() => ({
  constructor: vi.fn(),
  parse: vi.fn(),
}));

vi.mock('openai', () => ({
  default: class MockOpenAI {
    responses = { parse: openAIMocks.parse };

    constructor(options: unknown) {
      openAIMocks.constructor(options);
    }
  },
}));

const key = ['unit', 'test', 'key'].join('-');
const resultSchema = z.object({ summary: z.string() }).strict();

function clientConfig() {
  return {
    apiKey: key,
    baseUrl: 'https://api.example.com/v1',
    model: 'gpt-5.6',
    timeoutMs: 5000,
    reasoningEffort: 'medium' as const,
  };
}

function request(signal?: AbortSignal) {
  return {
    schema: resultSchema,
    schemaName: 'ExtractionResult',
    promptVersion: 'pv1',
    system: 'system instructions',
    user: 'untrusted transcript data',
    safetyIdentifier: 'test-client',
    maxOutputTokens: 1800,
    signal,
  };
}

beforeEach(() => {
  openAIMocks.constructor.mockClear();
  openAIMocks.parse.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createOpenAIModelClient', () => {
  it('uses Responses structured output and returns trace metadata', async () => {
    const controller = new AbortController();
    openAIMocks.parse.mockResolvedValue({ id: 'resp_123', output_parsed: { summary: 'ok' } });
    const client = createOpenAIModelClient(clientConfig());

    const response = await client.generateStructured(request(controller.signal));

    expect(openAIMocks.constructor).toHaveBeenCalledWith({
      apiKey: key,
      baseURL: 'https://api.example.com/v1',
      timeout: 5000,
      maxRetries: 0,
    });
    expect(openAIMocks.parse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-5.6',
        reasoning: { effort: 'medium' },
        input: [
          { role: 'system', content: 'system instructions' },
          { role: 'user', content: 'untrusted transcript data' },
        ],
        max_output_tokens: 1800,
        safety_identifier: 'test-client',
        store: false,
        text: { format: expect.anything() },
      }),
      { signal: controller.signal },
    );
    expect(response).toEqual({
      parsed: { summary: 'ok' },
      provider: 'openai',
      model: 'gpt-5.6',
      responseId: 'resp_123',
      promptVersion: 'pv1',
    });
  });

  it('rejects empty parsed output as a validation error', async () => {
    openAIMocks.parse.mockResolvedValue({ id: 'resp_empty', output_parsed: null });
    const client = createOpenAIModelClient(clientConfig());

    await expect(client.generateStructured(request())).rejects.toMatchObject({
      name: 'LlmValidationError',
      message: 'The model returned no structured output.',
    });
  });

  it('maps Zod parse failures to a sanitized validation error', async () => {
    openAIMocks.parse.mockRejectedValue(new z.ZodError([]));
    const client = createOpenAIModelClient(clientConfig());

    await expect(client.generateStructured(request())).rejects.toEqual(
      expect.objectContaining({
        name: 'LlmValidationError',
        message: 'The model returned invalid structured output.',
      }),
    );
  });

  it('maps SDK failures to a sanitized provider error', async () => {
    openAIMocks.parse.mockRejectedValue(new Error('secret provider body and request content'));
    const client = createOpenAIModelClient(clientConfig());

    const promise = client.generateStructured(request());
    await expect(promise).rejects.toEqual(
      expect.objectContaining({
        name: 'LlmProviderError',
        message: 'LLM provider request failed.',
        retryable: false,
      }),
    );
    await expect(promise).rejects.not.toThrow('secret provider body');
  });

  it.each([
    ['APIConnectionError', undefined],
    ['APIConnectionTimeoutError', undefined],
    ['Error', 408],
    ['Error', 409],
    ['Error', 429],
    ['Error', 500],
    ['Error', 599],
  ])('marks transient SDK metadata retryable without exposing the upstream body (%s, %s)', async (name, status) => {
    const upstream = Object.assign(new Error('secret provider body and request content'), { name, status });
    openAIMocks.parse.mockRejectedValue(upstream);
    const client = createOpenAIModelClient(clientConfig());

    await expect(client.generateStructured(request())).rejects.toEqual(
      expect.objectContaining({
        name: 'LlmProviderError',
        message: 'LLM provider request failed.',
        retryable: true,
      }),
    );
  });

  it.each([400, 401, 403, 404, 499])('keeps permanent status %s non-retryable', async (status) => {
    openAIMocks.parse.mockRejectedValue(Object.assign(new Error('secret provider body'), { status }));
    const client = createOpenAIModelClient(clientConfig());

    await expect(client.generateStructured(request())).rejects.toEqual(
      expect.objectContaining({ retryable: false }),
    );
  });
});
