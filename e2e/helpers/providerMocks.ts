import type { Page, Route } from '@playwright/test';
import type { TranscriptResult } from '../../src/types/domain';
import type {
  OrganizeProviderOutput,
  SegmentProviderOutput,
} from '../../src/lib/providers/extraction/types';

const TRANSCRIPTION_MODEL = 'gpt-4o-mini-transcribe';
const ORGANIZATION_MODEL = 'gpt-5.6-terra';
const TRANSCRIPT = 'Build a neighborhood tool library for the block. Create a shared grocery planning checklist for the household.';
const TOOL_LIBRARY_QUOTE = 'Build a neighborhood tool library for the block.';
const GROCERY_CHECKLIST_QUOTE = 'Create a shared grocery planning checklist for the household.';

export const providerMockTranscript: TranscriptResult = {
  text: TRANSCRIPT,
  language: 'en',
  provider: 'cloud',
  model: TRANSCRIPTION_MODEL,
};

const segmentationResponse = {
  result: {
    ideas: [
      {
        candidateId: 'candidate-tool-library',
        coreStatement: 'Build a neighborhood tool library for the block.',
        sourceSpans: [
          {
            id: 'span-tool-library',
            startChar: TRANSCRIPT.indexOf(TOOL_LIBRARY_QUOTE),
            endChar: TRANSCRIPT.indexOf(TOOL_LIBRARY_QUOTE) + TOOL_LIBRARY_QUOTE.length,
            quote: TOOL_LIBRARY_QUOTE,
          },
        ],
      },
      {
        candidateId: 'candidate-grocery-checklist',
        coreStatement: 'Create a shared grocery planning checklist for the household.',
        sourceSpans: [
          {
            id: 'span-grocery-checklist',
            startChar: TRANSCRIPT.indexOf(GROCERY_CHECKLIST_QUOTE),
            endChar: TRANSCRIPT.indexOf(GROCERY_CHECKLIST_QUOTE) + GROCERY_CHECKLIST_QUOTE.length,
            quote: GROCERY_CHECKLIST_QUOTE,
          },
        ],
      },
    ],
  },
  provider: 'openai',
  model: ORGANIZATION_MODEL,
  responseId: 'e2e-segment-response',
  promptVersion: 'segment-v1',
  schemaVersion: 'segmentation-v1',
} satisfies SegmentProviderOutput;

const organizationResponse = {
  result: {
    ideas: [
      {
        candidateId: 'candidate-tool-library',
        title: 'Neighborhood tool library',
        summary: {
          id: 'summary-tool-library',
          text: TOOL_LIBRARY_QUOTE,
          basis: 'explicit',
          sourceSpanIds: ['span-tool-library'],
        },
        purpose: {
          id: 'purpose-tool-library',
          text: 'Make useful tools available locally.',
          basis: 'inferred',
          sourceSpanIds: [],
        },
        goals: [
          {
            id: 'goal-tool-library',
            text: 'Inventory tools neighbors are willing to share.',
            basis: 'suggested',
            sourceSpanIds: [],
          },
        ],
        problem: {
          statement: {
            id: 'problem-tool-library',
            text: 'The block needs a shared tool library.',
            basis: 'explicit',
            sourceSpanIds: ['span-tool-library'],
          },
          type: 'access',
        },
        blockers: [
          {
            id: 'blocker-tool-library',
            text: 'A storage location has not been chosen.',
            basis: 'inferred',
            sourceSpanIds: [],
          },
        ],
        questions: [
          {
            id: 'question-tool-library',
            text: 'Which neighbors want to participate?',
            basis: 'suggested',
            sourceSpanIds: [],
          },
        ],
        suggestedActions: [
          {
            id: 'action-tool-library',
            text: 'Ask neighbors which tools they can share.',
            basis: 'suggested',
            sourceSpanIds: [],
          },
        ],
        research: {
          needed: true,
          assessment: {
            id: 'research-tool-library',
            text: 'A lending workflow may need planning.',
            basis: 'inferred',
            sourceSpanIds: [],
          },
          suggestedQueries: ['neighborhood tool library lending workflow'],
          suggestedResourceTypes: ['community lending guides'],
        },
        categoryId: 'category-personal',
        categoryConfidence: 0.94,
        tags: ['community', 'tools'],
        warnings: [],
      },
      {
        candidateId: 'candidate-grocery-checklist',
        title: 'Shared grocery planning checklist',
        summary: {
          id: 'summary-grocery-checklist',
          text: GROCERY_CHECKLIST_QUOTE,
          basis: 'explicit',
          sourceSpanIds: ['span-grocery-checklist'],
        },
        purpose: {
          id: 'purpose-grocery-checklist',
          text: 'Coordinate household grocery shopping.',
          basis: 'inferred',
          sourceSpanIds: [],
        },
        goals: [
          {
            id: 'goal-grocery-checklist',
            text: 'Keep one current list before each shopping trip.',
            basis: 'suggested',
            sourceSpanIds: [],
          },
        ],
        problem: {
          statement: {
            id: 'problem-grocery-checklist',
            text: 'The household needs a shared grocery planning checklist.',
            basis: 'explicit',
            sourceSpanIds: ['span-grocery-checklist'],
          },
          type: 'coordination',
        },
        blockers: [
          {
            id: 'blocker-grocery-checklist',
            text: 'The preferred shared list is not identified.',
            basis: 'inferred',
            sourceSpanIds: [],
          },
        ],
        questions: [
          {
            id: 'question-grocery-checklist',
            text: 'Who updates the list before shopping?',
            basis: 'suggested',
            sourceSpanIds: [],
          },
        ],
        suggestedActions: [
          {
            id: 'action-grocery-checklist',
            text: 'Choose a shared list and add staple items.',
            basis: 'suggested',
            sourceSpanIds: [],
          },
        ],
        research: {
          needed: false,
          assessment: null,
          suggestedQueries: [],
          suggestedResourceTypes: [],
        },
        categoryId: 'category-family',
        categoryConfidence: 0.91,
        tags: ['groceries', 'household'],
        warnings: [],
      },
    ],
  },
  provider: 'openai',
  model: ORGANIZATION_MODEL,
  responseId: 'e2e-organize-response',
  promptVersion: 'organize-v1',
  schemaVersion: 'organization-v1',
} satisfies OrganizeProviderOutput;

const transcriptionConfig = {
  available: true,
  missing: [],
  model: TRANSCRIPTION_MODEL,
  maxBytes: 26_214_400,
  providerLabel: 'OpenAI-compatible transcription',
};

const organizationConfig = {
  available: true,
  missing: [],
  model: ORGANIZATION_MODEL,
  reasoningEffort: 'medium',
  maxInputChars: 24_000,
  providerLabel: 'OpenAI-compatible LLM extraction',
};

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function unavailableMethod(route: Route) {
  return route.continue();
}

export async function installSuccessfulProviderMocks(page: Page) {
  await page.route('**/api/transcribe', async (route) => {
    if (route.request().method() === 'GET') return fulfillJson(route, transcriptionConfig);
    if (route.request().method() === 'POST') return fulfillJson(route, providerMockTranscript);
    return unavailableMethod(route);
  });

  await page.route('**/api/extract', async (route) => {
    if (route.request().method() === 'GET') return fulfillJson(route, organizationConfig);
    return unavailableMethod(route);
  });

  await page.route('**/api/extract/segment', (route) => fulfillJson(route, segmentationResponse));
  await page.route('**/api/extract/organize', (route) => fulfillJson(route, organizationResponse));
}

export async function installFailOnceOrganizationMock(page: Page) {
  let failed = false;

  await page.route('**/api/extract/organize', async (route) => {
    if (!failed) {
      failed = true;
      return fulfillJson(route, {
        error: {
          code: 'provider_failed',
          message: 'Cloud organization failed. Please try again.',
        },
      }, 502);
    }

    return fulfillJson(route, organizationResponse);
  });
}
