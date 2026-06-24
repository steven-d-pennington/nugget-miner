import Dexie, { type Table } from 'dexie';
import type { Idea, Recording, Transcript } from '@/types';

export const SCHEMA_VERSION = 1;

export class NuggetDatabase extends Dexie {
  ideas!: Table<Idea, string>;
  recordings!: Table<Recording, string>;
  transcripts!: Table<Transcript, string>;

  constructor(name = 'nugget') {
    super(name);
    this.version(SCHEMA_VERSION).stores({
      ideas: '&id, createdAt, status, projectId, favorite, archived, *tags',
      recordings: '&id, ideaId',
      transcripts: '&id, ideaId',
    });
  }
}

export const db = new NuggetDatabase();

export function resetClientDatabaseForTests() {
  return db.delete().then(() => db.open());
}
