import { db } from '@/lib/db';
import { normalizeLabel } from '@/lib/normalization/labels';
import type { Tag } from '@/types';

function uniqueNames(names: string[]) {
  const normalized = new Set<string>();
  const result: Array<{ name: string; normalizedName: string }> = [];
  for (const value of names) {
    const name = value.trim().replace(/\s+/g, ' ');
    const normalizedName = normalizeLabel(name);
    if (!normalizedName || normalized.has(normalizedName)) continue;
    normalized.add(normalizedName);
    result.push({ name, normalizedName });
    if (result.length === 6) break;
  }
  return result;
}

export const tagRepository = {
  async findOrCreate(names: string[]): Promise<Tag[]> {
    const labels = uniqueNames(names);
    return db.transaction('rw', db.tags, async () => {
      const result: Tag[] = [];
      for (const label of labels) {
        const existing = await db.tags.where('normalizedName').equals(label.normalizedName).first();
        if (existing) {
          result.push(existing);
          continue;
        }
        const tag: Tag = {
          id: crypto.randomUUID(),
          ...label,
          createdAt: Date.now(),
        };
        await db.tags.add(tag);
        result.push(tag);
      }
      return result;
    });
  },

  async list(): Promise<Tag[]> {
    return db.tags.orderBy('createdAt').toArray();
  },

  async getByIds(ids: string[]): Promise<Tag[]> {
    const tags = await db.tags.bulkGet(ids);
    return tags.filter((tag): tag is Tag => tag !== undefined);
  },
};
