# Nugget Real LLM Extraction Goal

> **For Hermes / goal runner:** Execute this goal task-by-task using strict TDD.
> Stop at the first deployable slice where Steven can record/transcribe audio, send transcript text through a consent-gated server-only LLM route, and review schema-valid suggestions.

## Goal

Implement the EPIC-07 M5 real extraction path:

```text
transcript → explicit consent → /api/extract → server-only LLM call → Zod-validated ExtractionResult → Review screen
```

## Project root

```text
/home/steven/clawd/nugget-miner
```

## Branch

```text
goal/real-llm-extraction
```

## Constraints

- Keep local mock extraction fully working.
- No model/API keys in client bundles, IndexedDB, localStorage, docs, logs, or test snapshots.
- Server route must not persist transcript text or raw provider output server-side.
- Model output is untrusted until `parseExtractionResult` accepts it.
- Unit tests must mock `fetch`; no live model calls in tests.
- Browser smoke should use seeded IndexedDB data, not real secrets.
- Vercel env can use existing server-side keys; copy only minimum needed feature-specific variables.

## Environment variables

Preferred:

```text
NUGGET_LLM_API_KEY
NUGGET_LLM_BASE_URL
NUGGET_LLM_MODEL
NUGGET_LLM_TIMEOUT_MS
NUGGET_LLM_MAX_INPUT_CHARS
```

Fallbacks:

```text
OPENAI_API_KEY
OPENAI_BASE_URL
OPENAI_MODEL
NUGGET_TRANSCRIPTION_API_KEY
```

Default model:

```text
gpt-4o-mini
```

## Implementation tasks

### Task 1 — Server-only LLM layer

Create:

- `src/lib/llm/errors.ts`
- `src/lib/llm/structuredOutput.ts`
- `src/lib/llm/extractionPrompts.ts`
- `src/lib/llm/promptRegistry.ts`
- `src/lib/llm/modelConfig.ts`
- `src/lib/llm/modelClient.ts`
- `src/lib/llm/index.ts`

Acceptance:

- Prompt registry returns stable versions for all extraction presets.
- Prompt builders include schema-critical fields and source-span rules.
- Structured parser rejects malformed JSON.
- Model client uses OpenAI-compatible chat completions with mocked `fetch` tests.
- Provider/model errors are sanitized.

### Task 2 — `/api/extract` route

Create:

- `src/app/api/extract/route.ts`
- `src/app/api/extract/route.test.ts`

Acceptance:

- `GET /api/extract` returns sanitized public config.
- `POST /api/extract` validates transcript/preset/input size.
- Missing key returns safe `503 provider_not_configured`.
- Invalid model JSON returns safe `502 invalid_model_output`.
- Valid model JSON returns `ExtractionResult`, provider, model, promptVersion.

### Task 3 — Cloud extraction provider

Create/modify:

- `src/lib/providers/extraction/cloudProvider.ts`
- `src/lib/providers/extraction/index.ts`
- tests for cloud provider and registry

Acceptance:

- Provider reports availability from route config.
- Provider posts transcript/context to `/api/extract`.
- Provider requires explicit consent from caller.
- Provider supports `AbortSignal`.
- Errors are typed/sanitized.

### Task 4 — ReviewService integration

Modify:

- `src/lib/services/ReviewService.ts`
- `src/lib/services/ReviewService.test.ts`

Acceptance:

- `runCloudExtraction` reuses existing persistence flow.
- Stored `ExtractionRun.provider` is `cloud` or route provider id.
- Stored `promptVersion` comes from route/model response.
- Failures mark idea `failed` without partial persisted suggestions.

### Task 5 — Review UI path

Modify:

- `src/features/library/IdeaDetailScreen.tsx`
- `src/features/review/ReviewScreen.tsx`
- add tests where practical

Acceptance:

- Idea detail offers **Extract Nuggets** and **Extract with LLM**.
- LLM extraction opens explicit consent before transcript leaves browser.
- If provider unavailable, UI shows provider-not-configured message and mock extraction remains usable.
- Review page still supports regenerate mock extraction.

### Task 6 — Docs, env, deploy

Modify/create:

- `docs/deployment/vercel-env.md`
- `README.md`

Acceptance:

- Docs explain `NUGGET_LLM_*` env variables and fallback behavior.
- Set Vercel `NUGGET_LLM_API_KEY` for production/preview/development using existing OpenAI-compatible server-side key if available.
- Deploy preview/prod as appropriate.

## Verification commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm audit --audit-level=moderate --omit=dev
```

## Browser smoke

1. Start local server on `3110`.
2. Seed IndexedDB with a transcribed idea.
3. Open `/idea/[ideaId]`.
4. Verify both extraction buttons render.
5. Run mock extraction and verify `/review/[ideaId]` still works.
6. In browser JS, mock `/api/extract` if needed or verify production `/api/extract` config endpoint.
7. Verify no console errors.

## Execution prompt

```text
Execute the goal document at /home/steven/clawd/nugget-miner/docs/goals/2026-06-24-real-llm-extraction-goal.md.
```

## Final report format

- Branch, commit, PR URL.
- Main/prod merge status for prior PR.
- Preview/prod URL.
- Vercel env status sanitized.
- Test/build/audit evidence.
- Browser smoke evidence.
- Exact steps for Steven to test real extraction.
