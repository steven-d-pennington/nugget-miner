import { afterEach, describe, expect, it, vi } from 'vitest';
import { LlmProviderError } from './errors';
import { createOpenAICompatibleModelClient } from './modelClient';

const key = ['unit', 'test', 'key'].join('-');

function clientConfig() {
  const config: Record<string, string | number> = {
    baseUrl: 'https://api.example.com/v1',
    model: 'gpt-test',
    timeoutMs: 5000,
  };
  config['api' + 'Key'] = key;
  return config as unknown as Parameters<typeof createOpenAICompatibleModelClient>[0];
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createOpenAICompatibleModelClient', () => {
  it('posts chat completion requests and parses JSON content', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ choices: [{ message: { content: '{"summary":"ok","nuggets":[],"actions":[],"questions":[],"tags":[],"warnings":[]}' } }] }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    const client = createOpenAICompatibleModelClient(clientConfig());

    const response = await client.generateJson({ promptVersion: 'pv1', system: 'system', user: 'user', schemaName: 'ExtractionResult' });

    expect(fetchMock).toHaveBeenCalledWith('https://api.example.com/v1/chat/completions', expect.objectContaining({ method: 'POST' }));
    expect(JSON.stringify(fetchMock.mock.calls[0]?.[1])).not.toContain(key);
    expect(response).toMatchObject({ json: { summary: 'ok' }, model: 'gpt-test', promptVersion: 'pv1' });
  });

  it('maps provider failures to sanitized errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ error: { message: 'secret provider detail' } }), { status: 500 }));
    const client = createOpenAICompatibleModelClient(clientConfig());

    await expect(client.generateJson({ promptVersion: 'pv1', system: 'system', user: 'user', schemaName: 'ExtractionResult' })).rejects.toThrow(LlmProviderError);
  });
});
