import { ProviderError } from '@/lib/errors';
import { ConsentRequiredError, runWithConsent } from '@/lib/privacy/consent';
import { parseExtractionResult } from '@/lib/validation/extractionResult';
import type { ExtractionProvider, ExtractionProviderOutput } from './types';

interface CloudExtractionProviderOptions {
  fetcher?: typeof fetch;
}

interface PublicExtractionConfig {
  available?: boolean;
  providerLabel?: string;
  model?: string;
}

interface RouteOutput {
  result?: unknown;
  provider?: unknown;
  model?: unknown;
  promptVersion?: unknown;
  error?: { code?: string; message?: string };
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export function createCloudExtractionProvider({ fetcher }: CloudExtractionProviderOptions = {}): ExtractionProvider {
  const callFetch: typeof fetch = (input, init) => (fetcher ?? globalThis.fetch)(input, init);
  return {
    id: 'cloud',
    label: 'OpenAI-compatible LLM extraction',
    mode: 'cloud',

    async isAvailable() {
      try {
        const response = await callFetch('/api/extract');
        if (!response.ok) return false;
        const config = await readJson<PublicExtractionConfig>(response);
        return config.available === true;
      } catch {
        return false;
      }
    },

    async extract(input) {
      if (!input.requestConsent) {
        throw new ConsentRequiredError('Consent is required before sending transcript text for cloud extraction.');
      }

      return runWithConsent({
        requestConsent: input.requestConsent,
        send: async (): Promise<ExtractionProviderOutput> => {
          const response = await callFetch('/api/extract', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              ideaId: input.ideaId,
              preset: input.context.preset,
              transcript: {
                id: input.transcript.id,
                text: input.transcript.text,
              },
            }),
            signal: input.signal,
          });
          const json = await readJson<RouteOutput>(response);
          if (!response.ok) {
            throw new ProviderError(json.error?.message ?? 'Cloud extraction failed.');
          }
          if (typeof json.provider !== 'string' || typeof json.promptVersion !== 'string') {
            throw new ProviderError('Cloud extraction response was incomplete.');
          }
          return {
            result: parseExtractionResult(json.result),
            provider: json.provider,
            promptVersion: json.promptVersion,
            model: typeof json.model === 'string' ? json.model : undefined,
          };
        },
      });
    },
  };
}

export const cloudExtractionProvider = createCloudExtractionProvider();
