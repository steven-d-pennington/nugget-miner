import { afterEach, describe, expect, it, vi } from 'vitest';
import { db, resetClientDatabaseForTests } from '@/lib/db';
import type { RecordingDraft, TranscriptResult } from '@/types';
import { saveRecording } from './saveRecording';

const draft: RecordingDraft = {
  blob: new Blob(['audio'], { type: 'audio/webm' }),
  mimeType: 'audio/webm',
  durationMs: 1200,
  sizeBytes: 5,
  waveformPreview: [0.1],
};

afterEach(async () => {
  await resetClientDatabaseForTests();
});

describe('saveRecording', () => {
  it('keeps the existing mock transcription path', async () => {
    const result = await saveRecording({ draft, transcriptionMode: 'mock' });

    expect(result.transcript?.provider).toBe('mock');
    await expect(db.transcripts.count()).resolves.toBe(1);
  });

  it('persists cloud provider transcript results and marks the idea transcribed', async () => {
    const transcriptResult: TranscriptResult = {
      text: 'Real provider transcript',
      provider: 'cloud',
      model: 'whisper-test',
      language: 'en',
    };
    const cloudProvider = {
      id: 'cloud',
      label: 'Cloud transcription',
      mode: 'cloud' as const,
      isAvailable: vi.fn(async () => true),
      transcribe: vi.fn(async () => transcriptResult),
    };

    const result = await saveRecording({ draft, transcriptionMode: 'cloud', cloudProvider });

    expect(cloudProvider.transcribe).toHaveBeenCalledWith(
      expect.objectContaining({ ideaId: result.idea.id, recordingId: result.recording.id, audioBlob: draft.blob }),
    );
    expect(result.idea.status).toBe('transcribed');
    expect(result.transcript).toMatchObject({ text: 'Real provider transcript', provider: 'cloud', model: 'whisper-test' });
  });
});
