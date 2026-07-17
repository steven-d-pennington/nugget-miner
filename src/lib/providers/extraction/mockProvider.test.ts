import { describe, expect, it } from 'vitest';
import type { Transcript } from '@/types';
import { mockOrganizationProvider } from './mockProvider';

const captureSessionId = '00000000-0000-4000-8000-000000000001';
const safetyIdentifier = '00000000-0000-4000-8000-000000000002';

function transcript(text: string): Pick<Transcript, 'id' | 'contentHash' | 'text'> {
  return {
    id: '00000000-0000-4000-8000-000000000003',
    contentHash: `hash:${text.length}`,
    text,
  };
}

function segment(text: string) {
  return mockOrganizationProvider.segment({
    captureSessionId,
    transcript: transcript(text),
    safetyIdentifier,
  });
}

const categories = [
  {
    id: 'custom-workstream',
    name: 'Work',
    description: 'Professional projects, clients, and team workflows.',
    isFallback: false,
  },
  {
    id: 'custom-schoolwork',
    name: 'School',
    description: 'Classes, coursework, degrees, and academic research.',
    isFallback: false,
  },
  {
    id: 'catch-all',
    name: 'Misc',
    description: 'Use only when the idea does not fit another category.',
    isFallback: true,
  },
];

describe('mockOrganizationProvider', () => {
  it('exposes stable full fingerprint metadata before any model-equivalent call', async () => {
    await expect(mockOrganizationProvider.isAvailable()).resolves.toBe(true);
    await expect(mockOrganizationProvider.getDescriptor()).resolves.toEqual({
      provider: 'mock',
      model: 'deterministic-organization-mock',
      reasoningEffort: 'deterministic',
      segmentationPromptVersion: 'segment-v1',
      organizationPromptVersion: 'organize-v1',
      segmentationSchemaVersion: 'segmentation-v1',
      organizationSchemaVersion: 'organization-v1',
    });
  });

  it.each(['', '   \r\n ', 'no-meaningful-idea-fixture'])(
    'returns zero candidates for blank or the exact no-idea fixture %#',
    async (text) => {
      await expect(segment(text)).resolves.toMatchObject({ result: { ideas: [] } });
    },
  );

  it('returns one deterministic candidate for a single paragraph with an exact source span', async () => {
    const text = '  Build a small tool-sharing library for the neighborhood.  ';

    const first = await segment(text);
    const second = await segment(text);

    expect(second).toEqual(first);
    expect(first.result.ideas).toHaveLength(1);
    expect(first.result.ideas[0]).toMatchObject({
      candidateId: 'candidate-1',
      coreStatement: 'Build a small tool-sharing library for the neighborhood.',
    });
    const sourceSpan = first.result.ideas[0]!.sourceSpans[0]!;
    expect(text.slice(sourceSpan.startChar, sourceSpan.endChar)).toBe(sourceSpan.quote);
    expect(first).toMatchObject({
      provider: 'mock',
      model: 'deterministic-organization-mock',
      promptVersion: 'segment-v1',
      schemaVersion: 'segmentation-v1',
    });
  });

  it('returns one candidate per blank-line-separated paragraph and preserves all exact offsets', async () => {
    const text = [
      'At work, replace scattered handoff messages with one template.',
      'For school, compare two public transit rebuilding projects.',
      'Keep a list of blue objects noticed on Tuesdays.',
    ].join('\r\n  \r\n');

    const output = await segment(text);

    expect(output.result.ideas).toHaveLength(3);
    for (const candidate of output.result.ideas) {
      for (const sourceSpan of candidate.sourceSpans) {
        expect(text.slice(sourceSpan.startChar, sourceSpan.endChar)).toBe(sourceSpan.quote);
      }
    }
  });

  it('bounds a ramble with more than twelve paragraphs to the schema maximum', async () => {
    const text = Array.from({ length: 14 }, (_, index) => `Distinct project paragraph ${index + 1}.`).join('\n\n');

    const output = await segment(text);

    expect(output.result.ideas).toHaveLength(12);
    expect(output.result.ideas.at(-1)?.coreStatement).toBe('Distinct project paragraph 12.');
  });

  it('organizes every candidate exactly once using only supplied custom category IDs', async () => {
    const text = [
      'At work, improve the client review flow and check which approval rules apply.',
      'For school, compare evening degree programs before choosing a course.',
      'Keep a list of blue objects noticed on Tuesdays.',
    ].join('\n\n');
    const segmented = await segment(text);

    const first = await mockOrganizationProvider.organize({
      captureSessionId,
      transcript: transcript(text),
      segmentation: segmented.result,
      categories,
      safetyIdentifier,
    });
    const second = await mockOrganizationProvider.organize({
      captureSessionId,
      transcript: transcript(text),
      segmentation: segmented.result,
      categories,
      safetyIdentifier,
    });

    expect(second).toEqual(first);
    expect(first.result.ideas.map((idea) => idea.candidateId)).toEqual([
      'candidate-1',
      'candidate-2',
      'candidate-3',
    ]);
    expect(first.result.ideas.map((idea) => idea.categoryId)).toEqual([
      'custom-workstream',
      'custom-schoolwork',
      'catch-all',
    ]);
    expect(new Set(first.result.ideas.map((idea) => idea.categoryId))).toEqual(
      new Set(['custom-workstream', 'custom-schoolwork', 'catch-all']),
    );
    expect(first.result.ideas[2]?.warnings).toContain(
      'No supplied category matched strongly; the fallback category was used.',
    );
    expect(first).toMatchObject({
      provider: 'mock',
      model: 'deterministic-organization-mock',
      promptVersion: 'organize-v1',
      schemaVersion: 'organization-v1',
    });
  });

  it('emits explicit, inferred, and suggested grounded fields with valid reusable tags', async () => {
    const text = 'At work, research a client review workflow because the current process is frustrating and needs approval.';
    const segmented = await segment(text);
    const output = await mockOrganizationProvider.organize({
      captureSessionId,
      transcript: transcript(text),
      segmentation: segmented.result,
      categories,
      safetyIdentifier,
    });
    const idea = output.result.ideas[0]!;

    expect(idea.summary).toMatchObject({ basis: 'explicit', sourceSpanIds: ['candidate-1-span-1'] });
    expect(idea.purpose).toMatchObject({ basis: 'inferred', sourceSpanIds: ['candidate-1-span-1'] });
    expect(idea.suggestedActions[0]).toMatchObject({ basis: 'suggested', sourceSpanIds: [] });
    expect(idea.problem?.statement.basis).toBe('explicit');
    expect(idea.blockers[0]?.basis).toBe('explicit');
    expect(idea.research).toMatchObject({ needed: true, assessment: { basis: 'inferred' } });
    expect(idea.tags.length).toBeLessThanOrEqual(6);
    expect(new Set(idea.tags).size).toBe(idea.tags.length);
  });

  it('requires exactly one supplied fallback category', async () => {
    const text = 'A personal project.';
    const segmented = await segment(text);

    await expect(
      mockOrganizationProvider.organize({
        captureSessionId,
        transcript: transcript(text),
        segmentation: segmented.result,
        categories: categories.filter((category) => !category.isFallback),
        safetyIdentifier,
      }),
    ).rejects.toMatchObject({
      name: 'ProviderError',
      message: 'Mock organization requires exactly one fallback category.',
    });
  });

  it('keeps failed-extraction-fixture as a deterministic failure hook', async () => {
    await expect(segment('An idea with failed-extraction-fixture inside it.')).rejects.toMatchObject({
      name: 'ProviderError',
      message: 'Mock extraction fixture failed.',
    });
  });
});
