import { describe, expect, it } from 'vitest';
import { mockTranscriptionProvider } from './mockProvider';
import type { Recording } from '@/types';

describe('mockTranscriptionProvider', () => {
  it('returns deterministic local-only transcript text', async () => {
    const recording: Recording = {
      id: 'recording-1',
      captureSessionId: 'idea-1',
      blob: new Blob(['audio'], { type: 'audio/webm' }),
      mimeType: 'audio/webm',
      sizeBytes: 5,
      durationMs: 61_000,
      waveformPreview: [0.1],
      createdAt: 1,
    };

    const result = await mockTranscriptionProvider.transcribe({
      captureSessionId: 'capture-1',
      recordingId: recording.id,
      audioBlob: recording.blob,
      recording,
    });

    expect(result.provider).toBe('mock');
    expect(result.text).toContain('Mock transcript');
    expect(result.text).toContain('1:01');
    expect(result.confidence).toBe(1);
  });
});
