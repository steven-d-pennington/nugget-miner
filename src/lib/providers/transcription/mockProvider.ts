import type { Recording, TranscriptResult } from '@/types';
import type { TranscriptionInput, TranscriptionProvider } from './types';

function formatDuration(durationMs?: number) {
  if (!durationMs) return 'a short moment';
  const seconds = Math.max(1, Math.round(durationMs / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

type MockInput = TranscriptionInput & { recording?: Recording };

export const mockTranscriptionProvider: TranscriptionProvider & {
  transcribe(input: MockInput): Promise<TranscriptResult>;
} = {
  id: 'mock',
  label: 'On this device (mock)',
  mode: 'mock',

  async isAvailable() {
    return true;
  },

  async transcribe(input: MockInput): Promise<TranscriptResult> {
    if (input.signal?.aborted) {
      throw new DOMException('Mock transcription was aborted.', 'AbortError');
    }

    const duration = formatDuration(input.recording?.durationMs);
    const recordingLabel = input.recording?.id ?? input.recordingId;
    return {
      provider: this.id,
      language: 'en',
      confidence: 1,
      text: [
        'Mock transcript for your saved voice note.',
        `Nugget captured ${duration} of local audio and stored it on this device.`,
        `Recording reference: ${recordingLabel}.`,
        'Real transcription is intentionally separate and requires explicit consent.',
      ].join(' '),
      segments: [
        {
          start: 0,
          end: 48,
          text: 'Mock transcript for your saved voice note.',
        },
      ],
    };
  },
};
