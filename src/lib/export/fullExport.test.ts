import { afterEach, describe, expect, it, vi } from 'vitest';
import { Blob as NodeBlob } from 'node:buffer';
import { db, resetClientDatabaseForTests } from '@/lib/db';
import type { AppSettings } from '@/types';
import { buildFullExport } from './fullExport';

afterEach(async () => {
  vi.restoreAllMocks();
  await resetClientDatabaseForTests();
});

describe('buildFullExport', () => {
  it('exports stable local data, round-trips recording bytes, and excludes private settings', async () => {
    await db.captureSessions.bulkAdd([
      { id: 'z-capture', source: 'text', processingState: 'saved', processingPreference: 'manual', processingAttempt: 0, durationMs: 0, createdAt: 2, updatedAt: 2 },
      { id: 'a-capture', source: 'audio', recordingId: 'recording-1', transcriptId: 'transcript-1', processingState: 'ready_for_review', processingPreference: 'manual', processingAttempt: 1, durationMs: 1000, createdAt: 1, updatedAt: 1 },
    ]);
    const originalBytes = new Uint8Array([0, 1, 2, 127, 128, 255]);
    await db.recordings.add({
      id: 'recording-1', captureSessionId: 'a-capture', blob: new NodeBlob([originalBytes], { type: 'audio/webm' }) as Blob,
      mimeType: 'audio/webm', sizeBytes: originalBytes.length, durationMs: 1000, waveformPreview: [0.1], createdAt: 1,
    });
    await db.transcripts.add({ id: 'transcript-1', captureSessionId: 'a-capture', version: 1, text: 'Build a useful exporter.', provider: 'typed', source: 'typed', contentHash: 'hash-1', createdAt: 1, updatedAt: 1 });
    await db.extractionRuns.add({ id: 'run-1', captureSessionId: 'a-capture', transcriptId: 'transcript-1', transcriptHash: 'hash-1', provider: 'test', model: 'gpt-test', reasoningEffort: 'medium', segmentationPromptVersion: 'segment-v1', organizationPromptVersion: 'organize-v1', schemaVersion: 'organization-v1', idempotencyKey: 'export-fixture', status: 'succeeded', stage: 'organizing', attempt: 1, rawJson: '{"ideas":[]}', startedAt: 1, completedAt: 2 });
    await db.categories.put({ id: 'category-custom', name: 'Custom', normalizedName: 'custom', description: 'Custom export fixture category with clear boundaries.', isDefault: false, isFallback: false, sortOrder: 60, createdAt: 1, updatedAt: 1 });
    await db.tags.add({ id: 'tag-1', name: 'Export', normalizedName: 'export', createdAt: 1 });
    await db.ideas.add({ id: 'idea-1', captureSessionId: 'a-capture', extractionRunId: 'run-1', status: 'confirmed', title: 'Export everything', summary: { id: 'summary-1', text: 'Build a useful exporter.', basis: 'explicit', sourceSpanIds: ['span-1'] }, goals: [], blockers: [], questions: [], suggestedActions: [], research: { needed: false, suggestedQueries: [], suggestedResourceTypes: [] }, categoryId: 'category-custom', tagIds: ['tag-1'], sourceSpans: [{ id: 'span-1', startChar: 0, endChar: 24, quote: 'Build a useful exporter.' }], createdAt: 1, updatedAt: 1, confirmedAt: 2 });
    await db.actionItems.add({ id: 'action-1', ideaId: 'idea-1', text: 'Verify the export', status: 'open', createdAt: 1, updatedAt: 1 });
    await db.settings.put({
      key: 'app', automaticProcessing: true, cloudProcessingConsent: 'granted', clientId: 'private-client-id',
      createdAt: 1, updatedAt: 2,
      apiKey: 'private-api-key', objectURL: 'blob:https://example.test/private',
      browserPath: 'C:\\private\\browser', internalPath: '/var/private/internal',
    } as AppSettings);

    const result = await buildFullExport(new Date('2026-07-16T12:00:00.000Z'));
    const decoded = Uint8Array.from(atob(result.recordings[0]!.base64), (character) => character.charCodeAt(0));

    expect(result).toMatchObject({
      schemaVersion: 'nugget-full-export-v1',
      exportedAt: '2026-07-16T12:00:00.000Z',
      settings: { automaticProcessing: true, cloudProcessingConsent: 'granted' },
    });
    expect(Object.keys(result).sort()).toEqual([
      'actions', 'captures', 'categories', 'exportedAt', 'extractionRuns', 'ideas', 'recordings',
      'schemaVersion', 'settings', 'tags', 'transcripts',
    ]);
    expect(Object.keys(result.settings).sort()).toEqual(['automaticProcessing', 'cloudProcessingConsent']);
    expect(result.captures.map(({ id }) => id)).toEqual(['a-capture', 'z-capture']);
    expect(result.transcripts).toHaveLength(1);
    expect(result.extractionRuns).toHaveLength(1);
    expect(result.ideas).toHaveLength(1);
    expect(result.categories.length).toBeGreaterThanOrEqual(1);
    expect(result.tags).toHaveLength(1);
    expect(result.actions).toHaveLength(1);
    for (const rows of [result.captures, result.recordings, result.transcripts, result.extractionRuns, result.ideas, result.categories, result.tags, result.actions]) {
      const ids = rows.map(({ id }) => id);
      expect(ids).toEqual([...ids].sort((left, right) => left < right ? -1 : left > right ? 1 : 0));
    }
    expect(decoded).toEqual(originalBytes);
    expect(result.recordings[0]).not.toHaveProperty('blob');
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('private-client-id');
    expect(serialized).not.toContain('private-api-key');
    expect(serialized).not.toContain('blob:https://example.test/private');
    expect(serialized).not.toContain('C:\\\\private\\\\browser');
    expect(serialized).not.toContain('/var/private/internal');
    expect(serialized).not.toContain('clientId');
    expect(serialized).not.toContain('apiKey');
    expect(serialized).not.toContain('objectURL');
    expect(serialized).not.toContain('browserPath');
    expect(serialized).not.toContain('internalPath');
  });

  it('does not make a network request', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await buildFullExport(new Date(0));
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
