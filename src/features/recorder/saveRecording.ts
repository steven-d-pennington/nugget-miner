import { ideaRepository, recordingRepository, transcriptRepository } from '@/lib/repositories';
import { mockTranscriptionProvider } from '@/lib/providers/transcription/mockProvider';
import type { RecordingDraft } from '@/types';

export async function saveRecording(input: { draft: RecordingDraft; transcribe: boolean }) {
  const idea = await ideaRepository.create({
    durationMs: input.draft.durationMs,
    status: input.transcribe ? 'transcribing' : 'captured',
  });
  const recording = await recordingRepository.add(idea.id, input.draft);

  if (!input.transcribe) {
    return { idea, recording, transcript: undefined };
  }

  const result = await mockTranscriptionProvider.transcribe({ ideaId: idea.id, recording });
  const transcript = await transcriptRepository.upsert(idea.id, result);
  await ideaRepository.updateStatus(idea.id, 'transcribed');
  return { idea: { ...idea, status: 'transcribed' as const }, recording, transcript };
}
