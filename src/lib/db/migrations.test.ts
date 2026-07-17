// @vitest-environment node

import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { NuggetDatabase } from './index';

const databaseNames = new Set<string>();

afterEach(async () => {
  for (const name of databaseNames) {
    await Dexie.delete(name);
  }
  databaseNames.clear();
});

describe('Dexie version 2 to version 3 migration', () => {
  it('seeds a fresh database with timestamped ordered defaults and one fallback', async () => {
    const databaseName = `nugget-fresh-${crypto.randomUUID()}`;
    databaseNames.add(databaseName);
    const fresh = new NuggetDatabase(databaseName);

    await fresh.open();
    const categories = await fresh.categories.orderBy('sortOrder').toArray();

    expect(categories.map((category) => category.name)).toEqual(['Work', 'School', 'Personal', 'Family', 'Misc']);
    expect(categories).toHaveLength(5);
    expect(categories.filter((category) => category.isFallback)).toEqual([
      expect.objectContaining({ id: 'category-misc', name: 'Misc', isDefault: true }),
    ]);
    expect(categories.every((category) => category.createdAt > 0 && category.updatedAt > 0)).toBe(true);

    fresh.close();
  });

  it('preserves capture media, transcript, raw extraction output, and accepted actions', async () => {
    const databaseName = `nugget-migration-${crypto.randomUUID()}`;
    const legacyId = 'legacy-capture';
    const recordingId = 'legacy-recording';
    const transcriptId = 'legacy-transcript';
    const runId = 'legacy-run';
    const nuggetId = 'legacy-nugget';
    const questionId = 'legacy-question';
    const actionId = 'legacy-action';
    const rawJson = JSON.stringify({
      summary: 'Preserved legacy summary',
      nuggets: [{ title: 'Keep the original output' }],
    });
    databaseNames.add(databaseName);

    const legacy = new Dexie(databaseName);
    legacy.version(1).stores({
      ideas: '&id, createdAt, status, projectId, favorite, archived, *tags',
      recordings: '&id, ideaId',
      transcripts: '&id, ideaId',
    });
    legacy.version(2).stores({
      ideas: '&id, createdAt, status, projectId, favorite, archived, *tags',
      recordings: '&id, ideaId',
      transcripts: '&id, ideaId',
      extractionRuns: '&id, ideaId, transcriptId, createdAt',
      nuggets: '&id, ideaId, extractionRunId, status',
      questions: '&id, ideaId, extractionRunId, status',
      actionItems: '&id, ideaId, extractionRunId, status, priority, dueDate, *tags',
    });
    await legacy.open();

    const timestamp = 1_720_000_000_000;
    await legacy.transaction(
      'rw',
      [
        legacy.table('ideas'),
        legacy.table('recordings'),
        legacy.table('transcripts'),
        legacy.table('extractionRuns'),
        legacy.table('nuggets'),
        legacy.table('questions'),
        legacy.table('actionItems'),
      ],
      async () => {
        await legacy.table('ideas').add({
          id: legacyId,
          title: 'Legacy captured thought',
          status: 'reviewed',
          sourceType: 'recording',
          tags: ['legacy'],
          favorite: true,
          archived: false,
          durationMs: 12_345,
          actionCount: 1,
          createdAt: timestamp,
          updatedAt: timestamp + 100,
        });
        await legacy.table('recordings').add({
          id: recordingId,
          ideaId: legacyId,
          blob: new Blob(['legacy-audio'], { type: 'audio/webm' }),
          mimeType: 'audio/webm',
          sizeBytes: 12,
          durationMs: 12_345,
          waveformPreview: [0.1, 0.4],
          createdAt: timestamp,
        });
        await legacy.table('transcripts').add({
          id: transcriptId,
          ideaId: legacyId,
          text: 'The original transcript stays available.',
          provider: 'mock',
          edited: false,
          createdAt: timestamp + 10,
          updatedAt: timestamp + 10,
        });
        await legacy.table('extractionRuns').add({
          id: runId,
          ideaId: legacyId,
          transcriptId,
          provider: 'mock',
          preset: 'general-thought',
          promptVersion: 'extract-general-thought-v1',
          schemaVersion: '1',
          status: 'complete',
          rawJson,
          summary: 'Preserved legacy summary',
          warnings: [],
          createdAt: timestamp + 20,
        });
        await legacy.table('nuggets').add({
          id: nuggetId,
          ideaId: legacyId,
          extractionRunId: runId,
          title: 'Preserve the linked legacy nugget',
          detail: 'Migration must retain its capture and extraction provenance.',
          category: 'idea',
          confidence: 0.9,
          sourceSpan: { start: 0, end: 12 },
          status: 'accepted',
          createdAt: timestamp + 25,
          updatedAt: timestamp + 25,
        });
        await legacy.table('questions').add({
          id: questionId,
          ideaId: legacyId,
          extractionRunId: runId,
          text: 'Does the question keep its original extraction link?',
          status: 'pending',
          sourceSpan: { start: 13, end: 24 },
          createdAt: timestamp + 26,
          updatedAt: timestamp + 26,
        });
        await legacy.table('actionItems').add({
          id: actionId,
          ideaId: legacyId,
          extractionRunId: runId,
          title: 'Follow up on the legacy idea',
          status: 'open',
          priority: 'medium',
          tags: [],
          createdAt: timestamp + 30,
          updatedAt: timestamp + 30,
        });
      },
    );
    legacy.close();

    const upgraded = new NuggetDatabase(databaseName);
    await upgraded.open();

    expect(await upgraded.captureSessions.get(legacyId)).toMatchObject({
      id: legacyId,
      source: 'audio',
      processingState: 'ready_for_review',
    });
    const migratedRecording = await upgraded.recordings.where('captureSessionId').equals(legacyId).first();
    expect(migratedRecording).toMatchObject({
      id: recordingId,
      mimeType: 'audio/webm',
      sizeBytes: 12,
      durationMs: 12_345,
    });
    expect(migratedRecording).toBeDefined();
    expect(await migratedRecording!.blob.text()).toBe('legacy-audio');
    const migratedTranscript = await upgraded.transcripts.where('captureSessionId').equals(legacyId).first();
    expect(migratedTranscript).toMatchObject({
      id: transcriptId,
      text: 'The original transcript stays available.',
      version: 1,
      source: 'transcription',
    });
    expect(await upgraded.ideas.get(legacyId)).toMatchObject({
      captureSessionId: legacyId,
      categoryId: 'category-misc',
      summary: { text: 'Preserved legacy summary', basis: 'inferred', sourceSpanIds: [] },
    });
    expect(await upgraded.actionItems.get(actionId)).toMatchObject({
      ideaId: legacyId,
      text: 'Follow up on the legacy idea',
      status: 'open',
    });
    expect(await upgraded.nuggets.get(nuggetId)).toMatchObject({
      captureSessionId: legacyId,
      extractionRunId: runId,
      title: 'Preserve the linked legacy nugget',
      status: 'accepted',
      sourceSpan: { start: 0, end: 12 },
    });
    expect(await upgraded.questions.get(questionId)).toMatchObject({
      captureSessionId: legacyId,
      extractionRunId: runId,
      text: 'Does the question keep its original extraction link?',
      status: 'pending',
      sourceSpan: { start: 13, end: 24 },
    });
    expect(await upgraded.categories.count()).toBe(5);
    expect((await upgraded.extractionRuns.get(runId))?.rawJson).toBe(rawJson);
    expect(await upgraded.extractionRuns.get(runId)).toMatchObject({
      captureSessionId: legacyId,
      transcriptId,
      status: 'succeeded',
      idempotencyKey: `legacy:${runId}`,
    });

    upgraded.close();
  });
});
