# Nugget Mock Extraction + Review Goal

> **For Hermes / goal runner:** Execute this goal task-by-task using strict TDD.
> Stop at the earliest useful EPIC-07 slice: after a transcript exists, Steven can
> click a local/mock extraction button and review structured Nugget suggestions.

**Project root:** `/home/steven/clawd/nugget-miner`  
**Branch:** `goal/mock-extraction-review`  
**Epic:** EPIC-07 — Extraction  
**Primary tasks covered:** TASK-07-01, TASK-07-02, a minimal local-first subset of
TASK-07-03/04/05 sufficient for a testable review screen.  
**Explicitly out of scope:** cloud `/api/extract`, real LLM extraction, rate limits,
embeddings/search, exports, auth, sync, payments, and broad Actions management.

---

## Goal

Build the next testable vertical slice after real transcription:

```text
existing transcript → deterministic mock extraction → persist ExtractionRun →
materialize pending suggestions → review/accept/reject in UI
```

This should let Steven test the product's first real “Nugget-y” moment without
spending LLM tokens: turn a transcript into structured suggestions that remain
traceable to source text.

---

## Current baseline

Already on `main`:

- Browser recording works.
- Real transcription works through consent-gated `/api/transcribe`.
- Vercel env is configured for `NUGGET_TRANSCRIPTION_API_KEY` and
  `NUGGET_TRANSCRIPTION_MODEL=whisper-1`.
- Data layer currently has only `ideas`, `recordings`, and `transcripts` tables.
- Domain types currently stop at `TranscriptResult`; EPIC-07 entities still need
  implementation.

---

## Product constraints

1. **Local-first:** mock extraction runs fully in-browser and sends zero content
   over the network.
2. **AI output is suggestions:** every nugget/action/question is marked suggested
   or pending until Steven accepts it.
3. **Source-linked:** every suggestion has a `sourceSpan` pointing into
   `transcript.text`, plus a displayed source snippet.
4. **Schema-validated:** extraction output must pass a strict schema before
   persistence.
5. **No component data shortcuts:** UI components call hooks/services; services
   call repositories/providers; repositories are the only Dexie access layer.
6. **History-preserving:** re-running extraction creates a new `ExtractionRun`;
   old runs are not mutated/deleted.
7. **No live provider calls in tests.** Mock providers and mocked fetch only.

---

## Acceptance criteria

Steven can test this on Vercel or localhost:

1. Record and real-transcribe an idea, or open an existing transcribed idea.
2. On the idea detail page, click **Extract Nuggets** or **Review Suggestions**.
3. Nugget runs deterministic mock extraction locally.
4. App navigates to `/review/[ideaId]`.
5. Review screen shows:
   - run summary,
   - 2–4 suggested nuggets,
   - 1–3 suggested actions,
   - 1–2 suggested questions,
   - tags/warnings if present,
   - source snippets for each suggestion.
6. User can accept/reject/edit nuggets/questions.
7. User can accept an action suggestion and it persists as an `ActionItem` linked
   to the idea/run/source span.
8. Re-running extraction creates a new run and keeps prior accepted items.
9. Verification passes:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm audit --audit-level=moderate --omit=dev
```

---

## Implementation plan

### Task 1 — Add extraction domain types and schema validation

**Files:**

- Modify: `package.json` / `package-lock.json` — add `zod`
- Modify: `src/types/domain.ts`
- Create: `src/lib/validation/extractionResult.ts`
- Create: `src/lib/validation/extractionResult.test.ts`

**Steps:**

1. Add dependency:

   ```bash
   npm install zod
   ```

2. Extend domain types:
   - `SourceSpan`
   - `NuggetCategory`
   - `ItemStatus`
   - `ActionStatus`
   - `Priority`
   - `ExtractionPreset`
   - `JobStatus`
   - `ExtractionResult`
   - `ExtractionRun`
   - `Nugget`
   - `Question`
   - `ActionItem`

3. Implement Zod schema matching `Nugget_PRD.md` §13 / task 07-01:
   - `summary: string`
   - `nuggets[]`: title/detail/category/confidence/sourceSpan
   - `actions[]`: title/description/priority/dueDate/project/confidence/sourceSpan
   - `questions[]`: text/confidence/sourceSpan
   - `tags[]`
   - `warnings[]`
   - reject malformed shapes and confidence outside `0..1`.

4. Export:

   ```ts
   export const EXTRACTION_SCHEMA_VERSION = 'extraction-result-v1';
   export function parseExtractionResult(input: unknown): ExtractionResult;
   ```

**Tests:** valid payload parses; malformed enums/spans/confidence throw.

---

### Task 2 — Add Dexie tables and repositories

**Files:**

- Modify: `src/lib/db/index.ts`
- Create: `src/lib/repositories/extractionRunRepository.ts`
- Create: `src/lib/repositories/nuggetRepository.ts`
- Create: `src/lib/repositories/questionRepository.ts`
- Create: `src/lib/repositories/actionItemRepository.ts`
- Modify: `src/lib/repositories/index.ts`
- Modify/add repository tests

**Steps:**

1. Add Dexie version `2` tables:
   - `extractionRuns: '&id, ideaId, transcriptId, createdAt'`
   - `nuggets: '&id, ideaId, extractionRunId, status'`
   - `questions: '&id, ideaId, extractionRunId, status'`
   - `actionItems: '&id, ideaId, extractionRunId, status, priority, dueDate, *tags'`

2. Repositories set timestamps and own all table access.
3. `extractionRunRepository.create` stores `rawJson`, `summary`, `warnings`,
   `preset`, `promptVersion`, `schemaVersion`, `provider`, `status:'complete'`.
4. `latestForIdea(ideaId)` returns newest run.

**Tests:** create/list/latest/update status behavior in fake IndexedDB.

---

### Task 3 — Implement deterministic mock extraction provider

**Files:**

- Create: `src/lib/providers/extraction/types.ts`
- Create: `src/lib/providers/extraction/mockProvider.ts`
- Create: `src/lib/providers/extraction/index.ts`
- Create tests under `src/lib/providers/extraction/`

**Steps:**

1. Define `ExtractionProvider` and `ExtractionContext`.
2. Implement `mockExtractionProvider`:
   - `id: 'mock'`
   - `mode: 'mock'`
   - `isAvailable: async () => true`
   - deterministic `extract({ ideaId, transcript, context })`.
3. Use transcript text to compute real source spans:
   - first sentence = summary/note,
   - imperative-ish lines = actions,
   - question marks = questions,
   - fallback spans when transcript is short.
4. Vary result by preset:
   - `general-thought`
   - `product-idea`
   - `work-reminder`
   - `story-idea`
5. Provider output must pass `parseExtractionResult` before return.

**Tests:** deterministic, schema-valid, preset changes output, source spans are in range.

---

### Task 4 — Add local extraction/review service

**Files:**

- Create: `src/lib/services/ReviewService.ts`
- Create: `src/lib/services/ReviewService.test.ts`

**Steps:**

1. `runMockExtraction({ ideaId, preset })`:
   - load transcript,
   - set idea status `extracting`,
   - call mock provider,
   - validate result,
   - persist `ExtractionRun`,
   - materialize pending nuggets/questions,
   - keep action suggestions in run raw JSON until accepted,
   - set idea status to `reviewed` or `transcribed` with review-needed signal.
2. `acceptNugget`, `rejectNugget`, `updateNugget`.
3. `acceptQuestion`, `rejectQuestion`, `updateQuestion`.
4. `acceptAction(runId, actionIndex, edits?)` creates an open `ActionItem` linked
   to `ideaId`, `extractionRunId`, and `sourceSpan`.
5. `regenerate(ideaId, preset?)` creates a new run without deleting old runs.

**Tests:** run extraction, materialize suggestions, accept/reject/edit, accept action.

---

### Task 5 — Build review UI and wire idea detail

**Files:**

- Modify: `src/features/library/IdeaDetailScreen.tsx`
- Create: `src/app/review/[ideaId]/page.tsx`
- Create: `src/features/review/ReviewScreen.tsx`
- Create: `src/features/review/PresetSelector.tsx`
- Add tests for review screen affordances if practical

**Steps:**

1. On idea detail, if a transcript exists, show **Extract Nuggets**.
2. Default preset: `general-thought`; optionally expose preset selector.
3. Clicking **Extract Nuggets** runs mock extraction and routes to
   `/review/[ideaId]`.
4. Review screen loads latest run and suggestions.
5. Each suggestion card displays:
   - **Suggested** badge,
   - confidence/category/priority,
   - source snippet,
   - Accept/Edit/Reject.
6. Actions: accepting creates a linked open `ActionItem`; show confirmation.
7. Add **Regenerate** with preset selector.

**Browser smoke:** create/load a transcribed idea in IndexedDB, run extraction,
confirm review screen renders suggestions and source snippets.

---

## Verification commands

Run in order and fix failures before final report:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm audit --audit-level=moderate --omit=dev
```

Then run browser smoke against localhost or Vercel:

```bash
npm run dev -- -H 0.0.0.0 -p 3110
```

Expected manual test:

1. Open `http://127.0.0.1:3110/` or Vercel HTTPS.
2. Create/real-transcribe a recording.
3. Open idea detail.
4. Click **Extract Nuggets**.
5. Verify review UI appears with summary, nuggets, actions, questions, and source snippets.
6. Accept at least one action and confirm it persists after reload.

---

## Execution prompt

```text
/goal Execute the goal document at /home/steven/clawd/nugget-miner/docs/goals/2026-06-24-mock-extraction-review-goal.md.
```

---

## Final report format

Report:

- branch/commit/PR URL,
- exact product behavior implemented,
- verification command outputs,
- Vercel/local test URL,
- browser smoke result,
- known gaps explicitly left for EPIC-07 cloud extraction.
