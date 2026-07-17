import { db } from '@/lib/db';
import { categoryRepository } from '@/lib/repositories';
import {
  SAMPLE_ACTIONS,
  SAMPLE_CAPTURE,
  SAMPLE_IDEAS,
  SAMPLE_TAGS,
  SAMPLE_TRANSCRIPT,
} from './sampleData';
import type { Idea, Tag } from '@/types';

export interface DemoSeedResult {
  created: boolean;
  captureId: string;
}

async function resolveSampleTags(): Promise<Tag[]> {
  const tags: Tag[] = [];
  for (const sampleTag of SAMPLE_TAGS) {
    const existing = await db.tags.where('normalizedName').equals(sampleTag.normalizedName).first();
    if (existing) {
      tags.push(existing);
      continue;
    }
    await db.tags.add(sampleTag);
    tags.push(sampleTag);
  }
  return tags;
}

function sampleIdeasWithResolvedTags(tags: Tag[]): Idea[] {
  const sampleTagsById = new Map(SAMPLE_TAGS.map((tag) => [tag.id, tag]));
  const resolvedTagIdsByNormalizedName = new Map(tags.map((tag) => [tag.normalizedName, tag.id]));

  return SAMPLE_IDEAS.map((idea) => ({
    ...idea,
    tagIds: idea.tagIds.map((sampleTagId) => {
      const normalizedName = sampleTagsById.get(sampleTagId)?.normalizedName;
      const resolvedTagId = normalizedName ? resolvedTagIdsByNormalizedName.get(normalizedName) : undefined;
      if (!resolvedTagId) throw new Error(`Sample tag could not be resolved: ${sampleTagId}`);
      return resolvedTagId;
    }),
  }));
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
        const tags = await resolveSampleTags();
        const ideas = sampleIdeasWithResolvedTags(tags);
        await db.captureSessions.put(SAMPLE_CAPTURE);
        await db.transcripts.put(SAMPLE_TRANSCRIPT);
        await db.ideas.bulkPut(ideas);
        await db.actionItems.bulkPut(SAMPLE_ACTIONS);
        created = true;
      },
    );

    return { created, captureId: SAMPLE_CAPTURE.id };
  },
};
