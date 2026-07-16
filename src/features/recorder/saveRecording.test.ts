import { afterEach, describe, expect, it } from 'vitest';
import { db, resetClientDatabaseForTests } from '@/lib/db';
import type { RecordingDraft } from '@/types';
import { saveRecording } from './saveRecording';

const draft: RecordingDraft = {
  blob: new Blob(['audio'], { type: 'audio/webm' }),
  mimeType: 'audio/webm',
  durationMs: 1_200,
  sizeBytes: 5,
  waveformPreview: [0.1],
};

afterEach(async () => {
  await resetClientDatabaseForTests();
});

describe('saveRecording compatibility adapter', () => {
  it('delegates to atomic local persistence without transcribing', async () => {
    const result = await saveRecording({ draft, processingPreference: 'automatic' });

    expect(result.capture).toMatchObject({ source: 'audio', processingState: 'queued' });
    expect(result.recording).toMatchObject({ captureSessionId: result.capture.id });
    expect(result.transcript).toBeUndefined();
    await expect(db.captureSessions.count()).resolves.toBe(1);
    await expect(db.recordings.count()).resolves.toBe(1);
    await expect(db.transcripts.count()).resolves.toBe(0);
  });
});
