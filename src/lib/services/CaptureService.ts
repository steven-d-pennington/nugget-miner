import { db } from '@/lib/db';
import { ValidationError } from '@/lib/errors';
import { captureRepository, recordingRepository, transcriptRepository } from '@/lib/repositories';
import type { CaptureSession, Recording, RecordingDraft, Transcript } from '@/types';

export interface SaveRecordingInput {
  draft: RecordingDraft;
  processingPreference: 'automatic' | 'manual';
}

export interface SaveTextInput {
  text: string;
  processingPreference: 'automatic' | 'manual';
}

export interface SavedCapture {
  capture: CaptureSession;
  recording?: Recording;
  transcript?: Transcript;
}

export const CaptureService = {
  async saveRecording(input: SaveRecordingInput): Promise<SavedCapture> {
    return db.transaction('rw', db.captureSessions, db.recordings, async () => {
      const capture = await captureRepository.create({
        source: 'audio',
        durationMs: input.draft.durationMs,
        processingPreference: input.processingPreference,
        initialState: input.processingPreference === 'automatic' ? 'queued' : 'saved',
      });
      const recording = await recordingRepository.add(capture.id, input.draft);
      await captureRepository.transition(capture.id, capture.processingState, { recordingId: recording.id });
      return { capture: { ...capture, recordingId: recording.id }, recording };
    });
  },

  async saveText(input: SaveTextInput): Promise<SavedCapture> {
    const text = input.text.trim();
    if (text.replace(/\s/g, '').length < 3) {
      throw new ValidationError('Enter at least three non-whitespace characters.');
    }

    return db.transaction('rw', db.captureSessions, db.transcripts, async () => {
      const processingState = input.processingPreference === 'automatic' ? 'queued' : 'transcript_ready';
      const capture = await captureRepository.create({
        source: 'text',
        durationMs: 0,
        processingPreference: input.processingPreference,
        initialState: processingState,
      });
      const transcript = await transcriptRepository.createVersion(capture.id, { text, provider: 'typed' });
      await captureRepository.transition(capture.id, processingState, { transcriptId: transcript.id });
      return { capture: { ...capture, transcriptId: transcript.id }, transcript };
    });
  },
};
