import { z } from 'zod';
import { ProviderError, ValidationError } from '@/lib/errors';
import { ORGANIZATION_PROMPT_VERSION } from '@/lib/llm/organizationPrompt';
import { SEGMENTATION_PROMPT_VERSION } from '@/lib/llm/segmentationPrompt';
import { ConsentRequiredError, runWithConsent } from '@/lib/privacy/consent';
import { parseExtractionResult } from '@/lib/validation/extractionResult';
import { normalizeSegmentationSpans, validateOrganizationGrounding } from '@/lib/validation/grounding';
import {
  ORGANIZATION_SCHEMA_VERSION,
  organizationResultSchema,
} from '@/lib/validation/organizationResult';
import {
  SEGMENTATION_SCHEMA_VERSION,
  segmentationResultSchema,
} from '@/lib/validation/segmentationResult';
import type {
  ExtractionProvider,
  ExtractionProviderOutput,
  OrganizationProvider,
  OrganizationProviderDescriptor,
} from './types';

export interface CloudOrganizationProviderOptions {
  fetcher?: typeof fetch;
  configEndpoint?: string;
  segmentEndpoint?: string;
  organizeEndpoint?: string;
}

const publicConfigSchema = z
  .object({
    available: z.boolean(),
    missing: z.array(z.string()),
    model: z.string().min(1),
    reasoningEffort: z.enum(['none', 'low', 'medium', 'high', 'xhigh', 'max']),
    maxInputChars: z.number().int().positive(),
    providerLabel: z.string().min(1),
  })
  .strict();

const routeErrorSchema = z
  .object({
    error: z
      .object({
        code: z.string().min(1),
        message: z.string().min(1),
      })
      .strict(),
  })
  .strict();

const responseMetadataSchema = {
  provider: z.string().min(1),
  model: z.string().min(1),
  responseId: z.string().min(1),
  promptVersion: z.string().min(1),
  schemaVersion: z.string().min(1),
};

const segmentResponseSchema = z
  .object({
    result: segmentationResultSchema,
    ...responseMetadataSchema,
  })
  .strict();

const organizeResponseSchema = z
  .object({
    result: organizationResultSchema,
    ...responseMetadataSchema,
  })
  .strict();

async function readUnknownJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

async function fetchJson(
  fetcher: typeof fetch,
  input: string,
  init: RequestInit | undefined,
  fallbackMessage: string,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetcher(input, init);
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new ProviderError(fallbackMessage);
  }

  const body = await readUnknownJson(response);
  if (!response.ok) {
    const routeError = routeErrorSchema.safeParse(body);
    throw new ProviderError(routeError.success ? routeError.data.error.message : fallbackMessage);
  }
  return body;
}

function descriptorFromConfig(config: z.infer<typeof publicConfigSchema>): OrganizationProviderDescriptor {
  return {
    provider: 'openai',
    model: config.model,
    reasoningEffort: config.reasoningEffort,
    segmentationPromptVersion: SEGMENTATION_PROMPT_VERSION,
    organizationPromptVersion: ORGANIZATION_PROMPT_VERSION,
    segmentationSchemaVersion: SEGMENTATION_SCHEMA_VERSION,
    organizationSchemaVersion: ORGANIZATION_SCHEMA_VERSION,
  };
}

export function createCloudOrganizationProvider(
  options: CloudOrganizationProviderOptions = {},
): OrganizationProvider {
  const fetcher = options.fetcher ?? globalThis.fetch;
  const configEndpoint = options.configEndpoint ?? '/api/extract';
  const segmentEndpoint = options.segmentEndpoint ?? '/api/extract/segment';
  const organizeEndpoint = options.organizeEndpoint ?? '/api/extract/organize';
  let configPromise: Promise<z.infer<typeof publicConfigSchema>> | undefined;

  async function getConfig() {
    if (!configPromise) {
      configPromise = (async () => {
        const body = await fetchJson(
          fetcher,
          configEndpoint,
          { method: 'GET' },
          'Cloud organization configuration is unavailable.',
        );
        const parsed = publicConfigSchema.safeParse(body);
        if (!parsed.success) throw new ProviderError('Cloud organization configuration is unavailable.');
        return parsed.data;
      })().catch((error) => {
        configPromise = undefined;
        throw error;
      });
    }
    return configPromise;
  }

  return {
    id: 'cloud',
    label: 'OpenAI-compatible LLM organization',
    mode: 'cloud',

    async isAvailable() {
      try {
        return (await getConfig()).available;
      } catch {
        return false;
      }
    },

    async getDescriptor() {
      return descriptorFromConfig(await getConfig());
    },

    async segment(input) {
      const expected = await this.getDescriptor();
      const body = await fetchJson(
        fetcher,
        segmentEndpoint,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            captureSessionId: input.captureSessionId,
            transcript: {
              id: input.transcript.id,
              hash: input.transcript.contentHash,
              text: input.transcript.text,
            },
            safetyIdentifier: input.safetyIdentifier,
          }),
          signal: input.signal,
        },
        'Cloud segmentation failed.',
      );
      const parsed = segmentResponseSchema.safeParse(body);
      if (!parsed.success) throw new ProviderError('Cloud segmentation response was invalid.');
      if (
        parsed.data.provider !== expected.provider ||
        parsed.data.model !== expected.model ||
        parsed.data.promptVersion !== expected.segmentationPromptVersion ||
        parsed.data.schemaVersion !== expected.segmentationSchemaVersion
      ) {
        throw new ProviderError('Cloud segmentation response was invalid.');
      }

      try {
        return {
          ...parsed.data,
          result: normalizeSegmentationSpans(input.transcript.text, parsed.data.result),
        };
      } catch (error) {
        if (error instanceof ValidationError) throw new ProviderError('Cloud segmentation response was invalid.');
        throw error;
      }
    },

    async organize(input) {
      const expected = await this.getDescriptor();
      const body = await fetchJson(
        fetcher,
        organizeEndpoint,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            captureSessionId: input.captureSessionId,
            transcript: {
              id: input.transcript.id,
              hash: input.transcript.contentHash,
            },
            segmentation: input.segmentation,
            categories: input.categories.map(({ id, name, description, isFallback }) => ({
              id,
              name,
              description,
              isFallback,
            })),
            safetyIdentifier: input.safetyIdentifier,
          }),
          signal: input.signal,
        },
        'Cloud organization failed.',
      );
      const parsed = organizeResponseSchema.safeParse(body);
      if (!parsed.success) throw new ProviderError('Cloud organization response was invalid.');
      if (
        parsed.data.provider !== expected.provider ||
        parsed.data.model !== expected.model ||
        parsed.data.promptVersion !== expected.organizationPromptVersion ||
        parsed.data.schemaVersion !== expected.organizationSchemaVersion
      ) {
        throw new ProviderError('Cloud organization response was invalid.');
      }

      try {
        validateOrganizationGrounding(input.segmentation, parsed.data.result);
        const allowedCategoryIds = new Set(input.categories.map((category) => category.id));
        if (parsed.data.result.ideas.some((idea) => !allowedCategoryIds.has(idea.categoryId))) {
          throw new ValidationError('Organization returned an unknown category.');
        }
        return parsed.data;
      } catch (error) {
        if (error instanceof ValidationError) throw new ProviderError('Cloud organization response was invalid.');
        throw error;
      }
    },
  };
}

export const cloudOrganizationProvider = createCloudOrganizationProvider();

interface LegacyRouteOutput {
  result?: unknown;
  provider?: unknown;
  model?: unknown;
  promptVersion?: unknown;
  error?: { code?: string; message?: string };
}

/**
 * @deprecated Temporary compatibility adapter for the pre-Sprint-2 ReviewService.
 * The canonical organization provider above never requests UI consent.
 */
export function createCloudExtractionProvider({ fetcher }: Pick<CloudOrganizationProviderOptions, 'fetcher'> = {}): ExtractionProvider {
  const callFetch: typeof fetch = (input, init) => (fetcher ?? globalThis.fetch)(input, init);
  return {
    id: 'cloud',
    label: 'OpenAI-compatible LLM extraction',
    mode: 'cloud',
    async isAvailable() {
      try {
        const response = await callFetch('/api/extract');
        if (!response.ok) return false;
        const config = (await response.json()) as { available?: unknown };
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
              transcript: { id: input.transcript.id, text: input.transcript.text },
            }),
            signal: input.signal,
          });
          const json = (await readUnknownJson(response)) as LegacyRouteOutput | undefined;
          if (!response.ok) throw new ProviderError(json?.error?.message ?? 'Cloud extraction failed.');
          if (
            !json ||
            typeof json.provider !== 'string' ||
            typeof json.promptVersion !== 'string'
          ) {
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

/** @deprecated Use cloudOrganizationProvider. */
export const cloudExtractionProvider = createCloudExtractionProvider();
