import { describe, expect, it, vi } from 'vitest';
import { ProviderError } from '@/lib/errors';
import type { Transcript } from '@/types';
import { createCloudOrganizationProvider } from './cloudProvider';

const captureSessionId = '00000000-0000-4000-8000-000000000001';
const transcriptId = '00000000-0000-4000-8000-000000000002';
const safetyIdentifier = '00000000-0000-4000-8000-000000000003';
const transcriptText = 'At work, build a better review flow.';

const transcript: Pick<Transcript, 'id' | 'contentHash' | 'text'> = {
  id: transcriptId,
  contentHash: 'sha256:transcript',
  text: transcriptText,
};

const categories = [
  {
    id: 'category-work',
    name: 'Work',
    description: 'Professional projects and team workflows.',
    isFallback: false,
  },
  {
    id: 'category-misc',
    name: 'Misc',
    description: 'Use when no other category fits.',
    isFallback: true,
  },
];

const segmentation = {
  ideas: [
    {
      candidateId: 'candidate-1',
      coreStatement: transcriptText,
      sourceSpans: [
        {
          id: 'candidate-1-span-1',
          startChar: 0,
          endChar: transcriptText.length,
          quote: transcriptText,
        },
      ],
    },
  ],
};

const organization = {
  ideas: [
    {
      candidateId: 'candidate-1',
      title: 'Better review flow',
      summary: {
        id: 'candidate-1-summary',
        text: transcriptText,
        basis: 'explicit' as const,
        sourceSpanIds: ['candidate-1-span-1'],
      },
      purpose: null,
      goals: [],
      problem: null,
      blockers: [],
      questions: [],
      suggestedActions: [
        {
          id: 'candidate-1-action-1',
          text: 'Interview reviewers.',
          basis: 'suggested' as const,
          sourceSpanIds: [],
        },
      ],
      research: {
        needed: false,
        assessment: null,
        suggestedQueries: [],
        suggestedResourceTypes: [],
      },
      categoryId: 'category-work',
      categoryConfidence: 0.91,
      tags: ['review-flow'],
      warnings: [],
    },
  ],
};

const config = {
  available: true,
  missing: [],
  model: 'gpt-5.6-test',
  reasoningEffort: 'medium',
  maxInputChars: 24_000,
  providerLabel: 'OpenAI-compatible LLM extraction',
};

function segmentResponse(overrides: Record<string, unknown> = {}) {
  return {
    result: segmentation,
    provider: 'openai',
    model: 'gpt-5.6-test',
    responseId: 'resp_segment',
    promptVersion: 'segment-v2',
    schemaVersion: 'segmentation-v1',
    ...overrides,
  };
}

function organizeResponse(overrides: Record<string, unknown> = {}) {
  return {
    result: organization,
    provider: 'openai',
    model: 'gpt-5.6-test',
    responseId: 'resp_organize',
    promptVersion: 'organize-v2',
    schemaVersion: 'organization-v1',
    ...overrides,
  };
}

function providerForRouteBody(body: unknown, status = 200) {
  const fetcher = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) =>
    String(input) === '/api/extract'
      ? Response.json(config)
      : Response.json(body, { status }),
  );
  return { fetcher, provider: createCloudOrganizationProvider({ fetcher }) };
}

describe('cloud organization provider', () => {
  it('reports availability and exposes the complete pre-call fingerprint descriptor', async () => {
    const fetcher = vi.fn(async () => Response.json(config));
    const provider = createCloudOrganizationProvider({ fetcher });

    await expect(provider.isAvailable()).resolves.toBe(true);
    await expect(provider.getDescriptor()).resolves.toEqual({
      provider: 'openai',
      model: 'gpt-5.6-test',
      reasoningEffort: 'medium',
      segmentationPromptVersion: 'segment-v2',
      organizationPromptVersion: 'organize-v2',
      segmentationSchemaVersion: 'segmentation-v1',
      organizationSchemaVersion: 'organization-v1',
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith('/api/extract', { method: 'GET' });
  });

  it('rejects malformed public config without exposing response content', async () => {
    const fetcher = vi.fn(async () => Response.json({ ...config, unknown: 'private config detail' }));
    const provider = createCloudOrganizationProvider({ fetcher });

    await expect(provider.getDescriptor()).rejects.toEqual(
      expect.objectContaining({
        name: 'ProviderError',
        message: 'Cloud organization configuration is unavailable.',
      }),
    );
    await expect(provider.isAvailable()).resolves.toBe(false);
  });

  it('posts the segmentation request without UI consent and validates complete metadata', async () => {
    const { fetcher, provider } = providerForRouteBody(segmentResponse());

    const output = await provider.segment({ captureSessionId, transcript, safetyIdentifier });

    expect(output).toEqual(segmentResponse());
    expect(fetcher).toHaveBeenCalledTimes(2);
    const [endpoint, init] = fetcher.mock.calls[1]!;
    expect(endpoint).toBe('/api/extract/segment');
    expect(init).toMatchObject({ method: 'POST', headers: { 'content-type': 'application/json' } });
    expect(JSON.parse(String(init?.body))).toEqual({
      captureSessionId,
      transcript: { id: transcriptId, hash: 'sha256:transcript', text: transcriptText },
      safetyIdentifier,
    });
  });

  it('posts only prompt-safe organization fields and validates one-to-one grounding', async () => {
    const { fetcher, provider } = providerForRouteBody(organizeResponse());

    const output = await provider.organize({
      captureSessionId,
      transcript,
      segmentation,
      categories,
      safetyIdentifier,
    });

    expect(output).toEqual(organizeResponse());
    const [endpoint, init] = fetcher.mock.calls[1]!;
    expect(endpoint).toBe('/api/extract/organize');
    expect(JSON.parse(String(init?.body))).toEqual({
      captureSessionId,
      transcript: { id: transcriptId, hash: 'sha256:transcript' },
      segmentation,
      categories,
      safetyIdentifier,
    });
  });

  it.each([
    ['missing response ID', segmentResponse({ responseId: undefined })],
    ['unknown top-level key', { ...segmentResponse(), transcript: transcriptText }],
    ['provider mismatch', segmentResponse({ provider: 'other-provider' })],
    ['model mismatch', segmentResponse({ model: 'other-model' })],
    ['wrong prompt version', segmentResponse({ promptVersion: 'segment-v0' })],
    ['wrong schema version', segmentResponse({ schemaVersion: 'segmentation-v0' })],
    ['malformed result', segmentResponse({ result: { ideas: [{ candidateId: 'bad' }] } })],
  ])('rejects a strict successful segmentation body with %s', async (_label, body) => {
    const { provider } = providerForRouteBody(body);

    await expect(provider.segment({ captureSessionId, transcript, safetyIdentifier })).rejects.toEqual(
      expect.objectContaining({
        name: 'ProviderError',
        message: 'Cloud segmentation response was invalid.',
      }),
    );
  });

  it.each([
    ['missing model', organizeResponse({ model: undefined })],
    ['unknown top-level key', { ...organizeResponse(), categories }],
    ['provider mismatch', organizeResponse({ provider: 'other-provider' })],
    ['model mismatch', organizeResponse({ model: 'other-model' })],
    ['wrong prompt version', organizeResponse({ promptVersion: 'organize-v0' })],
    ['wrong schema version', organizeResponse({ schemaVersion: 'organization-v0' })],
    [
      'unknown category ID',
      organizeResponse({
        result: {
          ideas: [{ ...organization.ideas[0]!, categoryId: 'category-secret' }],
        },
      }),
    ],
    ['omitted candidate', organizeResponse({ result: { ideas: [] } })],
  ])('rejects a strict successful organization body with %s', async (_label, body) => {
    const { provider } = providerForRouteBody(body);

    await expect(
      provider.organize({ captureSessionId, transcript, segmentation, categories, safetyIdentifier }),
    ).rejects.toEqual(
      expect.objectContaining({
        name: 'ProviderError',
        message: 'Cloud organization response was invalid.',
      }),
    );
  });

  it('surfaces only a schema-valid sanitized route message through ProviderError', async () => {
    const { provider } = providerForRouteBody(
      { error: { code: 'provider_error', message: 'The LLM provider request failed.' } },
      502,
    );

    await expect(provider.segment({ captureSessionId, transcript, safetyIdentifier })).rejects.toEqual(
      expect.objectContaining({ name: 'ProviderError', message: 'The LLM provider request failed.' }),
    );

    const { provider: malformed } = providerForRouteBody(
      {
        error: {
          code: 'provider_error',
          message: 'raw upstream transcript secret',
          debug: transcriptText,
        },
      },
      502,
    );
    await expect(malformed.segment({ captureSessionId, transcript, safetyIdentifier })).rejects.toEqual(
      expect.objectContaining({ name: 'ProviderError', message: 'Cloud segmentation failed.' }),
    );
  });

  it('sanitizes rejected fetch details while preserving aborts', async () => {
    const provider = createCloudOrganizationProvider({
      fetcher: vi.fn(async (input: RequestInfo | URL) => {
        if (String(input) === '/api/extract') return Response.json(config);
        throw new Error(`network failure containing ${transcriptText}`);
      }),
    });

    await expect(provider.segment({ captureSessionId, transcript, safetyIdentifier })).rejects.toEqual(
      expect.objectContaining({ name: 'ProviderError', message: 'Cloud segmentation failed.' }),
    );

    const aborted = createCloudOrganizationProvider({
      fetcher: vi.fn(async (input: RequestInfo | URL) => {
        if (String(input) === '/api/extract') return Response.json(config);
        throw new DOMException('The operation was aborted.', 'AbortError');
      }),
    });
    await expect(aborted.segment({ captureSessionId, transcript, safetyIdentifier })).rejects.toMatchObject({
      name: 'AbortError',
    });
  });

  it('uses ProviderError for malformed successful JSON', async () => {
    const provider = createCloudOrganizationProvider({
      fetcher: vi.fn(async (input: RequestInfo | URL) =>
        String(input) === '/api/extract'
          ? Response.json(config)
          : new Response('{', { status: 200, headers: { 'content-type': 'application/json' } }),
      ),
    });

    await expect(provider.segment({ captureSessionId, transcript, safetyIdentifier })).rejects.toBeInstanceOf(ProviderError);
  });
});
