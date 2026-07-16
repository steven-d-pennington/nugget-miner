import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { ZodError } from 'zod';
import type { z } from 'zod';
import { LlmProviderError, LlmValidationError } from './errors';
import type { ReasoningEffort } from './modelConfig';

export interface StructuredRequest<T extends z.ZodType> {
  schema: T;
  schemaName: string;
  promptVersion: string;
  system: string;
  user: string;
  safetyIdentifier: string;
  maxOutputTokens: number;
  signal?: AbortSignal;
}

export interface StructuredResponse<T> {
  parsed: T;
  provider: 'openai';
  model: string;
  responseId: string;
  promptVersion: string;
}

export interface OpenAIModelClientConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  reasoningEffort: ReasoningEffort;
}

export interface ModelClient {
  generateStructured<T extends z.ZodType>(request: StructuredRequest<T>): Promise<StructuredResponse<z.infer<T>>>;
}

export function createOpenAIModelClient(config: OpenAIModelClientConfig): ModelClient {
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    timeout: config.timeoutMs,
    maxRetries: 1,
  });

  return {
    async generateStructured(request) {
      try {
        const response = await client.responses.parse(
          {
            model: config.model,
            reasoning: { effort: config.reasoningEffort },
            input: [
              { role: 'system', content: request.system },
              { role: 'user', content: request.user },
            ],
            text: { format: zodTextFormat(request.schema, request.schemaName) },
            max_output_tokens: request.maxOutputTokens,
            safety_identifier: request.safetyIdentifier,
            store: false,
          },
          { signal: request.signal },
        );

        if (response.output_parsed == null) {
          throw new LlmValidationError('The model returned no structured output.');
        }

        const parsed = response.output_parsed as z.infer<typeof request.schema>;

        return {
          parsed,
          provider: 'openai',
          model: config.model,
          responseId: response.id,
          promptVersion: request.promptVersion,
        };
      } catch (error) {
        if (error instanceof LlmValidationError) throw error;
        if (error instanceof ZodError) {
          throw new LlmValidationError('The model returned invalid structured output.');
        }
        throw new LlmProviderError('LLM provider request failed.');
      }
    },
  };
}
