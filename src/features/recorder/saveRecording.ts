import { cloudTranscriptionProvider } from '@/lib/providers/transcription/cloudProvider';
import { mockTranscriptionProvider } from '@/lib/providers/transcription/mockProvider';
import type { TranscriptionProvider } from '@/lib/providers/transcription/types';
import { ideaRepository, recordingRepository, transcriptRepository } from '@/lib/repositories';
import type { RecordingDraft } from '@/types';

export type TranscriptionMode = 'none' | 'mock' | 'cloud';

export interface SaveRecordingInput {
  draft: RecordingDraft;
  transcribe?: boolean;
  transcriptionMode?: TranscriptionMode;
  cloudProvider?: TranscriptionProvider;
}

function resolveMode(input: SaveRecordingInput): TranscriptionMode {
  if (input.transcriptionMode) return input.transcriptionMode;
  return input.transcribe ? 'mock' : 'none';
}

export async function saveRecording(input: SaveRecordingInput) {
  const transcriptionMode = resolveMode(input);
  const idea = await ideaRepository.create({
    durationMs: input.draft.durationMs,
    status: transcriptionMode === 'none' ? 'captured' : 'transcribing',
  });
  const recording = await recordingRepository.add(idea.id, input.draft);

  if (transcriptionMode === 'none') {
    return { idea, recording, transcript: undefined };
  }

  try {
    const provider = transcriptionMode === 'cloud' ? (input.cloudProvider ?? cloudTranscriptionProvider) : mockTranscriptionProvider;
    const result = await provider.transcribe({
      ideaId: idea.id,
      recordingId: recording.id,
      audioBlob: input.draft.blob,
      ...(transcriptionMode === 'mock' ? { recording } : {}),
    });
    const transcript = await transcriptRepository.upsert(idea.id, result);
    await ideaRepository.updateStatus(idea.id, 'transcribed');
    return { idea: { ...idea, status: 'transcribed' as const }, recording, transcript };
  } catch (error) {
    await ideaRepository.updateStatus(idea.id, 'failed');
    throw error;
  }
}
