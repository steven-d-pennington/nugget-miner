import { afterEach, describe, expect, it, vi } from 'vitest';
import { Blob as NodeBlob } from 'node:buffer';
import { db, resetClientDatabaseForTests } from '@/lib/db';
import { buildFullExport } from './fullExport';

afterEach(async () => {
  vi.restoreAllMocks();
  await resetClientDatabaseForTests();
});

describe('buildFullExport', () => {
  it('exports stable local data, round-trips recording bytes, and excludes private settings', async () => {
    await db.captureSessions.add({
      id: 'capture-1', source: 'audio', recordingId: 'recording-1', processingState: 'saved',
      processingPreference: 'manual', processingAttempt: 0, durationMs: 1000, createdAt: 1, updatedAt: 1,
    });
    const originalBytes = new Uint8Array([0, 1, 2, 127, 128, 255]);
    await db.recordings.add({
      id: 'recording-1', captureSessionId: 'capture-1', blob: new NodeBlob([originalBytes], { type: 'audio/webm' }) as Blob,
      mimeType: 'audio/webm', sizeBytes: originalBytes.length, durationMs: 1000, waveformPreview: [0.1], createdAt: 1,
    });
    await db.settings.put({
      key: 'app', automaticProcessing: true, cloudProcessingConsent: 'granted', clientId: 'private-client-id',
      createdAt: 1, updatedAt: 2,
    });

    const result = await buildFullExport(new Date('2026-07-16T12:00:00.000Z'));
    const decoded = Uint8Array.from(atob(result.recordings[0]!.base64), (character) => character.charCodeAt(0));

    expect(result).toMatchObject({
      schemaVersion: 'nugget-full-export-v1',
      exportedAt: '2026-07-16T12:00:00.000Z',
      settings: { automaticProcessing: true, cloudProcessingConsent: 'granted' },
    });
    expect(decoded).toEqual(originalBytes);
    expect(result.recordings[0]).not.toHaveProperty('blob');
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('private-client-id');
    expect(serialized).not.toContain('clientId');
    expect(serialized).not.toContain('objectURL');
  });

  it('does not make a network request', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await buildFullExport(new Date(0));
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
