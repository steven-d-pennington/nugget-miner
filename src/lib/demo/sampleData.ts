import { DEFAULT_CATEGORY_IDS } from '@/lib/db/defaultCategories';
import type { ActionItem, CaptureSession, GroundedText, Idea, SourceSpan, Tag, Transcript } from '@/types';

export const SAMPLE_TIMESTAMP = Date.UTC(2026, 6, 15, 12, 0, 0);
export const SAMPLE_CAPTURE_ID = 'demo-capture';
export const SAMPLE_TRANSCRIPT_ID = 'demo-transcript';

export const SAMPLE_TRANSCRIPT_TEXT = [
  'Personal: Create a neighborhood tool-sharing library.',
  'A simple way for neighbors to lend rarely used tools, reduce duplicate purchases, and coordinate pickup.',
  'Test whether ten nearby households would participate.',
  'Need a simple way to track availability and responsibility.',
  'Compare lightweight inventory and lending tools.',
  'Draft a one-page interest survey.',
  'Work: An automated weekly support handoff that summarizes unresolved tickets, customer impact, owners, and next steps before Monday standup.',
  'Fewer dropped escalations between support shifts.',
  'Map the existing handoff fields.',
  'School: Compare evening data-science programs with applied machine-learning coursework, flexible schedules, and tuition support.',
  'Choose a program that fits a full-time schedule.',
  'Can the capstone focus on public-interest data?',
].join(' ');

function sourceSpan(id: string, quote: string): SourceSpan {
  const startChar = SAMPLE_TRANSCRIPT_TEXT.indexOf(quote);
  if (startChar < 0) throw new Error(`Sample source quote is missing: ${quote}`);
  return { id, startChar, endChar: startChar + quote.length, quote };
}

function grounded(
  id: string,
  text: string,
  basis: GroundedText['basis'],
  sourceSpanIds: string[] = [],
): GroundedText {
  return { id, text, basis, sourceSpanIds };
}

const personalSpans = [
  sourceSpan('demo-span-personal-summary', 'A simple way for neighbors to lend rarely used tools, reduce duplicate purchases, and coordinate pickup.'),
  sourceSpan('demo-span-personal-goal', 'Test whether ten nearby households would participate.'),
  sourceSpan('demo-span-personal-blocker', 'Need a simple way to track availability and responsibility.'),
  sourceSpan('demo-span-personal-research', 'Compare lightweight inventory and lending tools.'),
  sourceSpan('demo-span-personal-action', 'Draft a one-page interest survey.'),
];

const workSpans = [
  sourceSpan('demo-span-work-summary', 'An automated weekly support handoff that summarizes unresolved tickets, customer impact, owners, and next steps before Monday standup.'),
  sourceSpan('demo-span-work-goal', 'Fewer dropped escalations between support shifts.'),
  sourceSpan('demo-span-work-action', 'Map the existing handoff fields.'),
];

const schoolSpans = [
  sourceSpan('demo-span-school-summary', 'Compare evening data-science programs with applied machine-learning coursework, flexible schedules, and tuition support.'),
  sourceSpan('demo-span-school-goal', 'Choose a program that fits a full-time schedule.'),
  sourceSpan('demo-span-school-question', 'Can the capstone focus on public-interest data?'),
];

export const SAMPLE_CAPTURE: CaptureSession = {
  id: SAMPLE_CAPTURE_ID,
  source: 'audio',
  transcriptId: SAMPLE_TRANSCRIPT_ID,
  processingState: 'confirmed',
  processingPreference: 'manual',
  processingAttempt: 0,
  durationMs: 92_000,
  createdAt: SAMPLE_TIMESTAMP,
  updatedAt: SAMPLE_TIMESTAMP,
};

export const SAMPLE_TRANSCRIPT: Transcript = {
  id: SAMPLE_TRANSCRIPT_ID,
  captureSessionId: SAMPLE_CAPTURE_ID,
  version: 1,
  text: SAMPLE_TRANSCRIPT_TEXT,
  provider: 'local-sample',
  model: 'none',
  source: 'transcription',
  contentHash: 'demo-sample-transcript-v1',
  createdAt: SAMPLE_TIMESTAMP,
  updatedAt: SAMPLE_TIMESTAMP,
};

export const SAMPLE_TAGS: Tag[] = [
  { id: 'demo-tag-community', name: 'community', normalizedName: 'community', createdAt: SAMPLE_TIMESTAMP },
  { id: 'demo-tag-sharing', name: 'sharing', normalizedName: 'sharing', createdAt: SAMPLE_TIMESTAMP },
  { id: 'demo-tag-weekend-project', name: 'weekend project', normalizedName: 'weekend project', createdAt: SAMPLE_TIMESTAMP },
  { id: 'demo-tag-handoff', name: 'handoff', normalizedName: 'handoff', createdAt: SAMPLE_TIMESTAMP },
  { id: 'demo-tag-automation', name: 'automation', normalizedName: 'automation', createdAt: SAMPLE_TIMESTAMP },
  { id: 'demo-tag-research', name: 'research', normalizedName: 'research', createdAt: SAMPLE_TIMESTAMP },
];

export const SAMPLE_IDEAS: Idea[] = [
  {
    id: 'demo-idea-tool-sharing',
    captureSessionId: SAMPLE_CAPTURE_ID,
    status: 'confirmed',
    title: 'Create a neighborhood tool-sharing library',
    summary: grounded('demo-grounded-personal-summary', personalSpans[0]!.quote, 'explicit', [personalSpans[0]!.id]),
    purpose: grounded('demo-grounded-personal-purpose', 'Make it easier for nearby households to share useful tools.', 'inferred'),
    goals: [grounded('demo-grounded-personal-goal', personalSpans[1]!.quote, 'explicit', [personalSpans[1]!.id])],
    problem: {
      statement: grounded('demo-grounded-personal-problem', 'Neighbors need a clear way to coordinate shared tools.', 'inferred'),
      type: 'Coordination',
    },
    blockers: [grounded('demo-grounded-personal-blocker', personalSpans[2]!.quote, 'explicit', [personalSpans[2]!.id])],
    questions: [grounded('demo-grounded-personal-question', 'Which households want to participate first?', 'inferred')],
    suggestedActions: [grounded('demo-suggestion-interest-survey', personalSpans[4]!.quote, 'suggested', [personalSpans[4]!.id])],
    research: {
      needed: true,
      assessment: grounded('demo-grounded-personal-research', personalSpans[3]!.quote, 'explicit', [personalSpans[3]!.id]),
      suggestedQueries: ['lightweight inventory and lending tools'],
      suggestedResourceTypes: ['Community tool-library case studies'],
    },
    categoryId: DEFAULT_CATEGORY_IDS.personal,
    categoryConfidence: 1,
    tagIds: ['demo-tag-community', 'demo-tag-sharing', 'demo-tag-weekend-project'],
    sourceSpans: personalSpans,
    createdAt: SAMPLE_TIMESTAMP,
    updatedAt: SAMPLE_TIMESTAMP,
    confirmedAt: SAMPLE_TIMESTAMP,
  },
  {
    id: 'demo-idea-weekly-handoff',
    captureSessionId: SAMPLE_CAPTURE_ID,
    status: 'confirmed',
    title: 'Automate the weekly support handoff',
    summary: grounded('demo-grounded-work-summary', workSpans[0]!.quote, 'explicit', [workSpans[0]!.id]),
    purpose: grounded('demo-grounded-work-purpose', 'Make unresolved support context reliable across shifts.', 'inferred'),
    goals: [grounded('demo-grounded-work-goal', workSpans[1]!.quote, 'explicit', [workSpans[1]!.id])],
    problem: {
      statement: grounded('demo-grounded-work-problem', 'Support context can be lost when one shift hands off to another.', 'inferred'),
      type: 'Workflow',
    },
    blockers: [],
    questions: [grounded('demo-grounded-work-question', 'Which existing system owns the source fields?', 'inferred')],
    suggestedActions: [grounded('demo-suggestion-handoff-fields', workSpans[2]!.quote, 'suggested', [workSpans[2]!.id])],
    research: { needed: false, suggestedQueries: [], suggestedResourceTypes: [] },
    categoryId: DEFAULT_CATEGORY_IDS.work,
    categoryConfidence: 1,
    tagIds: ['demo-tag-handoff', 'demo-tag-automation'],
    sourceSpans: workSpans,
    createdAt: SAMPLE_TIMESTAMP,
    updatedAt: SAMPLE_TIMESTAMP,
    confirmedAt: SAMPLE_TIMESTAMP,
  },
  {
    id: 'demo-idea-evening-data-science',
    captureSessionId: SAMPLE_CAPTURE_ID,
    status: 'confirmed',
    title: 'Compare evening data-science programs',
    summary: grounded('demo-grounded-school-summary', schoolSpans[0]!.quote, 'explicit', [schoolSpans[0]!.id]),
    purpose: grounded('demo-grounded-school-purpose', 'Find a practical program that supports long-term learning goals.', 'inferred'),
    goals: [grounded('demo-grounded-school-goal', schoolSpans[1]!.quote, 'explicit', [schoolSpans[1]!.id])],
    problem: {
      statement: grounded('demo-grounded-school-problem', 'Program options need to fit work, learning, and budget constraints.', 'inferred'),
      type: 'Decision',
    },
    blockers: [],
    questions: [grounded('demo-grounded-school-question', schoolSpans[2]!.quote, 'explicit', [schoolSpans[2]!.id])],
    suggestedActions: [],
    research: { needed: false, suggestedQueries: [], suggestedResourceTypes: [] },
    categoryId: DEFAULT_CATEGORY_IDS.school,
    categoryConfidence: 1,
    tagIds: ['demo-tag-research'],
    sourceSpans: schoolSpans,
    createdAt: SAMPLE_TIMESTAMP,
    updatedAt: SAMPLE_TIMESTAMP,
    confirmedAt: SAMPLE_TIMESTAMP,
  },
];

export const SAMPLE_ACTIONS: ActionItem[] = [
  {
    id: 'demo-action-interest-survey',
    ideaId: 'demo-idea-tool-sharing',
    sourceSuggestionId: 'demo-suggestion-interest-survey',
    text: 'Draft a one-page interest survey.',
    status: 'open',
    createdAt: SAMPLE_TIMESTAMP,
    updatedAt: SAMPLE_TIMESTAMP,
  },
  {
    id: 'demo-action-handoff-fields',
    ideaId: 'demo-idea-weekly-handoff',
    sourceSuggestionId: 'demo-suggestion-handoff-fields',
    text: 'Map the existing handoff fields.',
    status: 'open',
    createdAt: SAMPLE_TIMESTAMP,
    updatedAt: SAMPLE_TIMESTAMP,
  },
];
