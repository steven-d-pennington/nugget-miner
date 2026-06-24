import { describe, expect, it, vi } from 'vitest';
import type { Transcript } from '@/types';
import { ConsentRequiredError } from '@/lib/privacy/consent';
import { createCloudExtractionProvider } from './cloudProvider';

const transcript: Transcript = {
  id: 'transcript-1',
  ideaId: 'idea-1',
  text: 'We should build a better review flow.',
  provider: 'cloud',
  edited: false,
  createdAt: 1,
  updatedAt: 1,
};

const result = {
  summary: 'Summary',
  nuggets: [{ title: 'Nugget', category: 'idea', confidence: 0.8, sourceSpan: { start: 0, end: 10 } }],
  actions: [],
  questions: [],
  tags: [],
  warnings: [],
};

describe('cloud extraction provider', () => {
  it('reports availability from /api/extract config', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ available: true, model: 'gpt-test' }), { status: 200 }));
    const provider = createCloudExtractionProvider({ fetcher });

    await expect(provider.isAvailable()).resolves.toBe(true);
  });

  it('requires consent before posting transcript text', async () => {
    const fetcher = vi.fn();
    const provider = createCloudExtractionProvider({ fetcher });

    await expect(provider.extract({ ideaId: 'idea-1', transcript, context: { preset: 'general-thought' }, requestConsent: async () => false })).rejects.toThrow(ConsentRequiredError);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('posts transcript to /api/extract and maps route metadata', async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).endsWith('/api/extract')) {
        return new Response(JSON.stringify({ result, provider: 'cloud', model: 'gpt-test', promptVersion: 'extract-general-thought-v1' }), { status: 200 });
      }
      return new Response(JSON.stringify({ available: true, model: 'gpt-test' }), { status: 200 });
    });
    const provider = createCloudExtractionProvider({ fetcher });

    const output = await provider.extract({ ideaId: 'idea-1', transcript, context: { preset: 'general-thought' }, requestConsent: async () => true });

    expect(fetcher).toHaveBeenCalledWith('/api/extract', expect.objectContaining({ method: 'POST', body: expect.stringContaining('better review flow') }));
    expect(output).toMatchObject({ result: { summary: 'Summary' }, provider: 'cloud', model: 'gpt-test', promptVersion: 'extract-general-thought-v1' });
  });
});
