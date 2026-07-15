# Nugget MVP Sprint Program Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a working, mobile-first Nugget MVP and complete OpenAI Build Week submission by July 21, 2026.

**Architecture:** Preserve the Next.js and Dexie local-first foundation while separating capture sessions from confirmed ideas. Persist every processing stage locally, use OpenAI transcription plus a two-stage GPT-5.6 Responses API pipeline, require editable confirmation, and finish the library, actions, export, PWA, deployment, and submission surfaces.

**Tech Stack:** Next.js 16.2.9, React 19.2.7, TypeScript 5.9.3, Dexie 4.4.4, Zod 4.4.3, OpenAI Node SDK 6.47.0, Tailwind CSS 3.4.18, Vitest 4.0.15, Testing Library 16.3.1, Playwright 1.61.1, Vercel.

## Global Constraints

- Official submission deadline: July 21, 2026 at 5:00 PM Pacific.
- Internal submission target: July 21, 2026 at 2:00 PM Pacific.
- Track: Apps for Your Life.
- Recording is the primary input; pasted text is secondary.
- Saving audio locally must complete before any network processing starts.
- One capture session may produce zero, one, or many independent ideas.
- Each confirmed idea has exactly one category and zero or more tags.
- Default categories: Work, School, Personal, Family, Misc.
- Review is mandatory for the MVP.
- GPT-5.6 use must be central, working, visible, and documented.
- Use `gpt-5.6` through the Responses API; do not retain `gpt-4o-mini` as the extraction default.
- Use structured outputs; do not parse free-form model text as the production contract.
- Use `gpt-4o-mini-transcribe` as the default transcription model.
- Store user content in IndexedDB; do not add accounts, sync, or a server-side user-content database.
- Never claim that cloud transcription or GPT processing occurs fully on-device.
- Do not promise processing while a mobile browser is fully closed.
- Self-learning, conversational onboarding, live research, native apps, push, semantic search, audio editing, and third-party integrations are out of scope.
- Use focused risk-based tests and manual verification; do not impose full TDD or an arbitrary coverage target.
- Follow the final user-supplied design system. Until it arrives, use `docs/design/NUGGET_MVP_DESIGN_AGENT_BRIEF.md` for behavior and visual direction.
- Preserve pre-event history and document work added after July 13, 2026.

---

## Source of truth

Read these files before beginning any sprint:

1. `docs/superpowers/specs/2026-07-15-nugget-mvp-hackathon-design.md`
2. `docs/design/NUGGET_MVP_DESIGN_AGENT_BRIEF.md`
3. The current sprint plan only
4. Any final design-system document the user adds to `docs/design/`

Do not use the 74 historical task files as the MVP scope. They are reference material, not the active execution plan.

## Repository starting point

- Pre-event baseline: `5394b9a`
- Approved design commit: `4c4365b`
- Working branch for execution: `codex/nugget-mvp`
- Current code shape:
  - `src/types/domain.ts` treats an `Idea` as the capture container.
  - `src/lib/db/index.ts` is at Dexie schema version 2.
  - `src/features/recorder/saveRecording.ts` blocks on transcription during save.
  - `src/lib/llm/modelClient.ts` uses Chat Completions JSON mode.
  - `src/lib/llm/modelConfig.ts` defaults extraction to `gpt-4o-mini`.
  - `src/features/review/ReviewScreen.tsx` reviews nuggets inside one idea rather than several idea candidates.
  - `src/lib/repositories/actionItemRepository.ts` can accept the same generated action repeatedly.
  - No PWA, library route, Actions route, settings route, search, export, CI, or end-to-end suite exists.

## Execution order and dependencies

```text
Sprint 0: baseline and readiness
    ↓
Sprint 1: capture/data/queue foundation
    ↓
Sprint 2: GPT-5.6 engine and evaluations
    ↓
Sprint 3: capture, processing, and review UI
    ↓
Sprint 4: library, actions, categories, settings, export
    ↓
Sprint 5: PWA, security, E2E, production deployment
    ↓
Sprint 6: evidence, README, demo, Devpost submission
```

Sprint 3 visual component work may begin after Sprint 1 interfaces stabilize, but it may not redefine the data contracts. Sprint 6 documentation can be drafted early, but screenshots, model metadata, and demo statements must be verified against the final deployed application.

## Sprint documents

| Sprint | Plan | Required exit |
|---|---|---|
| 0 | `docs/superpowers/plans/2026-07-15-nugget-mvp-sprint-0-baseline.md` | Baseline documented; current app builds and passes existing checks |
| 1 | `docs/superpowers/plans/2026-07-15-nugget-mvp-sprint-1-foundation.md` | Durable capture, migration, categories, queue, and text capture work |
| 2 | `docs/superpowers/plans/2026-07-15-nugget-mvp-sprint-2-intelligence.md` | Real two-stage GPT-5.6 extraction meets evaluation gates |
| 3 | `docs/superpowers/plans/2026-07-15-nugget-mvp-sprint-3-capture-review.md` | Mobile capture through confirmation works end to end |
| 4 | `docs/superpowers/plans/2026-07-15-nugget-mvp-sprint-4-organization.md` | Ideas are searchable, editable, actionable, configurable, and exportable |
| 5 | `docs/superpowers/plans/2026-07-15-nugget-mvp-sprint-5-hardening.md` | Installable deployed build passes focused automation and real-device checks |
| 6 | `docs/superpowers/plans/2026-07-15-nugget-mvp-sprint-6-submission.md` | Repository, deployment, video, and Devpost submission tell the same story |

## Cross-sprint interface contract

The following names are stable across all plans. Do not rename them in one sprint without updating every later plan in the same commit.

```ts
type ProcessingState =
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

type ContentBasis = 'explicit' | 'inferred' | 'suggested';
type IdeaStatus = 'draft' | 'confirmed' | 'archived';

interface ProcessingError {
  stage: 'transcription' | 'segmentation' | 'organization' | 'persistence';
  code: string;
  message: string;
  retryable: boolean;
  occurredAt: number;
}

interface ProcessCaptureOptions {
  force?: boolean;
  signal?: AbortSignal;
}

interface SearchIdeasInput {
  query?: string;
  categoryId?: string;
  tagIds?: string[];
  includeArchived?: boolean;
}
```

Stable service signatures:

```ts
captureRepository.create(input: CreateCaptureInput): Promise<CaptureSession>
captureRepository.getById(id: string): Promise<CaptureSession | undefined>
captureRepository.listRecent(limit?: number): Promise<CaptureSession[]>
captureRepository.listRunnable(): Promise<CaptureSession[]>
captureRepository.transition(id: string, state: ProcessingState, patch?: CapturePatch): Promise<void>

recordingRepository.add(captureSessionId: string, draft: RecordingDraft): Promise<Recording>
recordingRepository.getByCaptureId(captureSessionId: string): Promise<Recording | undefined>

transcriptRepository.createVersion(captureSessionId: string, result: TranscriptResult): Promise<Transcript>
transcriptRepository.getCurrent(captureSessionId: string): Promise<Transcript | undefined>
transcriptRepository.updateText(captureSessionId: string, text: string): Promise<Transcript>

ProcessingService.enqueue(captureSessionId: string): Promise<void>
ProcessingService.process(captureSessionId: string, options?: ProcessCaptureOptions): Promise<void>
ProcessingService.resumePending(): Promise<void>

ideaRepository.listDraftsByCapture(captureSessionId: string): Promise<Idea[]>
ideaRepository.confirm(id: string, input: ConfirmIdeaInput): Promise<Idea>
ideaRepository.search(input: SearchIdeasInput): Promise<Idea[]>

categoryRepository.ensureDefaults(): Promise<Category[]>
categoryRepository.list(): Promise<Category[]>
categoryRepository.create(input: CreateCategoryInput): Promise<Category>
categoryRepository.update(id: string, patch: UpdateCategoryInput): Promise<Category>
categoryRepository.removeAndReassign(id: string, replacementId: string): Promise<void>

actionItemRepository.acceptSuggestion(input: AcceptActionSuggestionInput): Promise<ActionItem>
actionItemRepository.setStatus(id: string, status: 'open' | 'completed'): Promise<void>
```

## Processing idempotency

Every processing stage uses this deterministic key:

```ts
function processingKey(input: {
  captureSessionId: string;
  transcriptHash: string;
  stage: 'segmentation' | 'organization';
  schemaVersion: string;
}) {
  return [input.captureSessionId, input.transcriptHash, input.stage, input.schemaVersion].join(':');
}
```

Confirmed ideas are never overwritten by a retry. Generated action suggestions have stable IDs, and acceptance is unique on `[ideaId+sourceSuggestionId]`.

## Verification policy

Each sprint must end with:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
git diff --check
git status --short
```

Sprint-specific tests may run before the full suite. Live model evaluations are intentionally separate from `npm test` and run only with an API key:

```powershell
npm run eval:live
```

Do not add snapshot tests for visual markup. Test data preservation, schema contracts, state transitions, duplicate prevention, user-visible recovery, and the three critical browser paths.

## Git and review discipline

At execution start:

```powershell
git switch -c codex/nugget-mvp
```

If the execution environment uses a worktree, create it through `superpowers:using-git-worktrees` instead of switching the shared workspace directly.

Rules:

- One reviewable commit per task unless the task explicitly names two checkpoints.
- Never combine unrelated cleanup with MVP work.
- Never rewrite or delete the baseline commit history.
- Do not stage user design-system work until its scope is understood.
- At every sprint exit, record the exact commands and results in the sprint handoff.

## Daily target schedule

| Date | Target |
|---|---|
| July 15 | Sprint 0 complete; Sprint 1 started |
| July 16 | Sprint 1 complete; Sprint 2 core pipeline working |
| July 17 | Sprint 2 evaluation gate complete; Sprint 3 started |
| July 18 | Sprint 3 complete |
| July 19 | Sprint 4 complete |
| July 20 | Sprint 5 complete; feature freeze by 6:00 PM Pacific |
| July 21 | Sprint 6 only; submit by 2:00 PM Pacific |

After the July 20 feature freeze, only fixes for the primary demo, data safety, deployment, or submission accuracy are allowed.

## Stop-the-line conditions

Stop adding features and fix the issue when any of these is true:

- A saved recording is lost after refresh.
- Retrying produces duplicate ideas or actions.
- A model output bypasses schema validation.
- An `explicit` field lacks a valid transcript source span.
- The app displays cloud processing as local-only.
- The production build or deployment fails.
- The three-minute demo cannot follow the deployed interface without editing the story.
- The remaining time is under 12 hours and the core record-to-library flow is not stable.

## Approved fallback order

If schedule pressure requires cuts, cut in this order without another product decision:

1. Desktop-specific layout refinements beyond responsive usability.
2. Web Share integration; keep copy and export.
3. Advanced category colors/icons.
4. Pause/resume recording; keep start and stop/save.
5. Full-data Markdown export; keep JSON full export and single-idea Markdown.
6. Non-critical animations; keep reduced-motion-safe static status.

Do not cut local save, real transcription, GPT-5.6 separation, rich organization, confirmation, library search, category management, duplicate prevention, truthful privacy, deployment, or submission evidence.

## Terra execution prompt

Use this prompt when handing a sprint to Terra:

```text
Implement the first incomplete Nugget MVP sprint from the exact plan paths in the Sprint documents table above.

Before editing, read:
1. C:\projects\nugget-miner\docs\superpowers\specs\2026-07-15-nugget-mvp-hackathon-design.md
2. C:\projects\nugget-miner\docs\superpowers\plans\2026-07-15-nugget-mvp-sprint-index.md
3. The first incomplete sprint plan in full
4. C:\projects\nugget-miner\docs\design\NUGGET_MVP_DESIGN_AGENT_BRIEF.md for any UI task
5. Any newer user design-system file under C:\projects\nugget-miner\docs\design

Use superpowers:executing-plans. Work task-by-task and stop at the sprint exit gate. This project uses focused risk-based tests, not full TDD. Preserve unrelated user changes. Do not pull features forward from a later sprint unless the current plan explicitly requires an interface for them.

At handoff, report:
- commits created
- files changed
- verification commands and exact results
- manual checks completed
- screenshots/evidence produced
- remaining risks or deviations
- whether every sprint exit criterion is met
```

## Final completion gate

Do not call the MVP complete until:

- A real phone can record and locally save without an account.
- Reopening resumes queued work.
- A real GPT-5.6 run produces multiple grounded ideas from one ramble.
- The user can edit and confirm those ideas.
- Confirmed ideas are searchable, filterable, actionable, and exportable.
- Offline capture, PWA install, security checks, build, and deployed smoke test pass.
- README, demo video, repository, application, and Devpost description agree.
