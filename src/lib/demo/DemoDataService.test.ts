import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db, resetClientDatabaseForTests } from '@/lib/db';
import { DemoDataService } from './DemoDataService';

async function demoRows() {
  const [captures, transcripts, ideas, tags, actions] = await Promise.all([
    db.captureSessions.toArray(),
    db.transcripts.toArray(),
    db.ideas.toArray(),
    db.tags.toArray(),
    db.actionItems.toArray(),
  ]);
  return {
    captures: captures.filter((capture) => capture.id.startsWith('demo-')),
    transcripts: transcripts.filter((transcript) => transcript.id.startsWith('demo-')),
    ideas: ideas.filter((idea) => idea.id.startsWith('demo-')),
    tags: tags.filter((tag) => tag.id.startsWith('demo-')),
    actions: actions.filter((action) => action.id.startsWith('demo-')),
  };
}

describe('DemoDataService.seed', () => {
  beforeEach(async () => {
    await resetClientDatabaseForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds exactly three complete confirmed sample ideas and two actions only once', async () => {
    await expect(DemoDataService.seed()).resolves.toEqual({ created: true, captureId: 'demo-capture' });
    await expect(DemoDataService.seed()).resolves.toEqual({ created: false, captureId: 'demo-capture' });

    const rows = await demoRows();
    expect(rows.captures).toEqual([
      expect.objectContaining({
        id: 'demo-capture',
        source: 'audio',
        processingState: 'confirmed',
        transcriptId: 'demo-transcript',
      }),
    ]);
    expect(rows.captures[0]).not.toHaveProperty('recordingId');
    expect(rows.transcripts).toHaveLength(1);
    expect(rows.ideas).toHaveLength(3);
    expect(rows.actions).toHaveLength(2);
    expect(await db.recordings.where('captureSessionId').equals('demo-capture').count()).toBe(0);

    expect(rows.ideas.map((idea) => idea.categoryId).sort()).toEqual([
      'category-personal',
      'category-school',
      'category-work',
    ]);
    expect(rows.tags.map((tag) => tag.name).sort()).toEqual([
      'automation',
      'community',
      'handoff',
      'research',
      'sharing',
      'weekend project',
    ]);
    expect(rows.ideas.filter((idea) => idea.status === 'confirmed')).toHaveLength(3);
    expect(rows.ideas.filter((idea) => idea.blockers.length > 0)).toHaveLength(1);
    expect(rows.ideas.filter((idea) => idea.research.needed)).toHaveLength(1);

    const transcript = rows.transcripts[0]!;
    for (const idea of rows.ideas) {
      for (const span of idea.sourceSpans) {
        expect(transcript.text.slice(span.startChar, span.endChar)).toBe(span.quote);
      }
      for (const grounded of [
        idea.summary,
        idea.purpose,
        ...idea.goals,
        idea.problem?.statement,
        ...idea.blockers,
        ...idea.questions,
        ...idea.suggestedActions,
        idea.research.assessment,
      ].filter((value): value is NonNullable<typeof value> => Boolean(value))) {
        if (grounded.basis === 'explicit') {
          expect(grounded.sourceSpanIds.length).toBeGreaterThan(0);
          expect(grounded.sourceSpanIds.every((id) => idea.sourceSpans.some((span) => span.id === id))).toBe(true);
        }
      }
    }
  });

  it('preserves existing real data while adding the sample library', async () => {
    await db.captureSessions.add({
      id: 'capture-real',
      source: 'text',
      processingState: 'confirmed',
      processingPreference: 'manual',
      processingAttempt: 0,
      durationMs: 0,
      createdAt: 1,
      updatedAt: 1,
    });
    await db.ideas.add({
      id: 'idea-real',
      captureSessionId: 'capture-real',
      status: 'confirmed',
      title: 'Keep my real idea',
      summary: { id: 'real-summary', text: 'This existing idea stays intact.', basis: 'inferred', sourceSpanIds: [] },
      goals: [],
      blockers: [],
      questions: [],
      suggestedActions: [],
      research: { needed: false, suggestedQueries: [], suggestedResourceTypes: [] },
      categoryId: 'category-personal',
      tagIds: [],
      sourceSpans: [],
      createdAt: 1,
      updatedAt: 1,
      confirmedAt: 1,
    });

    await DemoDataService.seed();

    await expect(db.captureSessions.get('capture-real')).resolves.toEqual(expect.objectContaining({ id: 'capture-real' }));
    await expect(db.ideas.get('idea-real')).resolves.toEqual(expect.objectContaining({ title: 'Keep my real idea' }));
    expect(await db.ideas.count()).toBe(4);
  });

  it('reuses an existing normalized tag without changing the user tag row', async () => {
    const existingCommunity = {
      id: 'tag-user-community',
      name: 'Community',
      normalizedName: 'community',
      createdAt: 42,
    };
    await db.tags.add(existingCommunity);

    await expect(DemoDataService.seed()).resolves.toEqual({ created: true, captureId: 'demo-capture' });

    const rows = await demoRows();
    const toolSharingIdea = rows.ideas.find((idea) => idea.id === 'demo-idea-tool-sharing');
    const allTags = await db.tags.toArray();
    expect(await db.tags.get(existingCommunity.id)).toEqual(existingCommunity);
    expect(await db.tags.where('normalizedName').equals('community').count()).toBe(1);
    expect(new Set(allTags.map((tag) => tag.normalizedName)).size).toBe(allTags.length);
    expect(toolSharingIdea?.tagIds).toContain(existingCommunity.id);
    expect(toolSharingIdea?.tagIds).not.toContain('demo-tag-community');
    expect(rows.tags).toHaveLength(5);
    expect(rows.ideas).toHaveLength(3);
    expect(rows.actions).toHaveLength(2);
  });

  it('rolls back all sample rows when a seed write fails', async () => {
    const failure = new Error('sample ideas could not be written');
    vi.spyOn(db.ideas, 'bulkPut').mockRejectedValueOnce(failure);

    await expect(DemoDataService.seed()).rejects.toThrow(failure);

    const rows = await demoRows();
    expect(rows).toEqual({ captures: [], transcripts: [], ideas: [], tags: [], actions: [] });
  });
});
