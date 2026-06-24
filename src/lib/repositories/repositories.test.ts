import { afterEach, describe, expect, it } from 'vitest';
import { db, resetClientDatabaseForTests } from '@/lib/db';
import { ideaRepository, recordingRepository, transcriptRepository } from '@/lib/repositories';
import type { RecordingDraft } from '@/types';

afterEach(async () => {
  await resetClientDatabaseForTests();
});

describe('local recording transcript persistence', () => {
  it('stores and reads back an idea, recording, and transcript', async () => {
    const draft: RecordingDraft = {
      blob: new Blob(['audio-bytes'], { type: 'audio/webm' }),
      mimeType: 'audio/webm',
      durationMs: 1234,
      sizeBytes: 11,
      waveformPreview: [0, 0.2, 0.1],
    };

    const idea = await ideaRepository.create({ durationMs: draft.durationMs });
    const recording = await recordingRepository.add(idea.id, draft);
    const transcript = await transcriptRepository.upsert(idea.id, {
      text: 'Mock transcript text',
      provider: 'mock',
      language: 'en',
      confidence: 1,
    });

    await expect(ideaRepository.getById(idea.id)).resolves.toMatchObject({ id: idea.id });
    await expect(recordingRepository.getByIdeaId(idea.id)).resolves.toMatchObject({ id: recording.id, sizeBytes: 11 });
    await expect(transcriptRepository.getByIdeaId(idea.id)).resolves.toMatchObject({ id: transcript.id, text: 'Mock transcript text' });
  });

  it('updates transcript text and marks it edited', async () => {
    const idea = await ideaRepository.create({ durationMs: 1000 });
    await transcriptRepository.upsert(idea.id, { text: 'Original', provider: 'mock' });

    await transcriptRepository.updateText(idea.id, 'Edited transcript');

    await expect(transcriptRepository.getByIdeaId(idea.id)).resolves.toMatchObject({
      text: 'Edited transcript',
      edited: true,
    });
  });

  it('starts with an empty recent idea list', async () => {
    await expect(db.ideas.count()).resolves.toBe(0);
    await expect(ideaRepository.listByRecency()).resolves.toEqual([]);
  });
});
