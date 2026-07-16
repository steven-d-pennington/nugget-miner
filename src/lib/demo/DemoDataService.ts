import { db } from '@/lib/db';
import { categoryRepository } from '@/lib/repositories';
import {
  SAMPLE_ACTIONS,
  SAMPLE_CAPTURE,
  SAMPLE_IDEAS,
  SAMPLE_TAGS,
  SAMPLE_TRANSCRIPT,
} from './sampleData';

export interface DemoSeedResult {
  created: boolean;
  captureId: string;
}

export const DemoDataService = {
  async seed(): Promise<DemoSeedResult> {
    const existing = await db.captureSessions.get(SAMPLE_CAPTURE.id);
    if (existing) return { created: false, captureId: existing.id };

    await categoryRepository.ensureDefaults();

    let created = false;
    await db.transaction(
      'rw',
      db.captureSessions,
      db.transcripts,
      db.ideas,
      db.tags,
      db.actionItems,
      async () => {
        if (await db.captureSessions.get(SAMPLE_CAPTURE.id)) return;
        await db.captureSessions.put(SAMPLE_CAPTURE);
        await db.transcripts.put(SAMPLE_TRANSCRIPT);
        await db.ideas.bulkPut(SAMPLE_IDEAS);
        await db.tags.bulkPut(SAMPLE_TAGS);
        await db.actionItems.bulkPut(SAMPLE_ACTIONS);
        created = true;
      },
    );

    return { created, captureId: SAMPLE_CAPTURE.id };
  },
};
