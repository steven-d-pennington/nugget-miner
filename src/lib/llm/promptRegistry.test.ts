import { describe, expect, it } from 'vitest';
import { getExtractionPrompt } from './promptRegistry';

describe('extraction prompt registry', () => {
  it('returns stable prompt versions and schema instructions for every preset', () => {
    for (const preset of ['general-thought', 'product-idea', 'work-reminder', 'story-idea'] as const) {
      const prompt = getExtractionPrompt({
        preset,
        ideaId: 'idea-1',
        transcriptText: 'We should build a better review flow.',
      });

      expect(prompt.promptVersion).toBe(`extract-${preset}-v1`);
      expect(prompt.system).toContain('Return only JSON');
      expect(prompt.user).toContain('sourceSpan');
      expect(prompt.user).toContain('We should build a better review flow.');
    }
  });
});
