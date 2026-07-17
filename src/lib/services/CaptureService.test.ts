import { afterEach, describe, expect, it, vi } from 'vitest';
import { db, resetClientDatabaseForTests } from '@/lib/db';
import type { RecordingDraft } from '@/types';
import { CaptureService } from './CaptureService';

const draft: RecordingDraft = {
  blob: new Blob(['audio'], { type: 'audio/webm' }),
  mimeType: 'audio/webm',
  durationMs: 1_200,
  sizeBytes: 5,
  waveformPreview: [0.1],
};

afterEach(async () => {
  vi.restoreAllMocks();
  await resetClientDatabaseForTests();
});

describe('CaptureService', () => {
  it('rolls back the capture when recording persistence fails', async () => {
    vi.spyOn(db.recordings, 'add').mockRejectedValueOnce(new DOMException('Storage quota exceeded.', 'QuotaExceededError'));

    await expect(CaptureService.saveRecording({ draft, processingPreference: 'automatic' })).rejects.toThrow();

    expect(await db.captureSessions.count()).toBe(0);
    expect(await db.recordings.count()).toBe(0);
  });

  it('returns an automatic audio capture in queued state without provider work', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const result = await CaptureService.saveRecording({ draft, processingPreference: 'automatic' });

    expect(result.capture).toMatchObject({ source: 'audio', processingState: 'queued' });
    expect(result.recording).toMatchObject({ captureSessionId: result.capture.id });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('stores trimmed typed text and capture metadata in one durable result', async () => {
    const result = await CaptureService.saveText({
      text: '  Plan a neighborhood tool-sharing library.  ',
      processingPreference: 'manual',
    });

    expect(result.capture).toMatchObject({ source: 'text', processingState: 'transcript_ready', durationMs: 0 });
    expect(result.transcript).toMatchObject({
      captureSessionId: result.capture.id,
      version: 1,
      text: 'Plan a neighborhood tool-sharing library.',
      provider: 'typed',
      source: 'typed',
    });
    await expect(db.captureSessions.get(result.capture.id)).resolves.toMatchObject({ transcriptId: result.transcript?.id });
  });

  it('rolls back a typed capture when transcript persistence fails', async () => {
    vi.spyOn(db.transcripts, 'add').mockRejectedValueOnce(new DOMException('Storage quota exceeded.', 'QuotaExceededError'));

    await expect(
      CaptureService.saveText({
        text: 'Keep the capture and transcript transaction atomic.',
        processingPreference: 'automatic',
      }),
    ).rejects.toThrow();

    expect(await db.captureSessions.count()).toBe(0);
    expect(await db.transcripts.count()).toBe(0);
  });

  it('rejects typed captures with fewer than three non-whitespace characters', async () => {
    await expect(CaptureService.saveText({ text: ' a  b ', processingPreference: 'manual' })).rejects.toThrow(
      'Enter at least three non-whitespace characters.',
    );
    await expect(db.captureSessions.count()).resolves.toBe(0);
    await expect(db.transcripts.count()).resolves.toBe(0);
  });
});
