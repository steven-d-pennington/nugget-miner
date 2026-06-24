# Nugget — Data Model

> Concrete Dexie/IndexedDB schema, domain types, indexes, relationships, and
> migration strategy. Implements [PRD §11](../../Nugget_PRD.md). EPIC-02 builds
> this; every other epic consumes it. Field names here are canonical.

---

## 1. Conventions

- All IDs are `string` (`crypto.randomUUID()`).
- All timestamps are `number` epoch-ms (`Date.now()`), named `createdAt` /
  `updatedAt`. Repositories set these; callers do not.
- Enums are string literal unions (below). Persist the string value.
- `tags` on records store **tag names** (denormalized) for fast display; the
  `tags` table tracks canonical names + usage counts.
- Soft delete is **not** used for ideas (hard delete with cascade, AC-010);
  `archived` is a separate "hide from default views" flag.

## 2. Enums

```ts
type IdeaStatus = 'captured' | 'transcribing' | 'transcribed'
                | 'extracting' | 'reviewed' | 'failed';
type SourceType = 'recording' | 'manual';
type ProcessingMode = 'local' | 'cloud';        // settings-level default
type PrivacyMode = 'local-only' | 'cloud-enabled';
type JobType = 'transcription' | 'extraction';
type JobStatus = 'queued' | 'processing' | 'complete' | 'failed' | 'canceled';
type NuggetCategory = 'idea' | 'decision' | 'risk' | 'note';
type ItemStatus = 'pending' | 'accepted' | 'rejected';   // nuggets/questions
type ActionStatus = 'open' | 'done' | 'archived';
type Priority = 'low' | 'medium' | 'high';
type RetentionPolicy = 'keep-forever' | 'delete-audio-after-transcript'
                     | 'archive-after-days';
type ExtractionPreset = 'product-idea' | 'work-reminder'
                      | 'story-idea' | 'general-thought';
type ExportScope = 'idea' | 'selection' | 'project' | 'database';
type ExportFormat = 'markdown' | 'json';
```

`SourceSpan` is shared by nuggets/actions/questions:

```ts
interface SourceSpan { start: number; end: number; } // char offsets into transcript.text
```

## 3. Entities (domain types + indexes)

> Dexie index strings are given as `&id` (primary), `field` (indexed),
> `[a+b]` (compound), `*tags` (multi-entry). Only indexed fields are listed in
> the index string; all fields are stored.

### settings (singleton, `id = 'app'`)
```ts
interface Settings {
  id: 'app';
  privacyMode: PrivacyMode;            // default 'local-only'
  processingMode: ProcessingMode;      // default 'local'
  transcriptionProviderId: string;     // default 'mock'
  extractionProviderId: string;        // default 'mock'
  defaultExtractionPreset: ExtractionPreset; // default 'general-thought'
  retentionPolicy: RetentionPolicy;    // default 'keep-forever'
  retentionDays?: number;              // when 'archive-after-days'
  encryptionEnabled: boolean;          // default false (Post-V1)
  onboardingCompletedAt?: number;
  createdAt: number; updatedAt: number;
}
```
Index: `&id`

### ideas
```ts
interface Idea {
  id: string;
  title: string;
  status: IdeaStatus;
  sourceType: SourceType;
  projectId?: string;
  tags: string[];                      // tag names
  favorite: boolean;
  archived: boolean;
  durationMs: number;                  // 0 for manual ideas
  actionCount: number;                 // denormalized for list display (FR-201)
  createdAt: number; updatedAt: number;
}
```
Index: `&id, createdAt, status, projectId, favorite, archived, *tags`

### recordings
```ts
interface Recording {
  id: string; ideaId: string;
  blob: Blob;                          // audio payload (FR-104)
  mimeType: string; sizeBytes: number; durationMs: number;
  waveformPreview: number[];           // downsampled RMS for UI
  checksum?: string;
  createdAt: number;
}
```
Index: `&id, ideaId`

### transcripts
```ts
interface Transcript {
  id: string; ideaId: string;
  text: string;                        // editable source of truth (FR-303)
  segments?: { start: number; end: number; text: string }[];
  language?: string; confidence?: number;
  provider: string; jobId?: string;
  edited: boolean;                     // true once user edits (AC-006)
  createdAt: number; updatedAt: number;
}
```
Index: `&id, ideaId`

### extractionRuns
```ts
interface ExtractionRun {
  id: string; ideaId: string; transcriptId: string;
  provider: string; preset: ExtractionPreset;
  promptVersion: string; schemaVersion: string;
  status: JobStatus;
  rawJson: string;                     // validated raw provider output
  summary?: string;                    // convenience copy of result.summary
  warnings?: string[];
  createdAt: number;
}
```
Index: `&id, ideaId, transcriptId`

### nuggets
```ts
interface Nugget {
  id: string; ideaId: string; extractionRunId: string;
  title: string; detail?: string;
  category: NuggetCategory; confidence?: number;
  sourceSpan?: SourceSpan; status: ItemStatus;
  createdAt: number; updatedAt: number;
}
```
Index: `&id, ideaId, extractionRunId, status`

### actionItems
```ts
interface ActionItem {
  id: string; ideaId?: string;         // optional → manual action (FR-505)
  extractionRunId?: string;
  title: string; description?: string;
  status: ActionStatus; priority: Priority;
  dueDate?: number; projectId?: string;
  tags: string[]; sourceSpan?: SourceSpan;
  createdAt: number; updatedAt: number;
}
```
Index: `&id, ideaId, status, priority, dueDate, projectId, *tags`

### questions
```ts
interface Question {
  id: string; ideaId: string; extractionRunId?: string;
  text: string; status: ItemStatus; sourceSpan?: SourceSpan;
  createdAt: number;
}
```
Index: `&id, ideaId, status`

### projects
```ts
interface Project {
  id: string; name: string; description?: string;
  color?: string; archived: boolean;
  createdAt: number; updatedAt: number;
}
```
Index: `&id, name, archived`

### tags
```ts
interface Tag { id: string; name: string; usageCount: number;
                createdAt: number; updatedAt: number; }
```
Index: `&id, &name`

### processingJobs
```ts
interface ProcessingJob {
  id: string; ideaId: string;
  type: JobType; provider: string;
  status: JobStatus; progress: number;     // 0..1
  errorMessage?: string;                    // sanitized
  attempts: number;
  createdAt: number; updatedAt: number;
}
```
Index: `&id, ideaId, status, [status+createdAt]`

### exports
```ts
interface ExportRecord {
  id: string; scope: ExportScope; format: ExportFormat;
  itemCount: number; createdAt: number;
}
```
Index: `&id, createdAt`

## 4. Relationships & cascade

```
Project 1───* Idea 1───1 Recording
                 │
                 ├──1 Transcript
                 ├──* ExtractionRun ──* Nugget
                 │                   ├─* ActionItem (also standalone if manual)
                 │                   └─* Question
                 └──* ProcessingJob
```

**Delete idea (AC-010):** in one Dexie transaction delete the idea's recording,
transcript, extractionRuns, nuggets, questions, processingJobs, and
source-linked actionItems. Manual actionItems (`ideaId == null`) are untouched.
Behavior is governed by a product setting `deleteLinkedActions` (default true);
when false, linked actions are detached (`ideaId`/`sourceSpan` cleared) rather
than deleted.

## 5. Migration strategy (PRD §24)

- Dexie versions are append-only in `lib/db/schema.ts`; **never** mutate a
  released version's stores — add `db.version(n).stores({...}).upgrade(...)`.
- Each migration ships with a test seeding the prior version and asserting ideas
  + recordings survive (NFR-003, EPIC-11).
- `schemaVersion` constant is exported and written into JSON exports so import
  can detect/upgrade older payloads.
- Bump `promptVersion`/`schemaVersion` on `extractionRuns` when the extraction
  contract changes; do not retro-edit stored runs.

## 6. Repository surface (EPIC-02)

One repository per aggregate in `lib/repositories`, each with explicit return
types and typed errors:

- `settingsRepository`: get/ensureDefaults/update.
- `ideaRepository`: create, getById, listByRecency(filters), update,
  setArchived, toggleFavorite, deleteCascade(ideaId, opts), recomputeActionCount.
- `recordingRepository`: add, getByIdeaId, getBlobUrl, deleteByIdeaId.
- `transcriptRepository`: upsert, getByIdeaId, updateText (sets edited+updatedAt).
- `extractionRunRepository`, `nuggetRepository`, `actionItemRepository`,
  `questionRepository`, `projectRepository`, `tagRepository`,
  `processingJobRepository`, `exportRepository` — CRUD + the query methods their
  epics require.

Repositories are the **only** modules importing the Dexie instance (architecture §2).

## 7. Fixtures (PRD §24 — built in EPIC-02, used everywhere)

`src/test/fixtures` exposes builders for: short recording, long recording, idea
with no transcript, failed transcript, failed extraction, idea with many
actions, idea with many tags, and a deleted-source idea (orphan-detached
actions). All deterministic.
</content>
