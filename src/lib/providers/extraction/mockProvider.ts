import { ProviderError } from '@/lib/errors';
import { ORGANIZATION_PROMPT_VERSION } from '@/lib/llm/organizationPrompt';
import { SEGMENTATION_PROMPT_VERSION } from '@/lib/llm/segmentationPrompt';
import { parseExtractionResult } from '@/lib/validation/extractionResult';
import { validateOrganizationGrounding } from '@/lib/validation/grounding';
import {
  ORGANIZATION_SCHEMA_VERSION,
  parseOrganizationResult,
  type OrganizationResult,
} from '@/lib/validation/organizationResult';
import {
  SEGMENTATION_SCHEMA_VERSION,
  parseSegmentationResult,
  type SegmentationResult,
} from '@/lib/validation/segmentationResult';
import type { ExtractionPreset } from '@/types';
import type {
  ExtractionProvider,
  OrganizationProvider,
  OrganizationProviderCategory,
  OrganizationProviderDescriptor,
} from './types';

const MOCK_MODEL = 'deterministic-organization-mock';
const LEGACY_PROMPT_VERSION = 'mock-extraction-v1';
const NO_MEANINGFUL_IDEA_FIXTURE = 'no-meaningful-idea-fixture';
const FAILED_EXTRACTION_FIXTURE = 'failed-extraction-fixture';

const descriptor: OrganizationProviderDescriptor = {
  provider: 'mock',
  model: MOCK_MODEL,
  reasoningEffort: 'deterministic',
  segmentationPromptVersion: SEGMENTATION_PROMPT_VERSION,
  organizationPromptVersion: ORGANIZATION_PROMPT_VERSION,
  segmentationSchemaVersion: SEGMENTATION_SCHEMA_VERSION,
  organizationSchemaVersion: ORGANIZATION_SCHEMA_VERSION,
};

interface ParagraphSpan {
  text: string;
  startChar: number;
  endChar: number;
}

function fixtureFailure(text: string) {
  return text.toLowerCase().includes(FAILED_EXTRACTION_FIXTURE);
}

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Mock organization was aborted.', 'AbortError');
}

function trimmedSpan(text: string, start: number, end: number): ParagraphSpan | undefined {
  while (start < end && /\s/.test(text[start] ?? '')) start += 1;
  while (end > start && /\s/.test(text[end - 1] ?? '')) end -= 1;
  if (start === end) return undefined;
  return { text: text.slice(start, end), startChar: start, endChar: end };
}

function paragraphSpans(text: string): ParagraphSpan[] {
  const spans: ParagraphSpan[] = [];
  const separator = /\r?\n[ \t]*\r?\n/g;
  let start = 0;
  for (const match of text.matchAll(separator)) {
    const end = match.index ?? start;
    const span = trimmedSpan(text, start, end);
    if (span) spans.push(span);
    start = end + match[0].length;
  }
  const last = trimmedSpan(text, start, text.length);
  if (last) spans.push(last);
  return spans;
}

function compact(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function segmentResult(text: string): SegmentationResult {
  if (!text.trim() || text.trim().toLowerCase() === NO_MEANINGFUL_IDEA_FIXTURE) {
    return parseSegmentationResult({ ideas: [] });
  }

  return parseSegmentationResult({
    ideas: paragraphSpans(text).slice(0, 12).map((paragraph, index) => {
      const candidateId = `candidate-${index + 1}`;
      return {
        candidateId,
        coreStatement: compact(paragraph.text),
        sourceSpans: [
          {
            id: `${candidateId}-span-1`,
            startChar: paragraph.startChar,
            endChar: paragraph.endChar,
            quote: paragraph.text,
          },
        ],
      };
    }),
  });
}

const CATEGORY_SIGNALS: Record<string, string[]> = {
  work: ['work', 'client', 'customer', 'team', 'office', 'support', 'professional', 'business', 'manager'],
  school: ['school', 'class', 'course', 'degree', 'certificate', 'paper', 'study', 'student', 'teacher'],
  family: ['family', 'relative', 'reunion', 'aunt', 'uncle', 'parent', 'grandmother', 'birthday'],
  personal: ['personal', 'home', 'garage', 'neighborhood', 'garden', 'pantry', 'household', 'hobby'],
};

const TAG_STOP_WORDS = new Set([
  'about',
  'after',
  'again',
  'because',
  'before',
  'could',
  'every',
  'first',
  'should',
  'their',
  'there',
  'these',
  'thing',
  'think',
  'those',
  'would',
]);

function tokens(text: string) {
  return compact(text)
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function reusableTags(text: string) {
  return [...new Set(tokens(text).filter((word) => word.length >= 4 && !TAG_STOP_WORDS.has(word)))].slice(0, 6);
}

function categoryScore(category: OrganizationProviderCategory, candidateText: string) {
  const candidateTokens = new Set(tokens(candidateText));
  const normalizedName = compact(category.name).toLowerCase();
  let score = candidateTokens.has(normalizedName) ? 5 : 0;

  for (const signal of CATEGORY_SIGNALS[normalizedName] ?? []) {
    if (candidateTokens.has(signal)) score += 3;
  }

  const descriptiveTokens = new Set(
    tokens(`${category.name} ${category.description}`).filter((word) => word.length >= 5 && !TAG_STOP_WORDS.has(word)),
  );
  for (const word of descriptiveTokens) {
    if (candidateTokens.has(word)) score += 1;
  }
  return score;
}

function chooseCategory(categories: readonly OrganizationProviderCategory[], candidateText: string) {
  const fallbackCategories = categories.filter((category) => category.isFallback);
  if (categories.length === 0 || fallbackCategories.length !== 1) {
    throw new ProviderError('Mock organization requires exactly one fallback category.');
  }

  const fallback = fallbackCategories[0]!;
  const scored = categories
    .filter((category) => !category.isFallback)
    .map((category, index) => ({ category, index, score: categoryScore(category, candidateText) }))
    .sort((left, right) => right.score - left.score || left.index - right.index);
  return scored[0] && scored[0].score > 0
    ? { category: scored[0].category, confidence: Math.min(0.95, 0.72 + scored[0].score * 0.03) }
    : { category: fallback, confidence: 0.45 };
}

function titleFromCandidate(text: string) {
  const words = compact(text).replace(/[.!?]+$/, '').split(' ').slice(0, 9);
  const title = words.join(' ');
  return `${title.charAt(0).toUpperCase()}${title.slice(1)}`.slice(0, 120);
}

function organizedResult(
  segmentation: SegmentationResult,
  categories: readonly OrganizationProviderCategory[],
): OrganizationResult {
  const ideas = segmentation.ideas.map((candidate) => {
    const spanIds = candidate.sourceSpans.map((span) => span.id);
    const category = chooseCategory(categories, candidate.coreStatement);
    const lower = candidate.coreStatement.toLowerCase();
    const candidatePrefix = candidate.candidateId;
    const researchNeeded = /\b(research|compare|investigate|find out|confirm|check)\b/i.test(lower);
    const hasProblem = /\b(problem|issue|frustrat|difficult|pain)\w*/i.test(lower);
    const hasBlocker = /\b(blocker|blocked|needs?(?: to)?|must|required|concern)\b/i.test(lower);
    const hasQuestion = candidate.sourceSpans.some((span) => span.quote.includes('?'));
    const fallbackUsed = category.category.isFallback;

    return {
      candidateId: candidate.candidateId,
      title: titleFromCandidate(candidate.coreStatement),
      summary: {
        id: `${candidatePrefix}-summary`,
        text: candidate.coreStatement,
        basis: 'explicit' as const,
        sourceSpanIds: spanIds,
      },
      purpose: {
        id: `${candidatePrefix}-purpose`,
        text: `Develop the idea described in ${candidate.coreStatement.slice(0, 90)}.`,
        basis: 'inferred' as const,
        sourceSpanIds: spanIds,
      },
      goals: [],
      problem: hasProblem
        ? {
            statement: {
              id: `${candidatePrefix}-problem`,
              text: candidate.coreStatement,
              basis: 'explicit' as const,
              sourceSpanIds: spanIds,
            },
            type: null,
          }
        : null,
      blockers: hasBlocker
        ? [
            {
              id: `${candidatePrefix}-blocker`,
              text: candidate.coreStatement,
              basis: 'explicit' as const,
              sourceSpanIds: spanIds,
            },
          ]
        : [],
      questions: hasQuestion
        ? [
            {
              id: `${candidatePrefix}-question`,
              text: candidate.sourceSpans.find((span) => span.quote.includes('?'))?.quote ?? candidate.coreStatement,
              basis: 'explicit' as const,
              sourceSpanIds: spanIds,
            },
          ]
        : [],
      suggestedActions: [
        {
          id: `${candidatePrefix}-action-1`,
          text: 'Choose one concrete next step for this idea.',
          basis: 'suggested' as const,
          sourceSpanIds: [],
        },
      ],
      research: {
        needed: researchNeeded,
        assessment: researchNeeded
          ? {
              id: `${candidatePrefix}-research`,
              text: 'Some facts should be checked before committing to this idea.',
              basis: 'inferred' as const,
              sourceSpanIds: spanIds,
            }
          : null,
        suggestedQueries: researchNeeded ? [`Research ${titleFromCandidate(candidate.coreStatement)}`] : [],
        suggestedResourceTypes: researchNeeded ? ['Primary sources', 'Official guidance'] : [],
      },
      categoryId: category.category.id,
      categoryConfidence: category.confidence,
      tags: reusableTags(candidate.coreStatement),
      warnings: fallbackUsed ? ['No supplied category matched strongly; the fallback category was used.'] : [],
    };
  });

  const parsed = parseOrganizationResult({ ideas });
  validateOrganizationGrounding(segmentation, parsed);
  return parsed;
}

export const mockOrganizationProvider: OrganizationProvider = {
  id: 'mock',
  label: 'Deterministic organization mock',
  mode: 'mock',
  async isAvailable() {
    return true;
  },
  async getDescriptor() {
    return descriptor;
  },
  async segment(input) {
    assertNotAborted(input.signal);
    if (fixtureFailure(input.transcript.text)) throw new ProviderError('Mock extraction fixture failed.');
    return {
      result: segmentResult(input.transcript.text),
      provider: descriptor.provider,
      model: descriptor.model,
      responseId: `mock-segment:${input.captureSessionId}:${input.transcript.contentHash}`,
      promptVersion: descriptor.segmentationPromptVersion,
      schemaVersion: descriptor.segmentationSchemaVersion,
    };
  },
  async organize(input) {
    assertNotAborted(input.signal);
    if (input.segmentation.ideas.some((candidate) => fixtureFailure(candidate.coreStatement))) {
      throw new ProviderError('Mock extraction fixture failed.');
    }
    const segmentation = parseSegmentationResult(input.segmentation);
    return {
      result: organizedResult(segmentation, input.categories),
      provider: descriptor.provider,
      model: descriptor.model,
      responseId: `mock-organize:${input.captureSessionId}:${input.transcript.contentHash}`,
      promptVersion: descriptor.organizationPromptVersion,
      schemaVersion: descriptor.organizationSchemaVersion,
    };
  },
};

function presetLabel(preset: ExtractionPreset) {
  if (preset === 'product-idea') return 'Product idea';
  if (preset === 'work-reminder') return 'Work reminder';
  if (preset === 'story-idea') return 'Story idea';
  return 'General thought';
}

/** @deprecated Temporary compatibility adapter for the pre-Sprint-2 ReviewService. */
export const mockExtractionProvider: ExtractionProvider = {
  id: 'mock',
  label: 'Mock extraction',
  mode: 'mock',
  async isAvailable() {
    return true;
  },
  async extract({ transcript, context, signal }) {
    assertNotAborted(signal);
    if (fixtureFailure(transcript.text)) throw new ProviderError('Mock extraction fixture failed.');
    const text = compact(transcript.text) || 'Empty transcript';
    const end = transcript.text.length;
    const label = presetLabel(context.preset);
    return {
      result: parseExtractionResult({
        summary: `${label} summary: ${text.slice(0, 180)}`,
        nuggets: [
          {
            title: `${label} nugget`,
            detail: text,
            category: 'idea',
            confidence: 0.82,
            sourceSpan: { start: 0, end },
          },
        ],
        actions: [
          {
            title: context.preset === 'work-reminder' ? 'Follow up on this thought' : 'Review the next step',
            description: text,
            priority: context.preset === 'work-reminder' ? 'high' : 'medium',
            dueDate: null,
            project: null,
            confidence: 0.74,
            sourceSpan: { start: 0, end },
          },
        ],
        questions: [
          {
            text: 'What should happen next?',
            confidence: 0.69,
            sourceSpan: { start: 0, end },
          },
        ],
        tags: reusableTags(text).slice(0, 4),
        warnings: [],
      }),
      provider: 'mock',
      promptVersion: LEGACY_PROMPT_VERSION,
      model: 'deterministic-mock',
    };
  },
};

export const mockExtractionPromptVersion = LEGACY_PROMPT_VERSION;
