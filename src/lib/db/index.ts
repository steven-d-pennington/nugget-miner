import Dexie, { type Table } from 'dexie';
import type {
  ActionItem,
  AppSettings,
  CaptureSession,
  Category,
  ExtractionRun,
  Idea,
  Nugget,
  Question,
  Recording,
  Tag,
  Transcript,
} from '@/types';
import { DEFAULT_CATEGORIES, DEFAULT_CATEGORY_IDS } from './defaultCategories';

export const SCHEMA_VERSION = 3;

interface LegacyIdeaV2 {
  id: string;
  title: string;
  status: 'captured' | 'transcribing' | 'transcribed' | 'extracting' | 'reviewed' | 'failed';
  sourceType: 'recording' | 'manual';
  durationMs: number;
  createdAt: number;
  updatedAt: number;
}

interface LegacyRecordingV2 {
  ideaId?: string;
  captureSessionId?: string;
}

interface LegacyTranscriptV2 {
  id: string;
  ideaId?: string;
  captureSessionId?: string;
  text: string;
  edited?: boolean;
  version?: number;
  source?: 'transcription' | 'typed' | 'edited';
  contentHash?: string;
}

interface LegacyExtractionRunV2 {
  id: string;
  ideaId?: string;
  captureSessionId?: string;
  transcriptId: string;
  provider: string;
  preset?: string;
  promptVersion?: string;
  status: 'queued' | 'processing' | 'complete' | 'failed' | 'canceled' | ExtractionRun['status'];
  rawJson: string;
  createdAt?: number;
  transcriptHash?: string;
  model?: string;
  reasoningEffort?: string;
  segmentationPromptVersion?: string;
  organizationPromptVersion?: string;
  idempotencyKey?: string;
  stage?: 'segmenting' | 'organizing';
  attempt?: number;
  startedAt?: number;
  completedAt?: number;
}

interface LegacySuggestionRowV2 {
  ideaId?: string;
  captureSessionId?: string;
}

interface LegacyActionItemV2 {
  id: string;
  ideaId?: string;
  sourceSuggestionId?: string;
  extractionRunId?: string;
  title?: string;
  description?: string;
  status: 'open' | 'done' | 'archived' | 'completed';
  priority?: string;
  dueDate?: number;
  projectId?: string;
  tags?: string[];
  sourceSpan?: unknown;
  text?: string;
  createdAt: number;
  updatedAt: number;
}

function migratedRunStatus(status: LegacyExtractionRunV2['status']): ExtractionRun['status'] {
  if (status === 'running' || status === 'succeeded' || status === 'superseded') return status;
  if (status === 'complete') return 'succeeded';
  if (status === 'failed') return 'failed';
  if (status === 'canceled') return 'superseded';
  return 'running';
}

export class NuggetDatabase extends Dexie {
  captureSessions!: Table<CaptureSession, string>;
  ideas!: Table<Idea, string>;
  recordings!: Table<Recording, string>;
  transcripts!: Table<Transcript, string>;
  extractionRuns!: Table<ExtractionRun, string>;
  categories!: Table<Category, string>;
  tags!: Table<Tag, string>;
  nuggets!: Table<Nugget, string>;
  questions!: Table<Question, string>;
  actionItems!: Table<ActionItem, string>;
  settings!: Table<AppSettings, string>;

  constructor(name = 'nugget') {
    super(name);
    this.version(1).stores({
      ideas: '&id, createdAt, status, projectId, favorite, archived, *tags',
      recordings: '&id, ideaId',
      transcripts: '&id, ideaId',
    });
    this.version(2).stores({
      ideas: '&id, createdAt, status, projectId, favorite, archived, *tags',
      recordings: '&id, ideaId',
      transcripts: '&id, ideaId',
      extractionRuns: '&id, ideaId, transcriptId, createdAt',
      nuggets: '&id, ideaId, extractionRunId, status',
      questions: '&id, ideaId, extractionRunId, status',
      actionItems: '&id, ideaId, extractionRunId, status, priority, dueDate, *tags',
    });
    this.version(SCHEMA_VERSION)
      .stores({
        captureSessions: '&id, createdAt, updatedAt, processingState, source, [processingState+updatedAt]',
        ideas: '&id, captureSessionId, extractionRunId, status, categoryId, createdAt, updatedAt, *tagIds, [status+updatedAt]',
        recordings: '&id, captureSessionId',
        transcripts: '&id, captureSessionId, [captureSessionId+version], contentHash',
        extractionRuns: '&id, captureSessionId, transcriptId, status, stage, startedAt, idempotencyKey, &[idempotencyKey+attempt]',
        categories: '&id, &normalizedName, sortOrder, isFallback',
        tags: '&id, &normalizedName, createdAt',
        nuggets: '&id, captureSessionId, extractionRunId, status',
        questions: '&id, captureSessionId, extractionRunId, status',
        actionItems: '&id, ideaId, status, createdAt, &[ideaId+sourceSuggestionId]',
        settings: '&key',
      })
      .upgrade(async (tx) => {
        const legacyIdeas = await tx.table<LegacyIdeaV2, string>('ideas').toArray();
        const legacyTranscripts = await tx.table<LegacyTranscriptV2, string>('transcripts').toArray();
        const legacyRuns = await tx.table<LegacyExtractionRunV2, string>('extractionRuns').toArray();
        const now = Date.now();

        await tx.table<Category, string>('categories').bulkPut(
          DEFAULT_CATEGORIES.map((category) => ({ ...category, createdAt: now, updatedAt: now })),
        );

        const captures: CaptureSession[] = legacyIdeas.map((legacy) => ({
          id: legacy.id,
          source: legacy.sourceType === 'manual' ? 'text' : 'audio',
          processingState:
            legacy.status === 'failed'
              ? 'failed'
              : legacy.status === 'reviewed'
                ? 'ready_for_review'
                : legacy.status === 'transcribed'
                  ? 'transcript_ready'
                  : legacy.status === 'transcribing'
                    ? 'transcribing'
                    : 'saved',
          processingPreference: 'manual',
          processingAttempt: 0,
          durationMs: legacy.durationMs,
          createdAt: legacy.createdAt,
          updatedAt: legacy.updatedAt,
        }));

        await tx.table<CaptureSession, string>('captureSessions').bulkPut(captures);

        const migratedIdeas: Idea[] = [];
        for (const legacy of legacyIdeas) {
          const transcript = legacyTranscripts.find((item) => item.ideaId === legacy.id);
          const latestRun = legacyRuns
            .filter((item) => item.ideaId === legacy.id)
            .sort((left, right) => (left.createdAt ?? 0) - (right.createdAt ?? 0))
            .at(-1);
          const raw = latestRun?.rawJson ? (JSON.parse(latestRun.rawJson) as { summary?: unknown }) : undefined;
          const summaryText = typeof raw?.summary === 'string' ? raw.summary : transcript?.text.slice(0, 280) || legacy.title;

          migratedIdeas.push({
            id: legacy.id,
            captureSessionId: legacy.id,
            extractionRunId: latestRun?.id,
            status: 'draft',
            title: legacy.title,
            summary: {
              id: `grounded-${legacy.id}`,
              text: summaryText,
              basis: 'inferred',
              sourceSpanIds: [],
            },
            goals: [],
            blockers: [],
            questions: [],
            suggestedActions: [],
            research: { needed: false, suggestedQueries: [], suggestedResourceTypes: [] },
            categoryId: DEFAULT_CATEGORY_IDS.misc,
            tagIds: [],
            sourceSpans: [],
            createdAt: legacy.createdAt,
            updatedAt: legacy.updatedAt,
          });
        }

        await tx.table<Idea, string>('ideas').clear();
        await tx.table<Idea, string>('ideas').bulkPut(migratedIdeas);

        await tx
          .table<LegacyRecordingV2, string>('recordings')
          .toCollection()
          .modify((row) => {
            if (!row.ideaId) throw new Error('Legacy recording is missing its capture reference.');
            row.captureSessionId = row.ideaId;
            delete row.ideaId;
          });
        await tx
          .table<LegacyTranscriptV2, string>('transcripts')
          .toCollection()
          .modify((row) => {
            if (!row.ideaId) throw new Error('Legacy transcript is missing its capture reference.');
            row.captureSessionId = row.ideaId;
            row.version = 1;
            row.source = row.edited ? 'edited' : 'transcription';
            row.contentHash = `legacy:${row.id}`;
            delete row.ideaId;
            delete row.edited;
          });
        await tx
          .table<LegacyExtractionRunV2, string>('extractionRuns')
          .toCollection()
          .modify((row) => {
            if (!row.ideaId || row.createdAt === undefined) {
              throw new Error('Legacy extraction run is missing required migration data.');
            }
            const createdAt = row.createdAt;
            row.captureSessionId = row.ideaId;
            row.transcriptHash = `legacy:${row.transcriptId}`;
            row.model = row.provider;
            row.reasoningEffort = 'legacy';
            row.segmentationPromptVersion = 'legacy-single-stage';
            row.organizationPromptVersion = row.promptVersion ?? 'legacy-single-stage';
            row.idempotencyKey = `legacy:${row.id}`;
            row.status = migratedRunStatus(row.status);
            row.stage = 'organizing';
            row.attempt = 1;
            row.startedAt = createdAt;
            row.completedAt = row.status === 'succeeded' ? createdAt : undefined;
            delete row.ideaId;
            delete row.promptVersion;
            delete row.preset;
            delete row.createdAt;
          });
        await tx
          .table<LegacySuggestionRowV2, string>('nuggets')
          .toCollection()
          .modify((row) => {
            if (!row.ideaId) throw new Error('Legacy nugget is missing its capture reference.');
            row.captureSessionId = row.ideaId;
            delete row.ideaId;
          });
        await tx
          .table<LegacySuggestionRowV2, string>('questions')
          .toCollection()
          .modify((row) => {
            if (!row.ideaId) throw new Error('Legacy question is missing its capture reference.');
            row.captureSessionId = row.ideaId;
            delete row.ideaId;
          });
        await tx
          .table<LegacyActionItemV2, string>('actionItems')
          .toCollection()
          .modify((row) => {
            if (!row.ideaId || !row.title) throw new Error('Legacy action is missing required migration data.');
            row.text = row.title;
            row.sourceSuggestionId = row.sourceSuggestionId ?? `legacy:${row.id}`;
            row.status = row.status === 'done' ? 'completed' : 'open';
            delete row.title;
            delete row.description;
            delete row.priority;
            delete row.dueDate;
            delete row.projectId;
            delete row.tags;
            delete row.sourceSpan;
            delete row.extractionRunId;
          });
      });

    this.on('populate', (tx) => {
      const timestamp = Date.now();
      return tx.table<Category, string>('categories').bulkAdd(
        DEFAULT_CATEGORIES.map((category) => ({ ...category, createdAt: timestamp, updatedAt: timestamp })),
      );
    });
  }
}

export const db = new NuggetDatabase();

export function resetClientDatabaseForTests() {
  return db.delete().then(() => db.open());
}
