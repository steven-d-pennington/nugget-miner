import { describe, expect, it } from 'vitest';
import { mockExtractionProvider } from './mockProvider';
import type { Transcript } from '@/types';

function transcript(text: string): Transcript {
  return {
    id: 'transcript-1',
    ideaId: 'idea-1',
    text,
    provider: 'mock',
    edited: false,
    createdAt: 1,
    updatedAt: 1,
  };
}

describe('mockExtractionProvider', () => {
  it('returns deterministic schema-valid suggestions with source spans', async () => {
    const input = {
      ideaId: 'idea-1',
      transcript: transcript('We should build a review flow. It needs source-linked suggestions. What should happen next?'),
      context: { preset: 'product-idea' as const },
    };

    const first = await mockExtractionProvider.extract(input);
    const second = await mockExtractionProvider.extract(input);

    expect(second).toEqual(first);
    expect(first.result.summary).toContain('Product idea');
    expect(first.result.nuggets.length).toBeGreaterThanOrEqual(2);
    expect(first.result.actions[0]?.sourceSpan.end).toBeGreaterThan(first.result.actions[0]?.sourceSpan.start ?? 0);
    expect(first.result.questions[0]?.text).toContain('?');
    expect(first).toMatchObject({ provider: 'mock', promptVersion: 'mock-extraction-v1' });
  });

  it('varies output by preset', async () => {
    const base = transcript('Remember to send the launch notes. We need a follow up action.');
    const general = await mockExtractionProvider.extract({ ideaId: 'idea-1', transcript: base, context: { preset: 'general-thought' } });
    const work = await mockExtractionProvider.extract({ ideaId: 'idea-1', transcript: base, context: { preset: 'work-reminder' } });

    expect(general.result.summary).not.toBe(work.result.summary);
    expect(work.result.actions[0]?.priority).toBe('high');
  });
});
