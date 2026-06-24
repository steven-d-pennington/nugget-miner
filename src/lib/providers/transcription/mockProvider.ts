import type { Recording, TranscriptResult } from '@/types';

function formatDuration(durationMs: number) {
  const seconds = Math.max(1, Math.round(durationMs / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

export const mockTranscriptionProvider = {
  id: 'mock',
  label: 'On this device (mock)',
  mode: 'mock' as const,

  async transcribe(input: { ideaId: string; recording: Recording }): Promise<TranscriptResult> {
    const duration = formatDuration(input.recording.durationMs);
    return {
      provider: this.id,
      language: 'en',
      confidence: 1,
      text: [
        'Mock transcript for your saved voice note.',
        `Nugget captured ${duration} of local audio and stored it on this device.`,
        'Real transcription is intentionally not enabled in this slice.',
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
