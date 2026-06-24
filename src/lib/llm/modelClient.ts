import { LlmProviderError } from './errors';
import { extractJsonObject } from './structuredOutput';

export interface LlmJsonRequest {
  promptVersion: string;
  system: string;
  user: string;
  schemaName: string;
  temperature?: number;
  maxOutputTokens?: number;
  signal?: AbortSignal;
}

export interface LlmJsonResponse {
  rawText: string;
  json: unknown;
  provider: string;
  model: string;
  promptVersion: string;
}

export interface OpenAICompatibleModelClientConfig {
  apiKey?: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

export interface ModelClient {
  generateJson(request: LlmJsonRequest): Promise<LlmJsonResponse>;
}

function completionUrl(baseUrl: string) {
  return `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
}

function responseText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') throw new LlmProviderError('LLM provider returned an invalid response.');
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices)) throw new LlmProviderError('LLM provider returned no choices.');
  const first = choices[0] as { message?: { content?: unknown } } | undefined;
  const content = first?.message?.content;
  if (typeof content !== 'string' || !content.trim()) throw new LlmProviderError('LLM provider returned empty content.');
  return content;
}

export function createOpenAICompatibleModelClient(config: OpenAICompatibleModelClientConfig): ModelClient {
  return {
    async generateJson(request) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
      request.signal?.addEventListener('abort', () => controller.abort(), { once: true });

      const headers = new Headers({ 'content-type': 'application/json' });
      headers.set('authorization', ['Bearer', config.apiKey].join(' '));

      try {
        const response = await fetch(completionUrl(config.baseUrl), {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: config.model,
            temperature: request.temperature ?? 0.2,
            max_tokens: request.maxOutputTokens ?? 1800,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: request.system },
              { role: 'user', content: request.user },
            ],
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new LlmProviderError('LLM provider request failed.');
        }

        const payload = (await response.json()) as unknown;
        const rawText = responseText(payload);
        return {
          rawText,
          json: extractJsonObject(rawText),
          provider: 'openai-compatible',
          model: config.model,
          promptVersion: request.promptVersion,
        };
      } catch (error) {
        if (error instanceof LlmProviderError) throw error;
        if (error instanceof Error && error.name === 'LlmValidationError') throw error;
        throw new LlmProviderError('LLM provider request failed.');
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
