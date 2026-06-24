# Nugget Browse + Record Transcript Goal

> **For Hermes / goal runner:** Execute this document task-by-task. Stop at the
> earliest useful product slice: a locally browsable app that can capture a voice
> recording and persist/show a deterministic mock transcript. Do **not** expand
> into the full PRD yet.

**Goal:** Build the first working Nugget vertical slice: browse to the app, record
a short audio note, save it locally, run mock transcription, and view the saved
transcript.

**Architecture:** Use the documented MVP stack: Next.js App Router, React,
TypeScript strict, Tailwind, Dexie/IndexedDB, MediaRecorder, and a deterministic
mock transcription provider. Keep the implementation local-only: no cloud model
calls, no auth, no analytics, no sync, no provider SDKs.

**Tech Stack:** Next.js App Router, React 18, TypeScript strict, Tailwind CSS,
Dexie, MediaRecorder/Web Audio, Vitest/React Testing Library where practical.

**Project root:** `/home/steven/clawd/nugget-miner`

**Working branch:** `goal/browse-record-transcript`

---

## Execution Prompt

If launching via a `/goal` command or goal runner, use this prompt:

```text
/goal Execute the goal document at /home/steven/clawd/nugget-miner/docs/goals/2026-06-24-browse-record-transcript-goal.md.

Work only inside /home/steven/clawd/nugget-miner. Use the current branch goal/browse-record-transcript. Do not push. Local commits are allowed only after tests/build pass. Read Nugget_PRD.md, docs/tasks/README.md, docs/product/00-product-spec.md, docs/product/01-architecture.md, docs/product/02-data-model.md, docs/product/03-ux-guidelines.md, and docs/product/04-llm-layer.md before coding.

Scope is intentionally the earliest browsable vertical slice, not the full PRD: scaffold the app, implement a local-only recorder, persist Idea/Recording/Transcript in Dexie, run deterministic mock transcription, and show the transcript on an idea detail screen. No cloud routes, no real LLM calls, no API keys, no analytics, no auth, no payments, no sync. Verify with npm scripts and a local browser/dev-server smoke. Final report must include changed files, commands run with exit codes, local URL, and whether a human can record and view a transcript.
```

If executing in this same chat instead of a goal runner, Steven can say:

```text
Execute the Nugget browse + record transcript goal document now.
```

---

## Non-Negotiable Safety / Scope Constraints

- Do **not** push to GitHub.
- Do **not** add auth, payments, analytics, cloud sync, telemetry, or external API
  provider SDKs.
- Do **not** read, print, or require secrets/API keys.
- Do **not** implement `/api/transcribe` or `/api/extract` yet.
- Do **not** call a real LLM/transcription provider. Transcript output is mock and
  deterministic for now.
- Do **not** log audio blobs or transcript content except in explicit user-facing UI.
- Keep local-only flows network-clean for content endpoints.
- Prefer small, reviewable commits; no broad unrelated cleanup.

---

## Product Docs to Treat as Binding

Read these before implementation:

- `Nugget_PRD.md`
- `docs/tasks/README.md`
- `docs/product/00-product-spec.md`
- `docs/product/01-architecture.md`
- `docs/product/02-data-model.md`
- `docs/product/03-ux-guidelines.md`
- `docs/product/04-llm-layer.md`
- Relevant task docs:
  - `docs/tasks/EPIC-01-pwa-foundation/TASK-01-01-scaffold-project.md`
  - `docs/tasks/EPIC-01-pwa-foundation/TASK-01-02-theme-and-layout.md`
  - `docs/tasks/EPIC-01-pwa-foundation/TASK-01-03-routing-and-nav.md`
  - `docs/tasks/EPIC-02-local-data-layer/TASK-02-01-domain-types.md`
  - `docs/tasks/EPIC-02-local-data-layer/TASK-02-02-dexie-schema-migrations.md`
  - `docs/tasks/EPIC-02-local-data-layer/TASK-02-04-idea-recording-transcript-repos.md`
  - `docs/tasks/EPIC-03-recorder/TASK-03-01-recorder-service.md`
  - `docs/tasks/EPIC-03-recorder/TASK-03-04-recorder-screen.md`
  - `docs/tasks/EPIC-03-recorder/TASK-03-05-persist-recording.md`
  - `docs/tasks/EPIC-06-transcription/TASK-06-02-mock-adapter.md`
  - `docs/tasks/EPIC-06-transcription/TASK-06-03-persist-and-chain.md`
  - `docs/tasks/EPIC-06-transcription/TASK-06-04-editable-transcript-ui.md`

---

## Definition of Done

This goal is done at the **earliest stage** where Steven can browse to the app and
record/view a transcript:

1. `npm install` succeeds and commits a lockfile.
2. `npm run dev -- -H 0.0.0.0 -p 3100` starts a browsable app.
3. Visiting `http://127.0.0.1:3100/` shows Nugget with a clear Record CTA and
   local-only privacy language.
4. User can start recording from the browser, grant mic permission, see active
   recording state/timer/level feedback, then stop.
5. User can choose **Save & Mock Transcribe**.
6. The app persists at least:
   - `Idea` metadata,
   - `Recording` blob/metadata,
   - `Transcript` text/provider metadata.
7. The app navigates to an idea detail page showing playback metadata and the
   transcript text.
8. The transcript is deterministic mock output and clearly labeled as mock/local.
9. Refreshing the app still shows the saved idea/transcript from IndexedDB.
10. Local verification commands pass:
    - `npm run typecheck`
    - `npm run lint`
    - `npm test`
    - `npm run build`
11. A browser smoke test verifies the page loads and the main controls render.
    If microphone automation is unavailable in headless browser, document that
    limitation and still verify the UI path plus manual-ready state.

---

## Implementation Tasks

### Task 1 — Scaffold the app shell

**Objective:** Create the runnable Next.js/TypeScript/Tailwind project foundation.

**Files:**

- Create: `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.mjs`,
  `tailwind.config.ts`, `postcss.config.mjs`, `.eslintrc.*`, `.prettierrc`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

**Acceptance:** `npm run typecheck`, `npm run lint`, and `npm run build` can run
against the initial app shell.

### Task 2 — Add domain types and Dexie persistence slice

**Objective:** Implement only the data model needed for the vertical slice while
matching canonical field names.

**Files:**

- Create: `src/types/{index,domain}.ts`
- Create: `src/lib/db/{index,schema}.ts`
- Create: `src/lib/repositories/{ideaRepository,recordingRepository,transcriptRepository}.ts`

**Acceptance:** A unit test can create an Idea + Recording + Transcript and read
them back from fake IndexedDB or a mocked repository boundary.

### Task 3 — Build RecorderService and recording UI

**Objective:** Let a user record, stop, and retain a `RecordingDraft` in the UI.

**Files:**

- Create: `src/lib/services/RecorderService.ts`
- Create: `src/hooks/useRecorder.ts`
- Create: `src/features/recorder/RecorderPanel.tsx`
- Modify: `src/app/page.tsx`

**Acceptance:** UI shows idle/recording/stopped/error states, timer, level meter,
and Save / Save & Mock Transcribe / Discard after stop.

### Task 4 — Persist recording and mock transcript

**Objective:** Save the recording locally and generate a deterministic transcript.

**Files:**

- Create: `src/lib/providers/transcription/mockProvider.ts`
- Create: `src/features/recorder/saveRecording.ts`
- Modify: `src/features/recorder/RecorderPanel.tsx`

**Acceptance:** Save & Mock Transcribe creates an Idea, Recording, and Transcript;
then routes to `/idea/[ideaId]`.

### Task 5 — Show idea detail and editable transcript surface

**Objective:** Let the user view the saved idea and transcript after recording.

**Files:**

- Create: `src/app/idea/[ideaId]/page.tsx`
- Create: `src/features/library/IdeaDetailScreen.tsx`
- Create: `src/components/AudioPlayer.tsx` if practical for blob playback

**Acceptance:** Detail page loads from IndexedDB, shows transcript, indicates mock
provider, and survives refresh.

### Task 6 — Tests, polish, and browser smoke

**Objective:** Prove the vertical slice is usable and not just compiled confetti.

**Files:**

- Create/modify tests as needed under `src/**/*.test.ts(x)`
- Optional: `e2e/smoke.spec.ts` if Playwright is lightweight enough

**Commands:**

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run dev -- -H 0.0.0.0 -p 3100
```

**Acceptance:** Commands pass. Browser smoke verifies Home renders, Record control
exists, and idea-detail route code is reachable. If automated mic recording is
not possible, report manual mic verification steps and exact local URL.

---

## Final Report Format

Return a concise report with:

- **Status:** SUCCESS / PARTIAL / BLOCKED
- **Local URL:** e.g. `http://127.0.0.1:3100/`
- **What works:** one-paragraph vertical-slice summary
- **Verification:** command → exit code / result
- **Browser smoke:** what was loaded/clicked/observed
- **Changed files:** grouped by docs, app, tests
- **Known limitations:** especially mock transcript and mic/headless limitations
- **Next recommended goal:** usually full EPIC-01/02 hardening or EPIC-03 recorder completion
