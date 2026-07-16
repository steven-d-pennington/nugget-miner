import { afterEach, describe, expect, it, vi } from 'vitest';
import { db, resetClientDatabaseForTests } from '@/lib/db';
import { DEFAULT_CATEGORIES } from '@/lib/db/defaultCategories';
import { settingsRepository } from '@/lib/repositories';
import { DataManagementService } from './DataManagementService';

afterEach(async () => {
  vi.restoreAllMocks();
  await resetClientDatabaseForTests();
});

describe('DataManagementService', () => {
  it('clears every user-data table and reseeds only a fresh default shell', async () => {
    await db.captureSessions.add({ id: 'capture', source: 'text', processingState: 'saved', processingPreference: 'manual', processingAttempt: 0, durationMs: 0, createdAt: 1, updatedAt: 1 });
    await db.recordings.add({ id: 'recording', captureSessionId: 'capture', blob: new Blob(['a']), mimeType: 'audio/webm', sizeBytes: 1, durationMs: 1, waveformPreview: [], createdAt: 1 });
    await db.transcripts.add({ id: 'transcript', captureSessionId: 'capture', version: 1, text: 'private', provider: 'typed', source: 'typed', contentHash: 'hash', createdAt: 1, updatedAt: 1 });
    await db.extractionRuns.add({ id: 'run', captureSessionId: 'capture', transcriptId: 'transcript', transcriptHash: 'hash', provider: 'test', model: 'test', reasoningEffort: 'medium', segmentationPromptVersion: 'v1', organizationPromptVersion: 'v1', schemaVersion: 'v1', idempotencyKey: 'key', status: 'succeeded', stage: 'organizing', attempt: 1, rawJson: '{}', startedAt: 1 });
    await db.ideas.add({ id: 'idea', captureSessionId: 'capture', status: 'confirmed', title: 'Idea', summary: { id: 'summary', text: 'Summary', basis: 'inferred', sourceSpanIds: [] }, goals: [], blockers: [], questions: [], suggestedActions: [], research: { needed: false, suggestedQueries: [], suggestedResourceTypes: [] }, categoryId: 'custom', tagIds: ['tag'], sourceSpans: [], createdAt: 1, updatedAt: 1 });
    await db.categories.add({ id: 'custom', name: 'Custom', normalizedName: 'custom', description: 'A custom category with sufficient description.', isDefault: false, isFallback: false, sortOrder: 1, createdAt: 1, updatedAt: 1 });
    await db.tags.add({ id: 'tag', name: 'Tag', normalizedName: 'tag', createdAt: 1 });
    await db.nuggets.add({ id: 'nugget', captureSessionId: 'capture', extractionRunId: 'run', title: 'Legacy', category: 'idea', status: 'pending', createdAt: 1, updatedAt: 1 });
    await db.questions.add({ id: 'question', captureSessionId: 'capture', text: 'Legacy?', status: 'pending', createdAt: 1, updatedAt: 1 });
    await db.actionItems.add({ id: 'action', ideaId: 'idea', text: 'Act', status: 'open', createdAt: 1, updatedAt: 1 });
    await db.settings.put({ key: 'app', automaticProcessing: true, cloudProcessingConsent: 'granted', clientId: 'old-id', createdAt: 1, updatedAt: 1 });

    await DataManagementService.deleteAll();

    await expect(Promise.all([
      db.captureSessions.count(), db.recordings.count(), db.transcripts.count(), db.extractionRuns.count(), db.ideas.count(),
      db.tags.count(), db.nuggets.count(), db.questions.count(), db.actionItems.count(),
    ])).resolves.toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(await db.categories.toArray()).toHaveLength(DEFAULT_CATEGORIES.length);
    expect(await db.categories.toArray()).toEqual(expect.arrayContaining(DEFAULT_CATEGORIES.map((category) => expect.objectContaining({ id: category.id, name: category.name }))));
    const settings = await settingsRepository.get();
    expect(settings).toMatchObject({ automaticProcessing: false, cloudProcessingConsent: 'unknown' });
    expect(settings.clientId).not.toBe('old-id');
  });

  it('rolls back the clear transaction when one table fails', async () => {
    await db.captureSessions.add({ id: 'preserved', source: 'text', processingState: 'saved', processingPreference: 'manual', processingAttempt: 0, durationMs: 0, createdAt: 1, updatedAt: 1 });
    vi.spyOn(db.tags, 'clear').mockRejectedValueOnce(new Error('storage unavailable'));

    await expect(DataManagementService.deleteAll()).rejects.toThrow('storage unavailable');
    await expect(db.captureSessions.get('preserved')).resolves.toMatchObject({ id: 'preserved' });
  });
});
