# Nugget MVP Sprint 1 Capture and Data Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the one-recording/one-idea assumption with durable capture sessions, independent ideas, categories, tags, versioned transcripts, and a resumable processing queue.

**Architecture:** Upgrade Dexie from schema version 2 to 3, migrate the current `ideas` capture records into `captureSessions`, and repurpose `ideas` for independently confirmable library items. Save audio and capture state in one transaction, keep cloud work outside the save transaction, and represent pending work through persisted capture state rather than an in-memory-only queue.

**Tech Stack:** TypeScript, Dexie 4.4.4, Web Crypto, React 19, Vitest, fake-indexeddb.

## Global Constraints

- Recordings and transcripts must survive the schema migration.
- Preserve old extraction JSON in `extractionRuns`; do not silently discard prior model output.
- New recording save must not wait for transcription or GPT processing.
- A successful save message is allowed only after the Dexie transaction commits.
- `Misc` is the non-deletable fallback category.
- Category descriptions are classifier input, not decorative settings copy.
- Do not implement the GPT-5.6 network pipeline in this sprint; Sprint 2 consumes the interfaces created here.
- Keep the application compiling while transitional legacy review tables remain present.
- Use focused migration, repository, queue, and capture tests; do not apply full TDD.
- Tasks 1 through 6 are one atomic schema-refactor workstream because the canonical `Idea`, `Recording`, `Transcript`, `ExtractionRun`, and `ActionItem` names replace live legacy contracts. Run each task's focused checks as written, but do not create an intermediate commit or run the full-project typecheck until Task 6 has updated every current consumer. Task 6 creates the single compiling integration commit for this workstream.

---

### Task 1: Define the new domain contract

**Files:**
- Modify: `src/types/domain.ts`
- Modify: `src/types/index.ts`

**Interfaces:**
- Produces: all stable entities consumed by Dexie, repositories, processing, and later UI sprints

- [ ] **Step 1: Replace overloaded status and source types**

Add these exact unions near the top of `src/types/domain.ts`:

```ts
export type CaptureSource = 'audio' | 'text';
export type ProcessingStage = 'transcription' | 'segmentation' | 'organization' | 'persistence';
export type ProcessingState =
  | 'saved'
  | 'queued'
  | 'transcribing'
  | 'transcript_ready'
  | 'segmenting'
  | 'organizing'
  | 'ready_for_review'
  | 'partially_confirmed'
  | 'confirmed'
  | 'failed';
export type ContentBasis = 'explicit' | 'inferred' | 'suggested';
export type IdeaStatus = 'draft' | 'confirmed' | 'archived';
export type CloudProcessingConsent = 'unknown' | 'granted' | 'denied';
export type ActionStatus = 'open' | 'completed';
```

Remove the old `IdeaStatus`, `SourceType`, `NuggetCategory`, `ItemStatus`, and `ActionStatus` declarations after all transitional users have been updated in Task 6.

- [ ] **Step 2: Add processing and capture types**

```ts
export interface ProcessingError {
  stage: ProcessingStage;
  code: string;
  message: string;
  retryable: boolean;
  occurredAt: number;
}

export interface CaptureSession {
  id: string;
  source: CaptureSource;
  recordingId?: string;
  transcriptId?: string;
  activeExtractionRunId?: string;
  processingState: ProcessingState;
  recoverableStage?: ProcessingStage;
  processingPreference: 'automatic' | 'manual';
  processingAttempt: number;
  nextRetryAt?: number;
  lastError?: ProcessingError;
  durationMs: number;
  createdAt: number;
  updatedAt: number;
}
```

- [ ] **Step 3: Replace source and grounding shapes**

```ts
export interface SourceSpan {
  id: string;
  startChar: number;
  endChar: number;
  quote: string;
}

export interface GroundedText {
  id: string;
  text: string;
  basis: ContentBasis;
  sourceSpanIds: string[];
}
```

All later `explicit` values must include at least one `sourceSpanId`. Migration-created summaries use `inferred` if no transcript span exists.

- [ ] **Step 4: Define the canonical idea, category, tag, and action entities**

```ts
export interface Idea {
  id: string;
  captureSessionId: string;
  extractionRunId?: string;
  status: IdeaStatus;
  title: string;
  summary: GroundedText;
  purpose?: GroundedText;
  goals: GroundedText[];
  problem?: { statement: GroundedText; type?: string };
  blockers: GroundedText[];
  questions: GroundedText[];
  suggestedActions: GroundedText[];
  research: {
    needed: boolean;
    assessment?: GroundedText;
    suggestedQueries: string[];
    suggestedResourceTypes: string[];
  };
  categoryId: string;
  categoryConfidence?: number;
  tagIds: string[];
  sourceSpans: SourceSpan[];
  createdAt: number;
  updatedAt: number;
  confirmedAt?: number;
}

export interface Category {
  id: string;
  name: string;
  normalizedName: string;
  description: string;
  isDefault: boolean;
  isFallback: boolean;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface Tag {
  id: string;
  name: string;
  normalizedName: string;
  createdAt: number;
}

export interface ActionItem {
  id: string;
  ideaId: string;
  sourceSuggestionId?: string;
  text: string;
  status: ActionStatus;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}
```

- [ ] **Step 5: Update recording, transcript, extraction-run, and settings types**

Keep `RecordingDraft` and `TranscriptResult`, but use these persisted shapes:

```ts
export interface Recording {
  id: string;
  captureSessionId: string;
  blob: Blob;
  mimeType: string;
  sizeBytes: number;
  durationMs: number;
  waveformPreview: number[];
  checksum?: string;
  createdAt: number;
}

export interface Transcript {
  id: string;
  captureSessionId: string;
  version: number;
  text: string;
  segments?: TranscriptSegment[];
  language?: string;
  confidence?: number;
  provider: string;
  model?: string;
  source: 'transcription' | 'typed' | 'edited';
  contentHash: string;
  createdAt: number;
  updatedAt: number;
}

export interface ExtractionRun {
  id: string;
  captureSessionId: string;
  transcriptId: string;
  transcriptHash: string;
  provider: string;
  model: string;
  reasoningEffort: string;
  segmentationPromptVersion: string;
  organizationPromptVersion: string;
  schemaVersion: string;
  idempotencyKey: string;
  status: 'running' | 'succeeded' | 'failed' | 'superseded';
  stage: 'segmenting' | 'organizing';
  attempt: number;
  rawJson: string;
  startedAt: number;
  completedAt?: number;
  latencyMs?: number;
  errorCode?: string;
}

export interface AppSettings {
  key: 'app';
  automaticProcessing: boolean;
  cloudProcessingConsent: CloudProcessingConsent;
  clientId: string;
  createdAt: number;
  updatedAt: number;
}
```

- [ ] **Step 6: Retain transitional legacy suggestion types**

Keep `ExtractionNuggetSuggestion`, `ExtractionActionSuggestion`, `ExtractionQuestionSuggestion`, `Nugget`, and `Question` only until Sprint 2 removes the old single-result review path. Add a `/** @deprecated Sprint 2 migration bridge */` comment above each so new code cannot mistake them for canonical ideas.

- [ ] **Step 7: Lint the canonical domain contract**

```powershell
npx eslint src/types/domain.ts src/types/index.ts
```

Expected: the two changed files lint cleanly. Full-project compile errors caused by legacy consumers are expected until Task 6; do not suppress them with `any`, and do not commit this intermediate state.

### Task 2: Upgrade Dexie schema and preserve legacy data

**Files:**
- Modify: `src/lib/db/index.ts`
- Create: `src/lib/db/defaultCategories.ts`
- Create: `src/lib/db/migrations.test.ts`

**Interfaces:**
- Consumes: version-2 tables and legacy capture-shaped `ideas` rows
- Produces: schema version 3 with `captureSessions`, canonical `ideas`, `categories`, `tags`, and `settings`

- [ ] **Step 1: Define stable default categories**

Create `src/lib/db/defaultCategories.ts`:

```ts
import type { Category } from '@/types';

const timestamp = 0;

export const DEFAULT_CATEGORY_IDS = {
  work: 'category-work',
  school: 'category-school',
  personal: 'category-personal',
  family: 'category-family',
  misc: 'category-misc',
} as const;

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: DEFAULT_CATEGORY_IDS.work,
    name: 'Work',
    normalizedName: 'work',
    description: 'Professional responsibilities, paid work, clients, coworkers, business operations, career development, and job-related projects. Examples: improve an internal deployment process; prepare a client proposal; follow up with a coworker. Do not use for coursework or purely personal side projects.',
    isDefault: true,
    isFallback: false,
    sortOrder: 10,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: DEFAULT_CATEGORY_IDS.school,
    name: 'School',
    normalizedName: 'school',
    description: 'Formal learning, classes, assignments, studying, academic research, instructors, and school organizations. Examples: outline a term paper; compare degree programs; prepare for an exam. Do not use for work training unless it is part of a formal course.',
    isDefault: true,
    isFallback: false,
    sortOrder: 20,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: DEFAULT_CATEGORY_IDS.personal,
    name: 'Personal',
    normalizedName: 'personal',
    description: 'Individual projects, hobbies, health, finances, home, creativity, self-improvement, and personal errands that are not primarily about work, school, or family coordination. Examples: build a neighborhood tool library; train for a race; redesign a home office.',
    isDefault: true,
    isFallback: false,
    sortOrder: 30,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: DEFAULT_CATEGORY_IDS.family,
    name: 'Family',
    normalizedName: 'family',
    description: 'Shared household or family responsibilities, relationships, caregiving, events, and plans involving relatives. Examples: organize a family reunion; create a chore schedule; research care options for a parent. Use Personal when the idea concerns only the speaker.',
    isDefault: true,
    isFallback: false,
    sortOrder: 40,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: DEFAULT_CATEGORY_IDS.misc,
    name: 'Misc',
    normalizedName: 'misc',
    description: 'Fallback for ideas that do not fit another category or are too ambiguous to classify confidently. Use only after comparing the idea against every other category description.',
    isDefault: true,
    isFallback: true,
    sortOrder: 50,
    createdAt: timestamp,
    updatedAt: timestamp,
  },
];
```

When seeding outside a migration, replace zero timestamps with the current time.

- [ ] **Step 2: Declare schema version 3**

In `src/lib/db/index.ts`, set `SCHEMA_VERSION = 3`, add typed tables, and declare stores:

```ts
captureSessions!: Table<CaptureSession, string>;
ideas!: Table<Idea, string>;
recordings!: Table<Recording, string>;
transcripts!: Table<Transcript, string>;
extractionRuns!: Table<ExtractionRun, string>;
categories!: Table<Category, string>;
tags!: Table<Tag, string>;
actionItems!: Table<ActionItem, string>;
settings!: Table<AppSettings, string>;
```

```ts
this.version(SCHEMA_VERSION)
  .stores({
    captureSessions: '&id, createdAt, updatedAt, processingState, source, [processingState+updatedAt]',
    ideas: '&id, captureSessionId, extractionRunId, status, categoryId, createdAt, updatedAt, *tagIds, [status+updatedAt]',
    recordings: '&id, captureSessionId',
    transcripts: '&id, captureSessionId, [captureSessionId+version], contentHash',
    extractionRuns: '&id, captureSessionId, transcriptId, status, stage, startedAt, &idempotencyKey',
    categories: '&id, &normalizedName, sortOrder, isFallback',
    tags: '&id, &normalizedName, createdAt',
    nuggets: '&id, captureSessionId, extractionRunId, status',
    questions: '&id, captureSessionId, extractionRunId, status',
    actionItems: '&id, ideaId, status, createdAt, &[ideaId+sourceSuggestionId]',
    settings: '&key',
  })
```

- [ ] **Step 3: Implement the upgrade transaction**

Define a local `LegacyIdeaV2` matching the old row. Inside `.upgrade(async (tx) => { ... })`:

```ts
const legacyIdeas = await tx.table<LegacyIdeaV2, string>('ideas').toArray();
const now = Date.now();

await tx.table('categories').bulkPut(
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

await tx.table('captureSessions').bulkPut(captures);
```

Before clearing the old `ideas` rows, read the newest extraction run and transcript per legacy ID. Create one migrated draft per old capture using the same ID so existing action links remain intact:

```ts
const migratedIdeas: Idea[] = [];
for (const legacy of legacyIdeas) {
  const transcript = await tx.table('transcripts').where('ideaId').equals(legacy.id).first();
  const runs = await tx.table('extractionRuns').where('ideaId').equals(legacy.id).sortBy('createdAt');
  const latestRun = runs.at(-1);
  const raw = latestRun?.rawJson ? (JSON.parse(latestRun.rawJson) as { summary?: unknown }) : undefined;
  const summaryText = typeof raw?.summary === 'string' ? raw.summary : transcript?.text?.slice(0, 280) || legacy.title;

  migratedIdeas.push({
    id: legacy.id,
    captureSessionId: legacy.id,
    extractionRunId: latestRun?.id,
    status: 'draft',
    title: legacy.title,
    summary: { id: `grounded-${legacy.id}`, text: summaryText, basis: 'inferred', sourceSpanIds: [] },
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

await tx.table('ideas').clear();
await tx.table('ideas').bulkPut(migratedIdeas);
```

Modify old foreign-key fields in the same transaction:

```ts
await tx.table('recordings').toCollection().modify((row) => {
  row.captureSessionId = row.ideaId;
  delete row.ideaId;
});
await tx.table('transcripts').toCollection().modify((row) => {
  row.captureSessionId = row.ideaId;
  row.version = 1;
  row.source = row.edited ? 'edited' : 'transcription';
  row.contentHash = `legacy:${row.id}`;
  delete row.ideaId;
  delete row.edited;
});
await tx.table('extractionRuns').toCollection().modify((row) => {
  row.captureSessionId = row.ideaId;
  row.transcriptHash = `legacy:${row.transcriptId}`;
  row.model = row.provider;
  row.reasoningEffort = 'legacy';
  row.segmentationPromptVersion = 'legacy-single-stage';
  row.organizationPromptVersion = row.promptVersion ?? 'legacy-single-stage';
  row.idempotencyKey = `legacy:${row.id}`;
  row.status = row.status === 'complete' ? 'succeeded' : row.status;
  row.stage = 'organizing';
  row.attempt = 1;
  row.startedAt = row.createdAt;
  row.completedAt = row.status === 'succeeded' ? row.createdAt : undefined;
  delete row.ideaId;
  delete row.promptVersion;
  delete row.preset;
  delete row.createdAt;
});
await tx.table('nuggets').toCollection().modify((row) => {
  row.captureSessionId = row.ideaId;
  delete row.ideaId;
});
await tx.table('questions').toCollection().modify((row) => {
  row.captureSessionId = row.ideaId;
  delete row.ideaId;
});
await tx.table('actionItems').toCollection().modify((row) => {
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
```

Do not catch and ignore migration errors. A failed upgrade must abort atomically.

- [ ] **Step 4: Add a real version-2 migration fixture test**

In `migrations.test.ts`, create a temporary Dexie database at version 2, insert one capture, Blob, transcript, run, action, close it, then open `NuggetDatabase` with the same name. Assert:

```ts
expect(await upgraded.captureSessions.get(legacyId)).toMatchObject({ id: legacyId, source: 'audio' });
expect(await upgraded.recordings.where('captureSessionId').equals(legacyId).count()).toBe(1);
expect(await upgraded.transcripts.where('captureSessionId').equals(legacyId).count()).toBe(1);
expect(await upgraded.ideas.get(legacyId)).toMatchObject({ captureSessionId: legacyId, categoryId: 'category-misc' });
expect(await upgraded.actionItems.get(actionId)).toMatchObject({ ideaId: legacyId, status: 'open' });
expect(await upgraded.categories.count()).toBe(5);
```

Also assert the original extraction `rawJson` string is unchanged.

- [ ] **Step 5: Run migration tests twice**

```powershell
npx vitest run src/lib/db/migrations.test.ts
npx vitest run src/lib/db/migrations.test.ts
```

Expected: both passes succeed, proving test cleanup and repeatability.

- [ ] **Step 6: Keep the tested schema changes in the atomic worktree**

Do not commit yet. Task 6 validates and commits the complete compiling schema refactor.

### Task 3: Implement repositories and content hashing

**Files:**
- Create: `src/lib/crypto/contentHash.ts`
- Create: `src/lib/repositories/captureRepository.ts`
- Rewrite: `src/lib/repositories/ideaRepository.ts`
- Rewrite: `src/lib/repositories/recordingRepository.ts`
- Rewrite: `src/lib/repositories/transcriptRepository.ts`
- Rewrite: `src/lib/repositories/extractionRunRepository.ts`
- Modify: `src/lib/repositories/index.ts`
- Modify: `src/lib/repositories/repositories.test.ts`

**Interfaces:**
- Produces: stable repository signatures listed in the sprint index

- [ ] **Step 1: Add deterministic SHA-256 hashing**

Create `src/lib/crypto/contentHash.ts`:

```ts
export async function sha256Text(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
```

- [ ] **Step 2: Implement capture repository contracts**

`captureRepository.ts` must export:

```ts
export interface CreateCaptureInput {
  source: CaptureSource;
  durationMs?: number;
  processingPreference: 'automatic' | 'manual';
  initialState?: ProcessingState;
}

export type CapturePatch = Partial<
  Pick<CaptureSession, 'recordingId' | 'transcriptId' | 'activeExtractionRunId' | 'recoverableStage' | 'processingAttempt' | 'nextRetryAt' | 'lastError'>
>;

export const captureRepository = {
  create(input: CreateCaptureInput): Promise<CaptureSession>,
  getById(id: string): Promise<CaptureSession | undefined>,
  listRecent(limit = 20): Promise<CaptureSession[]>,
  listRunnable(): Promise<CaptureSession[]>,
  transition(id: string, processingState: ProcessingState, patch: CapturePatch = {}): Promise<void>,
};
```

`listRunnable()` returns `queued` captures and retryable `failed` captures whose `nextRetryAt` is absent or not in the future.

- [ ] **Step 3: Implement recording and versioned transcript repositories**

Use these signatures:

```ts
recordingRepository.add(captureSessionId: string, draft: RecordingDraft): Promise<Recording>
recordingRepository.getByCaptureId(captureSessionId: string): Promise<Recording | undefined>

transcriptRepository.createVersion(captureSessionId: string, result: TranscriptResult): Promise<Transcript>
transcriptRepository.getCurrent(captureSessionId: string): Promise<Transcript | undefined>
transcriptRepository.listVersions(captureSessionId: string): Promise<Transcript[]>
transcriptRepository.updateText(captureSessionId: string, text: string): Promise<Transcript>
```

`createVersion()` computes `contentHash`, increments the highest version, and sets `source` to `typed` only when provider equals `typed`. `updateText()` creates a new version with provider `user`, source `edited`, and does not mutate the prior row.

- [ ] **Step 4: Implement canonical idea repository methods**

`ideaRepository.ts` must export:

```ts
export interface ConfirmIdeaInput {
  title: string;
  summary: GroundedText;
  purpose?: GroundedText;
  goals: GroundedText[];
  problem?: Idea['problem'];
  blockers: GroundedText[];
  questions: GroundedText[];
  suggestedActions: GroundedText[];
  research: Idea['research'];
  categoryId: string;
  tagIds: string[];
}

export const ideaRepository = {
  addDrafts(ideas: Idea[]): Promise<void>,
  getById(id: string): Promise<Idea | undefined>,
  listDraftsByCapture(captureSessionId: string): Promise<Idea[]>,
  listConfirmed(): Promise<Idea[]>,
  confirm(id: string, input: ConfirmIdeaInput): Promise<Idea>,
  discardDraft(id: string): Promise<void>,
  archive(id: string): Promise<void>,
};
```

`confirm()` verifies the category exists, verifies every `explicit` grounded value references a source span on that idea, sets `confirmedAt`, and updates the parent capture to `partially_confirmed` or `confirmed` based on remaining drafts.

- [ ] **Step 5: Update extraction-run repository for immutable runs**

Expose:

```ts
extractionRunRepository.start(input: StartExtractionRunInput): Promise<ExtractionRun>
extractionRunRepository.complete(id: string, rawJson: string, latencyMs: number): Promise<void>
extractionRunRepository.fail(id: string, errorCode: string): Promise<void>
extractionRunRepository.getById(id: string): Promise<ExtractionRun | undefined>
extractionRunRepository.findByIdempotencyKey(key: string): Promise<ExtractionRun | undefined>
extractionRunRepository.listByCapture(captureSessionId: string): Promise<ExtractionRun[]>
```

`start()` first queries `idempotencyKey`; if a succeeded run exists, return it instead of adding another row.

- [ ] **Step 6: Rewrite repository tests around the new semantics**

Required assertions:

```ts
expect(recording.captureSessionId).toBe(capture.id);
expect(transcriptV2.version).toBe(2);
expect(transcriptV2.source).toBe('edited');
expect(transcriptV2.contentHash).not.toBe(transcriptV1.contentHash);
expect(await captureRepository.listRunnable()).toEqual(expect.arrayContaining([expect.objectContaining({ id: capture.id })]));
```

Also verify confirming an explicit field without source evidence rejects with `ValidationError`.

- [ ] **Step 7: Run repository and migration tests**

```powershell
npx vitest run src/lib/repositories/repositories.test.ts src/lib/db/migrations.test.ts
```

Expected: the focused suites pass. Keep the changes uncommitted until Task 6 completes the consumer bridge.

### Task 4: Add category, tag, and settings repositories

**Files:**
- Create: `src/lib/repositories/categoryRepository.ts`
- Create: `src/lib/repositories/tagRepository.ts`
- Create: `src/lib/repositories/settingsRepository.ts`
- Create: `src/lib/repositories/organizationRepositories.test.ts`
- Modify: `src/lib/repositories/index.ts`

**Interfaces:**
- Produces: classifier-ready categories, normalized tags, and one-time cloud-processing preference

- [ ] **Step 1: Implement shared normalization**

Add this private helper in category and tag repositories, or place it in `src/lib/normalization/labels.ts` if both import it:

```ts
export function normalizeLabel(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}
```

- [ ] **Step 2: Implement category repository**

Use these inputs:

```ts
export interface CreateCategoryInput { name: string; description: string }
export interface UpdateCategoryInput { name?: string; description?: string; sortOrder?: number }
```

Behavior:

- `ensureDefaults()` inserts missing default IDs with current timestamps and never overwrites user-edited descriptions.
- `create()` requires a non-empty unique normalized name and a description of at least 20 characters.
- `update()` applies the same validation.
- `removeAndReassign()` rejects the fallback category, verifies replacement exists, updates all matching ideas in one transaction, then deletes the category.

- [ ] **Step 3: Implement tag repository**

Expose:

```ts
tagRepository.findOrCreate(names: string[]): Promise<Tag[]>
tagRepository.list(): Promise<Tag[]>
tagRepository.getByIds(ids: string[]): Promise<Tag[]>
```

Normalize, remove blanks, deduplicate, preserve the first display spelling, and limit a single call to six names.

- [ ] **Step 4: Implement settings repository**

```ts
export const DEFAULT_APP_SETTINGS = {
  key: 'app',
  automaticProcessing: false,
  cloudProcessingConsent: 'unknown',
} as const;
```

`settingsRepository.get()` creates a stable `clientId` with `crypto.randomUUID()` on first use. Expose:

```ts
settingsRepository.get(): Promise<AppSettings>
settingsRepository.update(patch: Partial<Pick<AppSettings, 'automaticProcessing' | 'cloudProcessingConsent'>>): Promise<AppSettings>
```

- [ ] **Step 5: Test classification descriptions and safe deletion**

Required cases:

```ts
expect((await categoryRepository.ensureDefaults()).map((item) => item.name)).toEqual(['Work', 'School', 'Personal', 'Family', 'Misc']);
await expect(categoryRepository.create({ name: 'work', description: 'A duplicate professional category description.' })).rejects.toThrow();
await expect(categoryRepository.removeAndReassign('category-misc', 'category-personal')).rejects.toThrow();
expect((await settingsRepository.get()).clientId).toBe((await settingsRepository.get()).clientId);
```

- [ ] **Step 6: Run the organization repository checks**

```powershell
npx vitest run src/lib/repositories/organizationRepositories.test.ts
```

Expected: the focused suite passes. Keep the changes uncommitted until Task 6 completes the consumer bridge.

### Task 5: Save recordings and typed rambles atomically

**Files:**
- Create: `src/lib/services/CaptureService.ts`
- Rewrite: `src/features/recorder/saveRecording.ts`
- Modify: `src/features/recorder/saveRecording.test.ts`
- Create: `src/lib/services/CaptureService.test.ts`

**Interfaces:**
- Produces: `CaptureService.saveRecording()` and `CaptureService.saveText()`

- [ ] **Step 1: Define service inputs and outputs**

```ts
export interface SaveRecordingInput {
  draft: RecordingDraft;
  processingPreference: 'automatic' | 'manual';
}

export interface SaveTextInput {
  text: string;
  processingPreference: 'automatic' | 'manual';
}

export interface SavedCapture {
  capture: CaptureSession;
  recording?: Recording;
  transcript?: Transcript;
}
```

- [ ] **Step 2: Implement atomic audio persistence**

Inside `CaptureService.saveRecording`, use one Dexie transaction over `captureSessions` and `recordings`:

```ts
const result = await db.transaction('rw', db.captureSessions, db.recordings, async () => {
  const capture = await captureRepository.create({
    source: 'audio',
    durationMs: input.draft.durationMs,
    processingPreference: input.processingPreference,
    initialState: input.processingPreference === 'automatic' ? 'queued' : 'saved',
  });
  const recording = await recordingRepository.add(capture.id, input.draft);
  await captureRepository.transition(capture.id, capture.processingState, { recordingId: recording.id });
  return { capture: { ...capture, recordingId: recording.id }, recording };
});
return result;
```

Do not call a transcription provider from this method.

- [ ] **Step 3: Implement typed capture persistence**

Trim input, reject fewer than three non-whitespace characters, then create capture and transcript in one transaction. Use provider `typed`, source `typed`, duration `0`, and state `queued` for automatic processing or `transcript_ready` for manual processing.

- [ ] **Step 4: Convert `saveRecording.ts` into a compatibility adapter**

Keep the exported filename so existing imports compile, but remove transcription modes. Export:

```ts
export async function saveRecording(input: SaveRecordingInput) {
  return CaptureService.saveRecording(input);
}
```

Sprint 3 will remove the old multi-button save behavior.

- [ ] **Step 5: Test failure atomicity**

Mock `db.recordings.add` to reject with `QuotaExceededError`, call `saveRecording`, and assert:

```ts
await expect(CaptureService.saveRecording(input)).rejects.toThrow();
expect(await db.captureSessions.count()).toBe(0);
expect(await db.recordings.count()).toBe(0);
```

Also verify automatic audio returns immediately in `queued` state with no provider mock invoked.

- [ ] **Step 6: Run the atomic-save checks**

```powershell
npx vitest run src/lib/services/CaptureService.test.ts src/features/recorder/saveRecording.test.ts
```

Expected: the focused suites pass. Keep the changes uncommitted until Task 6 completes the consumer bridge.

### Task 6: Add the persisted processing coordinator and compatibility bridge

**Files:**
- Create: `src/lib/services/ProcessingService.ts`
- Create: `src/lib/services/ProcessingService.test.ts`
- Modify: `src/lib/services/ReviewService.ts`
- Modify: `src/lib/repositories/nuggetRepository.ts`
- Modify: `src/lib/repositories/questionRepository.ts`
- Modify: `src/lib/repositories/actionItemRepository.ts`
- Modify: `src/features/recorder/HomeScreen.tsx`
- Modify: `src/features/recorder/RecorderPanel.tsx`
- Modify: `src/features/library/IdeaDetailScreen.tsx`

**Interfaces:**
- Consumes: runnable captures and a pipeline supplied by Sprint 2
- Produces: duplicate-safe in-tab coordination and transitional compilation of existing screens

- [ ] **Step 1: Define pipeline injection**

Create `ProcessingService.ts`:

```ts
export interface CapturePipeline {
  run(captureSessionId: string, signal?: AbortSignal): Promise<void>;
}

export interface ProcessCaptureOptions {
  force?: boolean;
  signal?: AbortSignal;
}

const inFlight = new Map<string, Promise<void>>();

export function createProcessingService(pipeline: CapturePipeline) {
  async function process(captureSessionId: string, options: ProcessCaptureOptions = {}) {
    const existing = inFlight.get(captureSessionId);
    if (existing && !options.force) return existing;

    const work = pipeline
      .run(captureSessionId, options.signal)
      .finally(() => inFlight.delete(captureSessionId));
    inFlight.set(captureSessionId, work);
    return work;
  }

  return {
    async enqueue(captureSessionId: string) {
      await captureRepository.transition(captureSessionId, 'queued');
    },
    process,
    async resumePending() {
      const runnable = await captureRepository.listRunnable();
      await Promise.allSettled(runnable.map((capture) => process(capture.id)));
    },
  };
}
```

Do not export a default production pipeline until Sprint 2.

- [ ] **Step 2: Test same-tab deduplication and persisted resume**

Use a deferred fake pipeline. Call `process(capture.id)` twice before resolving and assert `run` was called once. Create a queued capture, recreate the service instance, call `resumePending()`, and assert the queued ID runs.

- [ ] **Step 3: Update transitional repositories**

Rename legacy `ideaId` parameters and fields to `captureSessionId` in nugget and question repositories. In `actionItemRepository`, replace `createFromSuggestion` with final duplicate-safe `acceptSuggestion`:

```ts
export interface AcceptActionSuggestionInput {
  ideaId: string;
  sourceSuggestionId: string;
  text: string;
}

async acceptSuggestion(input: AcceptActionSuggestionInput): Promise<ActionItem> {
  const existing = await db.actionItems
    .where('[ideaId+sourceSuggestionId]')
    .equals([input.ideaId, input.sourceSuggestionId])
    .first();
  if (existing) return existing;
  const now = Date.now();
  const item: ActionItem = {
    id: crypto.randomUUID(),
    ideaId: input.ideaId,
    sourceSuggestionId: input.sourceSuggestionId,
    text: input.text,
    status: 'open',
    createdAt: now,
    updatedAt: now,
  };
  await db.actionItems.add(item);
  return item;
}
```

- [ ] **Step 4: Bridge the current UI to capture repositories**

Until Sprint 3 replaces these screens:

- `HomeScreen.tsx` loads `CaptureSession[]` through `captureRepository.listRecent()` and labels the section `Recent captures`.
- `RecorderPanel.tsx` calls `CaptureService.saveRecording()` with the setting from `settingsRepository.get()` and routes to `/idea/{capture.id}` only as a temporary compatibility URL.
- `IdeaDetailScreen.tsx` loads `captureRepository`, `recordingRepository.getByCaptureId()`, and `transcriptRepository.getCurrent()`.
- The current extraction buttons may remain as a temporary compatibility bridge, but their handlers use `captureSessionId` naming.

- [ ] **Step 5: Update ReviewService to compile against the bridge**

Replace status writes with capture transitions:

```ts
await captureRepository.transition(captureSessionId, 'organizing');
// existing legacy mock/cloud provider call
await captureRepository.transition(captureSessionId, 'ready_for_review');
```

Persist legacy nuggets/questions with `captureSessionId`. For transitional action acceptance, use `sourceSuggestionId: `${run.id}:${actionIndex}`` and the migrated/capture ID as `ideaId`; Sprint 2 replaces this review path before Sprint 3 exposes final confirmation.

- [ ] **Step 6: Run all existing tests and fix only contract mismatches**

```powershell
npm test
npm run typecheck
```

Expected: no `any` casts added to bypass the new types. Update existing fixtures to `captureSessionId`, versioned transcripts, and new action text/status.

- [ ] **Step 7: Commit the complete compiling foundation refactor**

```powershell
git diff --check
git add src/types src/lib/db src/lib/crypto src/lib/repositories src/lib/services src/features/recorder src/features/library/IdeaDetailScreen.tsx
if (Test-Path src/lib/normalization) { git add src/lib/normalization }
git commit -m "feat: establish resumable capture data foundation"
git status --short --branch
```

Expected: this commit includes Tasks 1 through 6, and its tree passes both `npm test` and `npm run typecheck` from Step 6.

### Task 7: Add pasted-text capture and close Sprint 1

**Files:**
- Create: `src/features/recorder/TextCaptureForm.tsx`
- Create: `src/features/recorder/TextCaptureForm.test.tsx`
- Modify: `src/features/recorder/HomeScreen.tsx`
- Modify: `docs/hackathon/BUILD_WEEK_EVIDENCE.md`

**Interfaces:**
- Consumes: `CaptureService.saveText()` and settings processing preference
- Produces: accessible secondary input that follows the same queue as audio

- [ ] **Step 1: Build the form contract**

Create a collapsed-by-default secondary section with:

```tsx
<button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
  Paste a ramble
</button>
```

When open, render a labeled textarea, character count, Cancel, and **Save and organize**. On submit, load settings, call `CaptureService.saveText`, call `onSaved(capture.id)`, clear the text, and report an inline error without losing input.

- [ ] **Step 2: Wire the form below the primary recorder**

`HomeScreen.tsx` keeps microphone capture visually primary. Mount `TextCaptureForm` below `RecorderPanel` and route the returned ID to the existing capture detail compatibility URL.

- [ ] **Step 3: Test validation and persistence**

Required cases:

```ts
expect(screen.getByRole('button', { name: 'Paste a ramble' })).toHaveAttribute('aria-expanded', 'false');
await user.type(screen.getByLabelText('Ramble text'), 'Plan a neighborhood tool-sharing library.');
await user.click(screen.getByRole('button', { name: 'Save and organize' }));
expect(await db.captureSessions.count()).toBe(1);
expect(await db.transcripts.count()).toBe(1);
```

Also verify a persistence failure leaves textarea content intact.

- [ ] **Step 4: Run the complete sprint gate**

```powershell
npx vitest run src/lib/db/migrations.test.ts src/lib/repositories src/lib/services/CaptureService.test.ts src/lib/services/ProcessingService.test.ts src/features/recorder/TextCaptureForm.test.tsx
npm run check
git diff --check
```

Expected: every command exits 0.

- [ ] **Step 5: Complete evidence and commit**

Fill the Sprint 1 evidence row with migration proof, local-save proof, queue test output, and the text-capture screenshot.

```powershell
git add src/features/recorder/TextCaptureForm.tsx src/features/recorder/TextCaptureForm.test.tsx src/features/recorder/HomeScreen.tsx docs/hackathon/BUILD_WEEK_EVIDENCE.md
git commit -m "feat: add typed ramble capture"
git status --short --branch
```

## Sprint 1 exit checklist

- [ ] Version-2 data migrates without losing recording, transcript, raw extraction JSON, or accepted actions.
- [ ] Capture session and idea are distinct persisted entities.
- [ ] Default categories contain strong classifier descriptions.
- [ ] Tags normalize and deduplicate.
- [ ] Audio save is atomic and does not wait for network work.
- [ ] Typed capture uses the same durable processing state.
- [ ] Runnable work survives service recreation and duplicate in-tab processing is prevented.
- [ ] Full `npm run check` passes.
- [ ] Sprint 1 evidence row is complete.
