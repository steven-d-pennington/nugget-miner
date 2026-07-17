import type { OrganizationResult } from '@/lib/validation/organizationResult';
import type { SegmentationResult } from '@/lib/validation/segmentationResult';

export interface CanonicalFixture {
  id: string;
  transcript: string;
  expectedIdeaCount: number;
  expectedCategoryIds: string[];
  forbiddenExplicitClaims: string[];
}

export interface EvalScore {
  total: number;
  correctIdeaCount: number;
  correctCategories: number;
  invalidCategoryIds: number;
  unsupportedExplicitClaims: number;
}

export interface DuplicateAction {
  first: string;
  second: string;
  key: string;
  reason: 'normalized-equality' | 'shared-action-head-object';
}

export interface FixtureScore {
  fixtureId: string;
  expectedIdeaCount: number;
  actualIdeaCount: number;
  expectedCategoryIds: string[];
  actualCategoryIds: string[];
  ideaCountCorrect: boolean;
  categoriesCorrect: boolean;
  invalidCategoryIds: string[];
  forbiddenExplicitClaimsFound: string[];
  researchNeededCorrect: boolean | null;
  impliedGoalsUseInferredBasis: boolean | null;
  duplicateSuggestedActions: DuplicateAction[];
  specialRequirementsPassed: boolean;
}

export interface ScoredEvalCase {
  fixture: CanonicalFixture;
  segmentation: SegmentationResult;
  organization: OrganizationResult;
}

export interface EvalReportScore {
  score: EvalScore;
  results: FixtureScore[];
}

export function ideaBoundaryAccuracy(score: EvalScore) {
  return score.total === 0 ? 1 : score.correctIdeaCount / score.total;
}

export function categoryAccuracy(score: EvalScore) {
  return score.total === 0 ? 1 : score.correctCategories / score.total;
}

export function passesMvpGates(score: EvalScore) {
  return ideaBoundaryAccuracy(score) >= 0.9
    && categoryAccuracy(score) >= 0.85
    && score.invalidCategoryIds === 0
    && score.unsupportedExplicitClaims === 0;
}

export function normalizeEvaluationText(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/[\u2018\u2019']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

const ACTION_TOKEN_ALIASES: Readonly<Record<string, string>> = {
  begin: 'create',
  build: 'create',
  creates: 'create',
  creating: 'create',
  make: 'create',
  makes: 'create',
  making: 'create',
  setup: 'create',
  start: 'create',
  started: 'create',
  starting: 'create',
  sheet: 'spreadsheet',
  sheets: 'spreadsheet',
  spreadsheets: 'spreadsheet',
  listed: 'list',
  listing: 'list',
  lists: 'list',
};

const ACTION_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'basically',
  'before',
  'first',
  'for',
  'i',
  'is',
  'it',
  'next',
  'of',
  'should',
  'step',
  'that',
  'the',
  'these',
  'those',
  'to',
  'with',
]);

/**
 * Produces a comparison key, not display text. Sorting makes word order,
 * punctuation, casing, articles, and a small set of common action synonyms
 * irrelevant without using a fuzzy or model-based comparison.
 */
export function normalizeSuggestedActionText(value: string): string {
  const tokens = canonicalActionTokens(value);

  return [...new Set(tokens)].sort().join(' ');
}

function canonicalActionTokens(value: string): string[] {
  return normalizeEvaluationText(value)
    .split(' ')
    .filter(Boolean)
    .map((token) => ACTION_TOKEN_ALIASES[token] ?? token)
    .filter((token) => !ACTION_STOP_WORDS.has(token));
}

function canonicalDuplicateActionSignature(value: string): string | undefined {
  const tokens = new Set(canonicalActionTokens(value));

  // The canonical duplicate-actions fixture repeats one create-spreadsheet
  // action with different details (fields, pantry context, and modifiers).
  // Keep this narrow so unrelated actions in the same idea remain distinct.
  if (tokens.has('create') && tokens.has('spreadsheet')) {
    return 'create:spreadsheet';
  }

  return undefined;
}

export function findNormalizedDuplicateActions(actions: readonly string[]): DuplicateAction[] {
  const firstByKey = new Map<string, string>();
  const firstBySignature = new Map<string, string>();
  const duplicates: DuplicateAction[] = [];

  for (const action of actions) {
    const normalized = normalizeSuggestedActionText(action);
    if (!normalized) continue;
    const first = firstByKey.get(normalized);
    if (first) {
      duplicates.push({
        first,
        second: action,
        key: normalized,
        reason: 'normalized-equality',
      });
      continue;
    }

    const signature = canonicalDuplicateActionSignature(action);
    const firstWithSignature = signature ? firstBySignature.get(signature) : undefined;
    if (signature && firstWithSignature) {
      duplicates.push({
        first: firstWithSignature,
        second: action,
        key: signature,
        reason: 'shared-action-head-object',
      });
      continue;
    }

    firstByKey.set(normalized, action);
    if (signature) firstBySignature.set(signature, action);
  }

  return duplicates;
}

function exactOrderedMatch(actual: readonly string[], expected: readonly string[]) {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

function explicitTexts(organization: OrganizationResult): string[] {
  return organization.ideas.flatMap((idea) => {
    const fields = [
      idea.summary,
      idea.purpose,
      ...idea.goals,
      idea.problem?.statement,
      ...idea.blockers,
      ...idea.questions,
      ...idea.suggestedActions,
      idea.research.assessment,
    ];

    return fields
      .filter((field) => field?.basis === 'explicit')
      .map((field) => field!.text);
  });
}

export function scoreFixture(
  fixture: CanonicalFixture,
  segmentation: SegmentationResult,
  organization: OrganizationResult,
  allowedCategoryIds: ReadonlySet<string>,
): FixtureScore {
  const candidateOrder = segmentation.ideas.map((idea) => idea.candidateId);
  const orderedCandidateIds = new Set(candidateOrder);
  const organizationByCandidate = new Map(organization.ideas.map((idea) => [idea.candidateId, idea]));
  const orderedIdeas = candidateOrder
    .map((candidateId) => organizationByCandidate.get(candidateId))
    .filter((idea): idea is OrganizationResult['ideas'][number] => idea !== undefined);
  const extraIdeas = organization.ideas.filter((idea) => !orderedCandidateIds.has(idea.candidateId));
  const actualCategoryIds = [...orderedIdeas, ...extraIdeas].map((idea) => idea.categoryId);
  const invalidCategoryIds = organization.ideas
    .map((idea) => idea.categoryId)
    .filter((id) => !allowedCategoryIds.has(id));
  const normalizedExplicitTexts = explicitTexts(organization).map(normalizeEvaluationText);
  const forbiddenExplicitClaimsFound = fixture.forbiddenExplicitClaims.filter((claim) => {
    const normalizedClaim = normalizeEvaluationText(claim);
    return normalizedClaim.length > 0 && normalizedExplicitTexts.some((text) => text.includes(normalizedClaim));
  });

  const researchNeededCorrect = fixture.id === 'research-needed'
    ? organization.ideas.length > 0 && organization.ideas.every((idea) => idea.research.needed)
    : null;
  const impliedGoalsUseInferredBasis = fixture.id === 'implied-goal'
    ? organization.ideas.every((idea) => idea.goals.every((goal) => goal.basis === 'inferred'))
    : null;
  const duplicateSuggestedActions = fixture.id === 'duplicate-actions'
    ? findNormalizedDuplicateActions(organization.ideas.flatMap((idea) => idea.suggestedActions.map((action) => action.text)))
    : [];
  const specialRequirementsPassed = (researchNeededCorrect ?? true)
    && (impliedGoalsUseInferredBasis ?? true)
    && duplicateSuggestedActions.length === 0;

  return {
    fixtureId: fixture.id,
    expectedIdeaCount: fixture.expectedIdeaCount,
    actualIdeaCount: organization.ideas.length,
    expectedCategoryIds: [...fixture.expectedCategoryIds],
    actualCategoryIds,
    ideaCountCorrect: organization.ideas.length === fixture.expectedIdeaCount,
    categoriesCorrect: exactOrderedMatch(actualCategoryIds, fixture.expectedCategoryIds),
    invalidCategoryIds,
    forbiddenExplicitClaimsFound,
    researchNeededCorrect,
    impliedGoalsUseInferredBasis,
    duplicateSuggestedActions,
    specialRequirementsPassed,
  };
}

export function scoreCanonicalEvaluation(
  cases: readonly ScoredEvalCase[],
  allowedCategoryIds: ReadonlySet<string>,
): EvalReportScore {
  const results = cases.map(({ fixture, segmentation, organization }) =>
    scoreFixture(fixture, segmentation, organization, allowedCategoryIds));
  return {
    score: {
      total: results.length,
      correctIdeaCount: results.filter((result) => result.ideaCountCorrect).length,
      correctCategories: results.filter((result) => result.categoriesCorrect).length,
      invalidCategoryIds: results.reduce((total, result) => total + result.invalidCategoryIds.length, 0),
      unsupportedExplicitClaims: results.reduce(
        (total, result) => total + result.forbiddenExplicitClaimsFound.length,
        0,
      ),
    },
    results,
  };
}
