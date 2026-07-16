import { afterEach, describe, expect, it } from 'vitest';
import { db, resetClientDatabaseForTests } from '@/lib/db';
import { DEFAULT_CATEGORY_IDS } from '@/lib/db/defaultCategories';
import { categoryRepository, settingsRepository, tagRepository } from '@/lib/repositories';
import type { Idea } from '@/types';

afterEach(async () => {
  await resetClientDatabaseForTests();
});

describe('categoryRepository', () => {
  it('seeds ordered classifier-ready defaults without overwriting edits', async () => {
    await db.categories.delete(DEFAULT_CATEGORY_IDS.school);
    const defaults = await categoryRepository.ensureDefaults();

    expect(defaults.map((item) => item.name)).toEqual(['Work', 'School', 'Personal', 'Family', 'Misc']);
    expect(defaults.every((item) => item.description.length >= 20)).toBe(true);
    expect(defaults.every((item) => item.createdAt > 0 && item.updatedAt > 0)).toBe(true);
    expect(defaults.find((item) => item.id === DEFAULT_CATEGORY_IDS.misc)).toMatchObject({ isFallback: true });

    const customDescription = 'Professional work with examples and boundaries customized by the user.';
    await categoryRepository.update(DEFAULT_CATEGORY_IDS.work, { description: customDescription });
    await categoryRepository.ensureDefaults();

    await expect(db.categories.get(DEFAULT_CATEGORY_IDS.work)).resolves.toMatchObject({ description: customDescription });
  });

  it('rejects duplicate normalized names and fallback deletion', async () => {
    await categoryRepository.ensureDefaults();

    await expect(
      categoryRepository.create({ name: 'work', description: 'A duplicate professional category description.' }),
    ).rejects.toThrow();
    await expect(
      categoryRepository.removeAndReassign(DEFAULT_CATEGORY_IDS.misc, DEFAULT_CATEGORY_IDS.personal),
    ).rejects.toThrow();
  });

  it('reassigns matching ideas transactionally before deleting a custom category', async () => {
    await categoryRepository.ensureDefaults();
    const custom = await categoryRepository.create({
      name: 'Community',
      description: 'Neighborhood projects, mutual aid, volunteering, and shared local resources.',
    });
    const timestamp = Date.now();
    const idea: Idea = {
      id: 'community-idea',
      captureSessionId: 'capture-1',
      status: 'draft',
      title: 'Tool sharing library',
      summary: { id: 'summary-1', text: 'Share tools nearby.', basis: 'inferred', sourceSpanIds: [] },
      goals: [],
      blockers: [],
      questions: [],
      suggestedActions: [],
      research: { needed: false, suggestedQueries: [], suggestedResourceTypes: [] },
      categoryId: custom.id,
      tagIds: [],
      sourceSpans: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await db.ideas.add(idea);

    await categoryRepository.removeAndReassign(custom.id, DEFAULT_CATEGORY_IDS.misc);

    await expect(db.ideas.get(idea.id)).resolves.toMatchObject({ categoryId: DEFAULT_CATEGORY_IDS.misc });
    await expect(db.categories.get(custom.id)).resolves.toBeUndefined();
  });

  it('counts every idea affected by category reassignment regardless of status', async () => {
    await categoryRepository.ensureDefaults();
    const timestamp = Date.now();
    const baseIdea: Idea = {
      id: 'idea-draft',
      captureSessionId: 'capture-1',
      status: 'draft',
      title: 'Draft idea',
      summary: { id: 'summary-draft', text: 'A draft idea.', basis: 'inferred', sourceSpanIds: [] },
      goals: [],
      blockers: [],
      questions: [],
      suggestedActions: [],
      research: { needed: false, suggestedQueries: [], suggestedResourceTypes: [] },
      categoryId: DEFAULT_CATEGORY_IDS.personal,
      tagIds: [],
      sourceSpans: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await db.ideas.bulkAdd([
      baseIdea,
      { ...baseIdea, id: 'idea-confirmed', status: 'confirmed', title: 'Confirmed idea' },
      { ...baseIdea, id: 'idea-archived', status: 'archived', title: 'Archived idea' },
      { ...baseIdea, id: 'idea-work', categoryId: DEFAULT_CATEGORY_IDS.work, title: 'Work idea' },
    ]);

    const counts = await categoryRepository.countIdeasByCategory();

    expect(counts.get(DEFAULT_CATEGORY_IDS.personal)).toBe(3);
    expect(counts.get(DEFAULT_CATEGORY_IDS.work)).toBe(1);
    expect(counts.get(DEFAULT_CATEGORY_IDS.misc)).toBeUndefined();
  });
});

describe('tagRepository', () => {
  it('normalizes, deduplicates, preserves first spelling, and limits a call to six tags', async () => {
    const tags = await tagRepository.findOrCreate([
      ' Community ',
      'community',
      'Weekend   Project',
      'Sharing',
      'Tools',
      'Neighbors',
      'Survey',
      'Ignored seventh unique tag',
    ]);

    expect(tags).toHaveLength(6);
    expect(tags[0]).toMatchObject({ name: 'Community', normalizedName: 'community' });
    expect(tags[1]).toMatchObject({ name: 'Weekend Project', normalizedName: 'weekend project' });
    await expect(tagRepository.findOrCreate(['COMMUNITY'])).resolves.toEqual([expect.objectContaining({ id: tags[0]?.id })]);
  });
});

describe('settingsRepository', () => {
  it('creates one stable client id and persists processing preferences', async () => {
    const first = await settingsRepository.get();
    const second = await settingsRepository.get();

    expect(first.clientId).toBe(second.clientId);
    expect(first).toMatchObject({ automaticProcessing: false, cloudProcessingConsent: 'unknown' });

    await expect(
      settingsRepository.update({ automaticProcessing: true, cloudProcessingConsent: 'granted' }),
    ).resolves.toMatchObject({ clientId: first.clientId, automaticProcessing: true, cloudProcessingConsent: 'granted' });
  });
});
