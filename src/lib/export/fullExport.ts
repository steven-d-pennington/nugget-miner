import { db } from '@/lib/db';
import type {
  ActionItem,
  AppSettings,
  CaptureSession,
  Category,
  ExtractionRun,
  Idea,
  ProcessingError,
  Recording,
  Tag,
  Transcript,
} from '@/types';

export const FULL_EXPORT_SCHEMA_VERSION = 'nugget-full-export-v1' as const;

export interface NuggetFullExport {
  schemaVersion: typeof FULL_EXPORT_SCHEMA_VERSION;
  exportedAt: string;
  captures: Array<Omit<CaptureSession, 'lastError'> & { lastError?: ProcessingError }>;
  recordings: Array<Omit<Recording, 'blob'> & { base64: string }>;
  transcripts: Transcript[];
  extractionRuns: ExtractionRun[];
  ideas: Idea[];
  categories: Category[];
  tags: Tag[];
  actions: ActionItem[];
  settings: Pick<AppSettings, 'automaticProcessing' | 'cloudProcessingConsent'>;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

async function blobToBytes(blob: Blob) {
  if (typeof blob.arrayBuffer === 'function') return new Uint8Array(await blob.arrayBuffer());
  if (typeof Response !== 'undefined') return new Uint8Array(await new Response(blob).arrayBuffer());
  return new Promise<Uint8Array>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error('Recording could not be read.'));
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.readAsArrayBuffer(blob);
  });
}

function byId<T extends { id: string }>(rows: T[]) {
  return rows.sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
}

export async function buildFullExport(now: Date = new Date()): Promise<NuggetFullExport> {
  const [captures, recordings, transcripts, extractionRuns, ideas, categories, tags, actions, settingsRow] = await db.transaction(
    'r',
    [db.captureSessions, db.recordings, db.transcripts, db.extractionRuns, db.ideas, db.categories, db.tags, db.actionItems, db.settings],
    () => Promise.all([
      db.captureSessions.toArray(),
      db.recordings.toArray(),
      db.transcripts.toArray(),
      db.extractionRuns.toArray(),
      db.ideas.toArray(),
      db.categories.toArray(),
      db.tags.toArray(),
      db.actionItems.toArray(),
      db.settings.get('app'),
    ]),
  );

  const exportedRecordings = await Promise.all(byId(recordings).map(async ({ blob, ...recording }) => ({
    ...recording,
    base64: bytesToBase64(await blobToBytes(blob)),
  })));

  return {
    schemaVersion: FULL_EXPORT_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    captures: byId(captures),
    recordings: exportedRecordings,
    transcripts: byId(transcripts),
    extractionRuns: byId(extractionRuns),
    ideas: byId(ideas),
    categories: byId(categories),
    tags: byId(tags),
    actions: byId(actions),
    settings: {
      automaticProcessing: settingsRow?.automaticProcessing ?? false,
      cloudProcessingConsent: settingsRow?.cloudProcessingConsent ?? 'unknown',
    },
  };
}
