import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, resetClientDatabaseForTests } from '@/lib/db';
import { DEFAULT_CATEGORY_IDS } from '@/lib/db/defaultCategories';
import { actionItemRepository } from '@/lib/repositories/actionItemRepository';
import { ideaRepository, type UpdateIdeaInput } from '@/lib/repositories/ideaRepository';
import { LibraryService } from './LibraryService';
import type { ActionItem, GroundedText, Idea, Tag } from '@/types';

const timestamp = 1_700_000_000_000;

function grounded(id: string, text: string): GroundedText {
  return { id, text, basis: 'inferred', sourceSpanIds: [] };
}

function idea(
  id: string,
  overrides: Partial<Idea> & Pick<Idea, 'title' | 'summary'>,
): Idea {
  return {
    id,
    captureSessionId: `capture-${id}`,
    extractionRunId: `run-${id}`,
    status: 'confirmed',
    goals: [],
    blockers: [],
    questions: [],
    suggestedActions: [],
    research: { needed: false, suggestedQueries: [], suggestedResourceTypes: [] },
    categoryId: DEFAULT_CATEGORY_IDS.misc,
    tagIds: [],
    sourceSpans: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    confirmedAt: timestamp,
    ...overrides,
  };
}

function action(id: string, ideaId: string, status: ActionItem['status']): ActionItem {
  return {
    id,
    ideaId,
    text: `Action ${id}`,
    status,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...(status === 'completed' ? { completedAt: timestamp } : {}),
  };
}

const tags: Tag[] = [
  { id: 'tag-community', name: 'Community', normalizedName: 'community', createdAt: timestamp },
  { id: 'tag-weekend', name: 'Weekend Project', normalizedName: 'weekend project', createdAt: timestamp + 1 },
  { id: 'tag-research', name: 'Research', normalizedName: 'research', createdAt: timestamp + 2 },
];

beforeEach(async () => {
  await db.tags.bulkPut(tags);
  await db.ideas.bulkPut([
    idea('title-match', {
      title: 'Neighborhood Tool Library',
      summary: grounded('summary-title', 'Share equipment with nearby households.'),
      categoryId: DEFAULT_CATEGORY_IDS.personal,
      tagIds: ['tag-community', 'tag-weekend'],
      blockers: [grounded('blocker-title', 'Need a storage location.')],
      research: {
        needed: true,
        assessment: grounded('research-title', 'Compare lending platforms.'),
        suggestedQueries: ['tool lending software'],
        suggestedResourceTypes: ['community case studies'],
      },
      updatedAt: timestamp + 30,
    }),
    idea('summary-match', {
      title: 'Better meeting notes',
      summary: grounded('summary-summary', 'Build a searchable archive for decisions.'),
      categoryId: DEFAULT_CATEGORY_IDS.work,
      tagIds: ['tag-research'],
      updatedAt: timestamp + 20,
    }),
    idea('tag-match', {
      title: 'Plan an activity',
      summary: grounded('summary-tag', 'Choose something relaxing to build.'),
      categoryId: DEFAULT_CATEGORY_IDS.personal,
      tagIds: ['tag-weekend'],
      updatedAt: timestamp + 10,
    }),
    idea('archived', {
      title: 'Archived neighborhood plan',
      summary: grounded('summary-archived', 'An old community plan.'),
      status: 'archived',
      categoryId: DEFAULT_CATEGORY_IDS.personal,
      tagIds: ['tag-community'],
      updatedAt: timestamp + 40,
    }),
    idea('draft', {
      title: 'Draft neighborhood plan',
      summary: grounded('summary-draft', 'Not confirmed yet.'),
      status: 'draft',
      updatedAt: timestamp + 50,
      confirmedAt: undefined,
    }),
  ]);
  await db.actionItems.bulkPut([
    action('open-1', 'title-match', 'open'),
    action('open-2', 'title-match', 'open'),
    action('done-1', 'title-match', 'completed'),
  ]);
});

afterEach(async () => {
  await resetClientDatabaseForTests();
});

describe('LibraryService.search', () => {
  it.each([
    ['title', 'neighborhood', ['title-match']],
    ['summary', 'searchable archive', ['summary-match']],
    ['tag', 'weekend project', ['title-match', 'tag-match']],
  ])('matches normalized %s text', async (_field, query, expectedIds) => {
    const rows = await LibraryService.search({ query });

    expect(rows.map((row) => row.idea.id)).toEqual(expectedIds);
  });

  it('normalizes case and extra spaces and applies AND behavior across query terms', async () => {
    await db.ideas.add(
      idea('one-term-only', {
        title: 'Neighborhood garden notes',
        summary: grounded('summary-one-term', 'A local planting plan.'),
        categoryId: DEFAULT_CATEGORY_IDS.personal,
        updatedAt: timestamp + 35,
      }),
    );

    const rows = await LibraryService.search({ query: '  NEIGHBORHOOD    community  ' });

    expect(rows.map((row) => row.idea.id)).toEqual(['title-match']);
  });

  it('combines category and all-selected-tag filters', async () => {
    await db.ideas.add(
      idea('same-tags-other-category', {
        title: 'Office equipment exchange',
        summary: grounded('summary-other-category', 'Share equipment with coworkers.'),
        categoryId: DEFAULT_CATEGORY_IDS.work,
        tagIds: ['tag-community', 'tag-weekend'],
        updatedAt: timestamp + 35,
      }),
    );

    const rows = await LibraryService.search({
      categoryId: DEFAULT_CATEGORY_IDS.personal,
      tagIds: ['tag-community', 'tag-weekend'],
    });

    expect(rows.map((row) => row.idea.id)).toEqual(['title-match']);
  });

  it('shows active ideas by default and supports an archived-only view', async () => {
    await expect(LibraryService.search()).resolves.toSatisfy((rows: Awaited<ReturnType<typeof LibraryService.search>>) =>
      rows.every((row) => row.idea.status === 'confirmed'),
    );

    const rows = await LibraryService.search({ status: 'archived' });
    expect(rows.map((row) => row.idea.id)).toEqual(['archived']);
  });

  it('enriches rows with category, tags, blocker, research, and open-action indicators', async () => {
    const [row] = await LibraryService.search({ query: 'tool library' });

    expect(row).toMatchObject({
      category: { id: DEFAULT_CATEGORY_IDS.personal, name: 'Personal' },
      tags: [{ id: 'tag-community' }, { id: 'tag-weekend' }],
      openActionCount: 2,
      hasBlockers: true,
      needsResearch: true,
    });
  });
});

describe('library editing repositories', () => {
  function updateInput(original: Idea): UpdateIdeaInput {
    return {
      title: 'Updated tool library',
      summary: grounded('updated-summary', 'Updated summary.'),
      goals: [],
      blockers: [],
      questions: [],
      suggestedActions: [],
      research: original.research,
      categoryId: DEFAULT_CATEGORY_IDS.work,
      tagIds: ['tag-community'],
      status: 'archived',
    };
  }

  it('updates only editable idea fields while preserving provenance and confirmation timestamps', async () => {
    const original = (await ideaRepository.getById('title-match'))!;
    const input = updateInput(original);

    const updated = await ideaRepository.update(original.id, input);

    expect(updated).toMatchObject({
      id: original.id,
      captureSessionId: original.captureSessionId,
      extractionRunId: original.extractionRunId,
      sourceSpans: original.sourceSpans,
      createdAt: original.createdAt,
      confirmedAt: original.confirmedAt,
      title: input.title,
      status: 'archived',
    });
    expect(updated.updatedAt).toBeGreaterThan(original.updatedAt);
  });

  it('rejects updates to draft ideas and leaves the draft unchanged', async () => {
    const original = (await ideaRepository.getById('draft'))!;

    await expect(ideaRepository.update(original.id, updateInput(original))).rejects.toThrow(
      'Only confirmed or archived ideas may be updated.',
    );

    await expect(ideaRepository.getById(original.id)).resolves.toEqual(original);
  });

  it('rejects archive and restore attempts for drafts and leaves the draft unchanged', async () => {
    const original = (await ideaRepository.getById('draft'))!;

    await expect(ideaRepository.setArchived(original.id, true)).rejects.toThrow(
      'Only confirmed or archived ideas may be archived or restored.',
    );
    await expect(ideaRepository.setArchived(original.id, false)).rejects.toThrow(
      'Only confirmed or archived ideas may be archived or restored.',
    );

    await expect(ideaRepository.getById(original.id)).resolves.toEqual(original);
  });

  it('accepts grounded explicit edits and rejects invalid explicit source references', async () => {
    const original = (await ideaRepository.getById('title-match'))!;
    const withEvidence: Idea = {
      ...original,
      sourceSpans: [{ id: 'source-1', startChar: 0, endChar: 19, quote: 'Neighborhood library' }],
    };
    await db.ideas.put(withEvidence);

    const valid = await ideaRepository.update(withEvidence.id, {
      ...updateInput(withEvidence),
      status: 'confirmed',
      summary: {
        id: 'explicit-summary',
        text: 'Neighborhood library',
        basis: 'explicit',
        sourceSpanIds: ['source-1'],
      },
    });
    expect(valid.summary).toMatchObject({ basis: 'explicit', sourceSpanIds: ['source-1'] });

    await expect(
      ideaRepository.update(withEvidence.id, {
        ...updateInput(valid),
        status: 'confirmed',
        summary: {
          id: 'invalid-explicit-summary',
          text: 'Unsupported statement',
          basis: 'explicit',
          sourceSpanIds: ['missing-source'],
        },
      }),
    ).rejects.toThrow('Explicit content references invalid source evidence.');
    await expect(ideaRepository.getById(withEvidence.id)).resolves.toEqual(valid);
  });

  it('archives and restores ideas and optionally includes archived library records', async () => {
    await ideaRepository.setArchived('title-match', true);
    expect((await ideaRepository.listConfirmed()).map((item) => item.id)).not.toContain('title-match');
    expect((await ideaRepository.listConfirmed(true)).map((item) => item.id)).toEqual(
      expect.arrayContaining(['title-match', 'archived']),
    );

    await ideaRepository.setArchived('title-match', false);
    await expect(ideaRepository.getById('title-match')).resolves.toMatchObject({ status: 'confirmed' });
  });

  it('queries, completes, reopens, and removes actions canonically', async () => {
    await expect(actionItemRepository.getById('open-1')).resolves.toMatchObject({ ideaId: 'title-match' });
    await expect(actionItemRepository.listByIdea('title-match')).resolves.toHaveLength(3);
    await expect(actionItemRepository.listByStatus('open')).resolves.toHaveLength(2);

    await actionItemRepository.setStatus('open-1', 'completed');
    await expect(actionItemRepository.getById('open-1')).resolves.toMatchObject({
      status: 'completed',
      completedAt: expect.any(Number),
    });

    await actionItemRepository.setStatus('open-1', 'open');
    const reopened = await actionItemRepository.getById('open-1');
    expect(reopened?.status).toBe('open');
    expect(reopened).not.toHaveProperty('completedAt');

    await actionItemRepository.remove('open-1');
    await expect(actionItemRepository.getById('open-1')).resolves.toBeUndefined();
  });
});
