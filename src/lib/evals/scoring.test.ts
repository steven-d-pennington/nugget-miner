import { describe, expect, it } from 'vitest';
import type { OrganizationResult } from '@/lib/validation/organizationResult';
import type { SegmentationResult } from '@/lib/validation/segmentationResult';
import {
  categoryAccuracy,
  findNormalizedDuplicateActions,
  ideaBoundaryAccuracy,
  normalizeEvaluationText,
  normalizeSuggestedActionText,
  passesMvpGates,
  scoreCanonicalEvaluation,
  scoreFixture,
  type CanonicalFixture,
  type EvalScore,
} from './scoring';

const allowedCategoryIds = new Set([
  'category-work',
  'category-school',
  'category-personal',
  'category-family',
  'category-misc',
]);

function fixture(patch: Partial<CanonicalFixture> = {}): CanonicalFixture {
  return {
    id: 'fixture',
    transcript: 'A transcript.',
    expectedIdeaCount: 1,
    expectedCategoryIds: ['category-personal'],
    forbiddenExplicitClaims: [],
    ...patch,
  };
}

type IdeaPatch = Partial<OrganizationResult['ideas'][number]>;

function idea(candidateId: string, categoryId: string, patch: IdeaPatch = {}): OrganizationResult['ideas'][number] {
  return {
    candidateId,
    title: `Idea ${candidateId}`,
    summary: {
      id: `${candidateId}-summary`,
      text: 'A grounded summary.',
      basis: 'explicit',
      sourceSpanIds: [`${candidateId}-span`],
    },
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
    categoryId,
    categoryConfidence: 0.9,
    tags: [],
    warnings: [],
    ...patch,
  };
}

function organization(...ideas: OrganizationResult['ideas']): OrganizationResult {
  return { ideas };
}

function segmentation(...candidateIds: string[]): SegmentationResult {
  return {
    ideas: candidateIds.map((candidateId, index) => ({
      candidateId,
      coreStatement: `Candidate ${candidateId}`,
      sourceSpans: [
        {
          id: `${candidateId}-span`,
          startChar: index * 20,
          endChar: index * 20 + 10,
          quote: `Candidate ${candidateId}`,
        },
      ],
    })),
  };
}

describe('MVP score thresholds', () => {
  it('calculates fixture-level accuracy and treats an empty suite as fully accurate', () => {
    const score: EvalScore = {
      total: 10,
      correctIdeaCount: 9,
      correctCategories: 8,
      invalidCategoryIds: 0,
      unsupportedExplicitClaims: 0,
    };

    expect(ideaBoundaryAccuracy(score)).toBe(0.9);
    expect(categoryAccuracy(score)).toBe(0.8);
    expect(ideaBoundaryAccuracy({ ...score, total: 0 })).toBe(1);
    expect(categoryAccuracy({ ...score, total: 0 })).toBe(1);
  });

  it('requires the accuracy thresholds and zero invalid or unsupported output', () => {
    const passing: EvalScore = {
      total: 20,
      correctIdeaCount: 18,
      correctCategories: 17,
      invalidCategoryIds: 0,
      unsupportedExplicitClaims: 0,
    };

    expect(passesMvpGates(passing)).toBe(true);
    expect(passesMvpGates({ ...passing, correctIdeaCount: 17 })).toBe(false);
    expect(passesMvpGates({ ...passing, correctCategories: 16 })).toBe(false);
    expect(passesMvpGates({ ...passing, invalidCategoryIds: 1 })).toBe(false);
    expect(passesMvpGates({ ...passing, unsupportedExplicitClaims: 1 })).toBe(false);
  });
});

describe('canonical fixture scoring', () => {
  it('scores category IDs in segmentation order even if organization output is reordered', () => {
    const testFixture = fixture({
      expectedIdeaCount: 2,
      expectedCategoryIds: ['category-work', 'category-school'],
    });
    const reversedOutput = organization(idea('two', 'category-school'), idea('one', 'category-work'));

    const result = scoreFixture(testFixture, segmentation('one', 'two'), reversedOutput, allowedCategoryIds);

    expect(result.ideaCountCorrect).toBe(true);
    expect(result.categoriesCorrect).toBe(true);
    expect(result.actualCategoryIds).toEqual(['category-work', 'category-school']);

    const wrongMapping = scoreFixture(
      testFixture,
      segmentation('one', 'two'),
      organization(idea('two', 'category-work'), idea('one', 'category-school')),
      allowedCategoryIds,
    );
    expect(wrongMapping.categoriesCorrect).toBe(false);
    expect(wrongMapping.actualCategoryIds).toEqual(['category-school', 'category-work']);
  });

  it('reports every category ID outside the supplied category set', () => {
    const result = scoreFixture(
      fixture({ expectedIdeaCount: 2, expectedCategoryIds: ['category-personal', 'category-misc'] }),
      segmentation('one', 'two'),
      organization(idea('one', 'category-unknown'), idea('two', 'category-unknown')),
      allowedCategoryIds,
    );

    expect(result.invalidCategoryIds).toEqual(['category-unknown', 'category-unknown']);
  });

  it('normalizes punctuation, casing, apostrophes, and whitespace in forbidden explicit claims', () => {
    const result = scoreFixture(
      fixture({ forbiddenExplicitClaims: ['Security review is the only blocker'] }),
      segmentation('one'),
      organization(
        idea('one', 'category-personal', {
          blockers: [
            {
              id: 'claim',
              text: '  SECURITY-review is the ONLY blocker!!! ',
              basis: 'explicit',
              sourceSpanIds: ['one-span'],
            },
          ],
        }),
      ),
      allowedCategoryIds,
    );

    expect(normalizeEvaluationText("  It\u2019s  A TEST! ")).toBe('its a test');
    expect(result.forbiddenExplicitClaimsFound).toEqual(['Security review is the only blocker']);
  });

  it('does not count a forbidden sentence when the model labels it inferred rather than explicit', () => {
    const result = scoreFixture(
      fixture({ forbiddenExplicitClaims: ['The user has already selected a school'] }),
      segmentation('one'),
      organization(
        idea('one', 'category-personal', {
          purpose: {
            id: 'inferred',
            text: 'The user has already selected a school.',
            basis: 'inferred',
            sourceSpanIds: [],
          },
        }),
      ),
      allowedCategoryIds,
    );

    expect(result.forbiddenExplicitClaimsFound).toEqual([]);
  });

  it('requires research.needed for the research-needed fixture', () => {
    const failing = scoreFixture(
      fixture({ id: 'research-needed' }),
      segmentation('one'),
      organization(idea('one', 'category-personal')),
      allowedCategoryIds,
    );
    const passing = scoreFixture(
      fixture({ id: 'research-needed' }),
      segmentation('one'),
      organization(
        idea('one', 'category-personal', {
          research: {
            needed: true,
            assessment: null,
            suggestedQueries: ['Compare programs'],
            suggestedResourceTypes: ['Official program pages'],
          },
        }),
      ),
      allowedCategoryIds,
    );

    expect(failing.researchNeededCorrect).toBe(false);
    expect(failing.specialRequirementsPassed).toBe(false);
    expect(passing.researchNeededCorrect).toBe(true);
    expect(passing.specialRequirementsPassed).toBe(true);
  });

  it('rejects explicit or suggested goals derived for implied-goal', () => {
    const explicitGoal = {
      id: 'goal',
      text: 'Finish organizing the workshop.',
      basis: 'explicit' as const,
      sourceSpanIds: ['one-span'],
    };
    const inferredGoal = { ...explicitGoal, basis: 'inferred' as const };

    expect(
      scoreFixture(
        fixture({ id: 'implied-goal' }),
        segmentation('one'),
        organization(idea('one', 'category-personal', { goals: [explicitGoal] })),
        allowedCategoryIds,
      ).specialRequirementsPassed,
    ).toBe(false);
    expect(
      scoreFixture(
        fixture({ id: 'implied-goal' }),
        segmentation('one'),
        organization(idea('one', 'category-personal', { goals: [inferredGoal] })),
        allowedCategoryIds,
      ).specialRequirementsPassed,
    ).toBe(true);
  });

  it('detects duplicate suggested actions despite trivial wording changes', () => {
    const first = 'Start a sheet for the pantry.';
    const second = 'Create the pantry spreadsheet!';

    expect(normalizeSuggestedActionText(first)).toBe('create pantry spreadsheet');
    expect(normalizeSuggestedActionText(second)).toBe('create pantry spreadsheet');
    expect(findNormalizedDuplicateActions([first, second])).toEqual([
      { first, second, normalized: 'create pantry spreadsheet' },
    ]);

    const result = scoreFixture(
      fixture({ id: 'duplicate-actions' }),
      segmentation('one'),
      organization(
        idea('one', 'category-personal', {
          suggestedActions: [
            { id: 'action-one', text: first, basis: 'suggested', sourceSpanIds: [] },
            { id: 'action-two', text: second, basis: 'suggested', sourceSpanIds: [] },
          ],
        }),
      ),
      allowedCategoryIds,
    );

    expect(result.duplicateSuggestedActions).toHaveLength(1);
    expect(result.specialRequirementsPassed).toBe(false);
  });

  it('aggregates fixture-level counts while retaining diagnostic results', () => {
    const cases = [
      {
        fixture: fixture({ id: 'good' }),
        segmentation: segmentation('good'),
        organization: organization(idea('good', 'category-personal')),
      },
      {
        fixture: fixture({ id: 'bad', forbiddenExplicitClaims: ['Unsupported statement'] }),
        segmentation: segmentation('bad'),
        organization: organization(
          idea('bad', 'category-invalid', {
            summary: {
              id: 'bad-summary',
              text: 'Unsupported statement.',
              basis: 'explicit',
              sourceSpanIds: ['bad-span'],
            },
          }),
        ),
      },
    ];

    const report = scoreCanonicalEvaluation(cases, allowedCategoryIds);

    expect(report.score).toEqual({
      total: 2,
      correctIdeaCount: 2,
      correctCategories: 1,
      invalidCategoryIds: 1,
      unsupportedExplicitClaims: 1,
    });
    expect(report.results.map((result) => result.fixtureId)).toEqual(['good', 'bad']);
  });
});
