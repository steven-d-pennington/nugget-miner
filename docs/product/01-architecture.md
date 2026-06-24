# Nugget — Architecture & Engineering Conventions

> The shared technical contract for every task. Tasks assume this stack, this
> folder layout, these service interfaces, and these conventions. Where a task
> conflicts with this doc, this doc wins unless the task explicitly overrides it.

---

## 1. Technology stack (fixed for MVP)

| Concern | Choice | Notes |
| --- | --- | --- |
| Framework | **Next.js (App Router)** + React 18 + **TypeScript strict** | PRD §15 assumption; `strict: true`, `noUncheckedIndexedAccess: true`. |
| Styling | **Tailwind CSS** + CSS variables for theme tokens | Dark-mode-first; minimal custom controls (PRD §14, §24). |
| Local DB | **Dexie** over IndexedDB | Repository layer wraps it (PRD §11/§12). |
| Validation | **Zod** | Validate all extraction results and import payloads before persist (PRD §24). |
| Client state | **Zustand** (small stores) + React hooks | Used for recorder + processing-queue cross-cutting state. Server-route calls use `fetch`. |
| PWA / SW | **Serwist** (`@serwist/next`) | App-shell precache + runtime caching; offline support (NFR-004). |
| Audio | **MediaRecorder** + Web Audio `AnalyserNode` | Capture + level meter (FR-103). |
| IDs | `crypto.randomUUID()` | Ordering via `createdAt` indexes, not ID. |
| Testing | **Vitest** + React Testing Library + **fake-indexeddb** + **Playwright** (e2e/offline) + **axe-core** (a11y) | PRD §20. |
| Lint/format | ESLint (next/core-web-vitals, @typescript-eslint) + Prettier | Enforced in CI. |
| Package manager | npm | Lockfile committed. |

**Not in MVP** (PRD §24): analytics SDKs, auth, payments, cloud sync,
provider-specific client SDKs. Cloud providers are reached only through our own
Next.js API routes.

## 2. Folder structure

```
src/
  app/                      # Next.js App Router routes (thin; UI composition only)
    (onboarding)/onboarding/
    page.tsx                # Home / Inbox
    library/
    idea/[ideaId]/
    review/[ideaId]/
    actions/
    settings/
    api/
      transcribe/route.ts
      extract/route.ts
      health/route.ts
  components/               # Reusable presentational components (no DB access)
  features/                 # Feature modules (compose components + hooks + services)
    recorder/
    library/
    review/
    actions/
    search/
    settings/
  hooks/                    # React hooks wrapping services (e.g. useRecorder, useProcessingQueue)
  lib/
    db/                     # Dexie instance, schema versions, migrations
    repositories/           # One repository per aggregate (ideaRepository, etc.)
    services/               # RecorderService, ProcessingQueue, ReviewService, ExportService, SearchService
    providers/              # transcription/ and extraction/ adapters (mock + real)
    llm/                    # Server-only model client, prompt registry, structured JSON helpers
    validation/             # Zod schemas (extractionResult, importPayload, ...)
    privacy/                # consent + privacy-mode helpers
  types/                    # Domain types (Idea, Recording, Transcript, ...)
  test/
    fixtures/               # Shared fixtures (PRD §24)
    helpers/
```

### Layering rules (enforced by review + lint where possible)

1. **Components never touch Dexie or `fetch`.** They receive data via hooks/props.
2. **Hooks call services; services call repositories/providers.** No repository
   logic inside components or routes.
3. **Repositories are the only code that imports the Dexie instance.**
4. **Providers are reached only through their interface** (`TranscriptionProvider`,
   `ExtractionProvider`) — never imported concretely by UI.
5. **API routes are thin**: validate input (size/type/Zod), call provider or the
   server-only LLM layer, sanitize errors, return typed JSON. No persistence
   (PRD §13/§15).

## 3. Core service contracts

These interfaces are defined once in `lib/services` / `lib/providers` and are the
seams every epic plugs into. Tasks must not change a signature without updating
this doc.

```ts
// lib/services/RecorderService.ts
type RecorderState =
  | 'idle' | 'requesting-permission' | 'recording'
  | 'paused' | 'stopping' | 'error';

interface RecorderService {
  readonly state: RecorderState;
  start(): Promise<void>;          // requests mic permission on first call (FR-002)
  pause(): void;                   // FR-106 (best-effort)
  resume(): void;
  stop(): Promise<RecordingDraft>; // returns blob + metadata, not yet persisted
  cancel(): void;
  onLevel(cb: (rms: number) => void): () => void; // FR-103
}

interface RecordingDraft {
  blob: Blob; mimeType: string; durationMs: number;
  sizeBytes: number; waveformPreview: number[];
}
```

```ts
// lib/providers/transcription.ts  (PRD §12)
type ProviderMode = 'mock' | 'local' | 'browser' | 'cloud';

interface TranscriptionProvider {
  id: string;
  label: string;
  mode: ProviderMode;
  isAvailable(): Promise<boolean>;
  transcribe(input: {
    ideaId: string; recordingId: string; audioBlob: Blob;
    signal?: AbortSignal;
  }): Promise<TranscriptResult>;
}

interface TranscriptResult {
  text: string;
  segments?: { start: number; end: number; text: string }[];
  language?: string;
  confidence?: number;
  provider: string;
}
```

```ts
// lib/providers/extraction.ts  (PRD §12/§13)
interface ExtractionProvider {
  id: string;
  label: string;
  mode: 'mock' | 'local' | 'cloud';
  isAvailable(): Promise<boolean>;
  extract(input: {
    ideaId: string; transcript: string;
    context?: ExtractionContext; signal?: AbortSignal;
  }): Promise<ExtractionResult>;   // validated with Zod before persist
}

interface ExtractionContext {
  preset: 'product-idea' | 'work-reminder' | 'story-idea' | 'general-thought';
}
```

```ts
// lib/services/ProcessingQueue.ts  (PRD §12)
interface ProcessingQueue {
  enqueue(job: { ideaId: string; type: 'transcription' | 'extraction';
                 providerId: string }): Promise<string>; // returns jobId
  cancel(jobId: string): Promise<void>;
  retry(jobId: string): Promise<void>;
  subscribe(cb: (jobs: ProcessingJob[]) => void): () => void;
}
```

`ReviewService` converts a raw `ExtractionRun` into pending items and persists
accepted ones. `ExportService` produces Markdown/JSON. `SearchService` maintains
and queries the local index. Full signatures live in their epic task docs.

## 4. Processing pipeline flow

```
Recorder ──save──▶ Idea + Recording
                        │  "Save & Process" or Detail ▶ Process
                        ▼
              ProcessingQueue.enqueue(transcription)
                        ▼  (consent gate if provider.mode === 'cloud')
              TranscriptionProvider.transcribe ─▶ Transcript
                        ▼
              ProcessingQueue.enqueue(extraction)
                        ▼  (consent gate if cloud)
              ExtractionProvider.extract ─▶ Zod validate ─▶ ExtractionRun(raw)
                        ▼
              ReviewService ─▶ pending Nuggets/Actions/Questions
                        ▼  user accepts/edits
              Accepted records (linked to sourceSpan)
```

Failures at any step leave prior artifacts intact and surface a retry (NFR-007).

## 5. Error & result conventions

- Repository/service methods return typed results and **throw typed errors**
  (`NuggetError` subclasses: `StorageError`, `ProviderError`, `ValidationError`,
  `ConsentRequiredError`). UI maps these to trust-preserving copy (§7 of product spec).
- API routes never leak provider/internal details; they return
  `{ error: { code, message } }` with sanitized messages (PRD §15).
- No `console.log` of transcript/audio content anywhere, client or server (PRD §15).

## 6. Privacy & security guardrails (binding; PRD §15)

- Default `processingMode = 'local'`. No network call to a content endpoint
  without passing the consent gate (`lib/privacy/consent.ts`).
- No API keys in client code/bundles/storage. Keys live only in server env vars
  read inside `app/api/**`.
- API routes validate payload size + MIME type before processing.
- Local-only flows must produce **zero** network requests — covered by a privacy
  test (EPIC-11).

## 7. Testing conventions

- Co-locate unit tests as `*.test.ts(x)` next to source.
- Repositories tested against `fake-indexeddb`.
- Providers tested via their interface with the mock adapter as the reference
  implementation.
- Each P0 acceptance criterion (PRD §17) maps to at least one integration or e2e
  test; see EPIC-11 coverage map.
- Fixtures from `src/test/fixtures` are the single source of sample data.

## 8. Definition of "agent-ready" task

Every task doc in `docs/tasks/**` includes: objective, dependencies, the exact
files to create/modify, the contracts it touches, step-by-step approach,
testable acceptance criteria, test requirements, and explicit out-of-scope. An
agent should be able to complete a task end-to-end without product clarification
by reading the task + these three product docs.
</content>
