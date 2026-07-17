import { describe, expect, it } from 'vitest';
import { ValidationError } from '@/lib/errors';
import { normalizeSegmentationSpans, validateOrganizationGrounding } from './grounding';
import { parseOrganizationResult, type OrganizationResult } from './organizationResult';
import { parseSegmentationResult, type SegmentationResult } from './segmentationResult';

function span(id = 'span-1', quote = 'Build a neighborhood tool library') {
  return {
    id,
    startChar: 0,
    endChar: quote.length,
    quote,
  };
}

function segmentedIdea(candidateId = 'candidate-1') {
  return {
    candidateId,
    coreStatement: 'Build a neighborhood tool library.',
    sourceSpans: [span()],
  };
}

function groundedText(
  id: string,
  basis: 'explicit' | 'inferred' | 'suggested' = 'explicit',
  sourceSpanIds: string[] = ['span-1'],
) {
  return {
    id,
    text: 'A neighborhood tool library would reduce duplicate purchases.',
    basis,
    sourceSpanIds,
  };
}

function organizedIdea(candidateId = 'candidate-1') {
  return {
    candidateId,
    title: 'Neighborhood tool library',
    summary: groundedText('summary-1'),
    purpose: null,
    goals: [],
    problem: null,
    blockers: [],
    questions: [],
    suggestedActions: [],
    research: {
      needed: false,
      assessment: null,
      suggestedQueries: [],
      suggestedResourceTypes: [],
    },
    categoryId: 'category-personal',
    categoryConfidence: 0.9,
    tags: ['community', 'sharing'],
    warnings: [],
  };
}

describe('segmentationResultSchema', () => {
  it('accepts zero ideas', () => {
    expect(parseSegmentationResult({ ideas: [] })).toEqual({ ideas: [] });
  });

  it('rejects more than twelve ideas', () => {
    const ideas = Array.from({ length: 13 }, (_, index) => segmentedIdea(`candidate-${index}`));
    expect(() => parseSegmentationResult({ ideas })).toThrow(ValidationError);
  });

  it('rejects non-forward spans and ambiguous IDs', () => {
    expect(() =>
      parseSegmentationResult({
        ideas: [{ ...segmentedIdea(), sourceSpans: [{ ...span(), startChar: 10, endChar: 2 }] }],
      }),
    ).toThrow(ValidationError);
    expect(() => parseSegmentationResult({ ideas: [segmentedIdea(), segmentedIdea()] })).toThrow(ValidationError);
    expect(() =>
      parseSegmentationResult({
        ideas: [{ ...segmentedIdea(), sourceSpans: [span(), span()] }],
      }),
    ).toThrow(ValidationError);
  });
});

describe('normalizeSegmentationSpans', () => {
  it('repairs a wrong offset only when the quote occurs uniquely', () => {
    const transcript = 'First thought. Build a neighborhood tool library next.';
    const result = parseSegmentationResult({
      ideas: [
        {
          ...segmentedIdea(),
          sourceSpans: [
            {
              ...span(),
              startChar: 1,
              endChar: 1 + span().quote.length,
            },
          ],
        },
      ],
    });

    const normalized = normalizeSegmentationSpans(transcript, result);

    expect(normalized.ideas[0]?.sourceSpans[0]).toMatchObject({
      startChar: 15,
      endChar: 48,
      quote: 'Build a neighborhood tool library',
    });
  });

  it('rejects a missing or duplicate quote instead of guessing an offset', () => {
    const result = parseSegmentationResult({ ideas: [segmentedIdea()] });
    expect(() => normalizeSegmentationSpans('No matching text.', result)).toThrow(ValidationError);
    const mismatchedResult = parseSegmentationResult({
      ideas: [
        {
          ...segmentedIdea(),
          sourceSpans: [{ ...span(), startChar: 1, endChar: 1 + span().quote.length }],
        },
      ],
    });
    expect(() =>
      normalizeSegmentationSpans(
        'Build a neighborhood tool library, then Build a neighborhood tool library.',
        mismatchedResult,
      ),
    ).toThrow(ValidationError);
  });
});

describe('organizationResultSchema and grounding', () => {
  it('accepts an unknown category for later validation against supplied categories', () => {
    const parsed = parseOrganizationResult({
      ideas: [{ ...organizedIdea(), categoryId: 'category-not-supplied' }],
    });
    expect(parsed.ideas[0]?.categoryId).toBe('category-not-supplied');
  });

  it('rejects duplicate candidate and grounded content IDs', () => {
    expect(() =>
      parseOrganizationResult({ ideas: [organizedIdea(), organizedIdea()] }),
    ).toThrow(ValidationError);
    expect(() =>
      parseOrganizationResult({
        ideas: [
          {
            ...organizedIdea(),
            suggestedActions: [groundedText('summary-1', 'suggested', [])],
          },
        ],
      }),
    ).toThrow(ValidationError);
  });

  it('rejects explicit content without evidence', () => {
    const segmentation = parseSegmentationResult({ ideas: [segmentedIdea()] });
    const organization = parseOrganizationResult({
      ideas: [{ ...organizedIdea(), summary: groundedText('summary-1', 'explicit', []) }],
    });
    expect(() => validateOrganizationGrounding(segmentation, organization)).toThrowError(
      'Explicit content requires source evidence.',
    );
  });

  it.each(['inferred', 'suggested'] as const)('allows %s content without a source span', (basis) => {
    const segmentation = parseSegmentationResult({ ideas: [segmentedIdea()] });
    const organization = parseOrganizationResult({
      ideas: [{ ...organizedIdea(), summary: groundedText('summary-1', basis, []) }],
    });
    expect(() => validateOrganizationGrounding(segmentation, organization)).not.toThrow();
  });

  it('rejects unknown candidates and source spans', () => {
    const segmentation = parseSegmentationResult({ ideas: [segmentedIdea()] });
    const unknownCandidate = parseOrganizationResult({ ideas: [organizedIdea('candidate-unknown')] });
    expect(() => validateOrganizationGrounding(segmentation, unknownCandidate)).toThrowError(
      'Organization referenced an unknown candidate.',
    );

    const unknownSpan = parseOrganizationResult({
      ideas: [{ ...organizedIdea(), summary: groundedText('summary-1', 'explicit', ['span-unknown']) }],
    });
    expect(() => validateOrganizationGrounding(segmentation, unknownSpan)).toThrowError(
      'Content referenced an unknown source span.',
    );
  });

  it('rejects an organization result that omits a segmented candidate', () => {
    const segmentation = parseSegmentationResult({
      ideas: [segmentedIdea('candidate-1'), segmentedIdea('candidate-2')],
    });
    const organization = parseOrganizationResult({ ideas: [organizedIdea('candidate-1')] });

    expect(() => validateOrganizationGrounding(segmentation, organization)).toThrowError(
      'Organization omitted a segmented candidate.',
    );
  });

  it('accepts a fully grounded candidate', () => {
    const segmentation: SegmentationResult = parseSegmentationResult({ ideas: [segmentedIdea()] });
    const organization: OrganizationResult = parseOrganizationResult({ ideas: [organizedIdea()] });
    expect(validateOrganizationGrounding(segmentation, organization)).toBeUndefined();
  });
});
