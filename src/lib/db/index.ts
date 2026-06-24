import Dexie, { type Table } from 'dexie';
import type { ActionItem, ExtractionRun, Idea, Nugget, Question, Recording, Transcript } from '@/types';

export const SCHEMA_VERSION = 2;

export class NuggetDatabase extends Dexie {
  ideas!: Table<Idea, string>;
  recordings!: Table<Recording, string>;
  transcripts!: Table<Transcript, string>;
  extractionRuns!: Table<ExtractionRun, string>;
  nuggets!: Table<Nugget, string>;
  questions!: Table<Question, string>;
  actionItems!: Table<ActionItem, string>;

  constructor(name = 'nugget') {
    super(name);
    this.version(1).stores({
      ideas: '&id, createdAt, status, projectId, favorite, archived, *tags',
      recordings: '&id, ideaId',
      transcripts: '&id, ideaId',
    });
    this.version(SCHEMA_VERSION).stores({
      ideas: '&id, createdAt, status, projectId, favorite, archived, *tags',
      recordings: '&id, ideaId',
      transcripts: '&id, ideaId',
      extractionRuns: '&id, ideaId, transcriptId, createdAt',
      nuggets: '&id, ideaId, extractionRunId, status',
      questions: '&id, ideaId, extractionRunId, status',
      actionItems: '&id, ideaId, extractionRunId, status, priority, dueDate, *tags',
    });
  }
}

export const db = new NuggetDatabase();

export function resetClientDatabaseForTests() {
  return db.delete().then(() => db.open());
}
