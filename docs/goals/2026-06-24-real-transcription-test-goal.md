# Nugget Real Transcription Test Goal

> **For Hermes / goal runner:** Implement this goal task-by-task using strict TDD.
> Stop at the earliest stage where Steven can deploy/open Nugget, record audio,
> explicitly consent to cloud processing, and see a real provider transcript. Do
> **not** expand into extraction/nugget review/search/export yet.

**Goal:** Replace the current mock-only transcription path with a testable real
cloud transcription path, while keeping mock transcription available and preserving
Nugget's privacy-first consent boundary.

**Architecture:** Add a server-only `/api/transcribe` route that reads provider
credentials from Vercel/server env only, validates audio before processing, calls
an OpenAI-compatible transcription endpoint, returns a typed `TranscriptResult`,
and never persists or logs audio/transcript content on the server. The browser
adapter sends the local recording Blob only after a contextual consent modal
confirms the cloud send. The client persists the returned transcript in IndexedDB
using the existing repositories.

**Tech Stack:** Next.js App Router, React, TypeScript strict, Dexie/IndexedDB,
MediaRecorder, Zod or small runtime validators, Vitest/React Testing Library,
Vercel server env vars.

**Project root:** `/home/steven/clawd/nugget-miner`

**Current production app:** `https://nugget-miner-kappa.vercel.app/`

---

## Execution Prompt

If launching via `/goal` or a goal runner, use this prompt:

```text
/goal Execute the goal document at /home/steven/clawd/nugget-miner/docs/goals/2026-06-24-real-transcription-test-goal.md.

Work inside /home/steven/clawd/nugget-miner. Start from latest origin/main. Create a feature branch named goal/real-transcription-test. Use strict TDD: write failing tests before production code, watch them fail, implement minimal code, then verify green. Do not push or deploy until all local verification passes.

Scope is the earliest testable real transcription slice: keep existing mock transcription, add a server-only /api/transcribe route, add a cloud transcription provider, add a consent modal/gate before any audio leaves the browser, wire the recording UI to allow Save & Real Transcribe, persist returned transcripts locally, deploy to Vercel, and verify HTTPS + getUserMedia + route behavior. Use only server/Vercel env vars for provider credentials. Never print, commit, or expose secrets. If Vercel has no usable transcription env vars, implement the disabled/config-missing state and report the exact env var names needed rather than hardcoding anything.
```

If executing in the current Hermes chat instead, Steven can say:

```text
Execute the Nugget real transcription test goal now.
```

---

## Important Current Discovery

As of goal creation, `vercel env ls` for the `nugget-miner` project returned:

```text
No Environment Variables found for steven-penningtons-projects/nugget-miner
```

So the implementation must support Vercel env usage, but it should also handle
"not configured yet" gracefully. Do **not** fabricate credentials and do **not**
print secret values. If env vars are added before/during execution, pull them with
Vercel CLI only into ignored local files:

```bash
vercel env ls
vercel env pull .env.local
```

`.env.local` is ignored and must never be committed or pasted into logs.

### Supported env var names

Implement the config resolver with these names, in this priority order:

| Purpose | Preferred | Compatible fallback | Default |
| --- | --- | --- | --- |
| API key | `NUGGET_TRANSCRIPTION_API_KEY` | `OPENAI_API_KEY` | none — provider unavailable |
| Base URL | `NUGGET_TRANSCRIPTION_BASE_URL` | `OPENAI_BASE_URL` | `https://api.openai.com/v1` |
| Model | `NUGGET_TRANSCRIPTION_MODEL` | `OPENAI_TRANSCRIPTION_MODEL` | `whisper-1` |
| Timeout | `NUGGET_TRANSCRIPTION_TIMEOUT_MS` | none | `60000` |
| Max upload bytes | `NUGGET_TRANSCRIPTION_MAX_BYTES` | none | `26214400` |

The route should use OpenAI-compatible multipart transcription semantics:

```http
POST {baseUrl}/audio/transcriptions
Authorization: Bearer [REDACTED]
Content-Type: multipart/form-data
file=<audio blob>
model=<model>
response_format=json
```

If a different Vercel-defined provider key is present, prefer adding it to this
resolver deliberately and documenting the exact mapping; do not rely on implicit
magic.

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
- `docs/tasks/EPIC-06-transcription/README.md`
- `docs/tasks/EPIC-06-transcription/TASK-06-01-provider-contract-registry.md`
- `docs/tasks/EPIC-06-transcription/TASK-06-02-mock-adapter.md`
- `docs/tasks/EPIC-06-transcription/TASK-06-03-persist-and-chain.md`
- `docs/tasks/EPIC-06-transcription/TASK-06-04-editable-transcript-ui.md`
- `docs/tasks/EPIC-06-transcription/TASK-06-06-cloud-route-adapter.md`
- `docs/tasks/EPIC-10-privacy-settings/TASK-10-02-consent-gate.md`

---

## Non-Negotiable Safety / Privacy Constraints

- No client-side API keys, ever.
- No secrets in commits, browser bundles, IndexedDB, localStorage, UI, console logs,
  route errors, screenshots, or final reports.
- No audio or transcript content logged server-side.
- Cloud transcription requires explicit, contextual consent before sending audio.
- Canceling consent must abort before the network request is made.
- Local/mock transcription remains available without network calls.
- `/api/transcribe` rejects invalid MIME types and oversized files before provider calls.
- Provider errors are sanitized: the client gets stable error codes/messages only.
- Do not implement extraction, LLM prompt extraction, search/export, auth, sync,
  payments, or analytics in this goal.

---

## Definition of Done

Steven can test real transcription when all of this is true:

1. Home page still records audio over HTTPS on Vercel.
2. After stopping a recording, the UI offers:
   - **Save & Mock Transcribe** (existing local deterministic path), and
   - **Save & Real Transcribe** (new cloud path).
3. Clicking **Save & Real Transcribe** opens a consent sheet explaining:
   - what is sent: audio recording,
   - to whom: configured transcription provider,
   - why: generate transcript,
   - that Cancel sends nothing.
4. If consent is canceled, no `/api/transcribe` request is made and the draft remains
   recoverable.
5. If provider env vars are missing, cloud transcription is disabled with a clear
   message naming the missing server config — no crash, no fake transcript.
6. If configured, the app sends audio to `/api/transcribe`, receives real transcript
   text, persists it locally, and navigates to the idea detail page.
7. Idea detail clearly labels provider as `cloud` / model/provider metadata rather
   than mock.
8. Refreshing the detail page still shows the persisted transcript from IndexedDB.
9. Vercel production deployment is ready and browser-smoked.
10. Verification commands pass:
    - `npm run typecheck`
    - `npm run lint`
    - `npm test`
    - `npm run build`
    - `npm audit --audit-level=moderate --omit=dev`
11. Browser smoke verifies production `isSecureContext === true` and
    `navigator.mediaDevices.getUserMedia` exists.

Manual audio verification is acceptable for final provider transcription because
headless browser mic permissions are unreliable; however, route/unit tests must
mock provider calls and prove request/response/error behavior.

---

## Implementation Tasks

### Task 1 — Create provider contract and registry properly

**Objective:** Move transcription provider typing out of ad hoc domain types and
register mock/cloud providers behind one interface.

**Files:**

- Create: `src/lib/providers/transcription/types.ts`
- Modify: `src/lib/providers/transcription/index.ts`
- Modify: `src/lib/providers/transcription/mockProvider.ts`
- Test: `src/lib/providers/transcription/registry.test.ts`

**TDD steps:**

1. Add a failing test proving `listTranscriptionProviders()` includes `mock` and
   does not include `cloud` when server/client config says unavailable.
2. Add a failing test proving `getTranscriptionProvider('mock')` resolves a
   provider with `mode:'mock'` and `isAvailable() === true`.
3. Implement only enough registry/types to pass.
4. Keep UI imports provider-agnostic; no concrete provider imports outside the
   feature save orchestration layer.

**Acceptance:** Registry tests pass and existing mock transcription tests still pass.

---

### Task 2 — Add server-only transcription config resolver

**Objective:** Read Vercel/server env names safely and report availability without
leaking values.

**Files:**

- Create: `src/lib/server/transcriptionConfig.ts`
- Test: `src/lib/server/transcriptionConfig.test.ts`

**TDD steps:**

1. Write failing tests for missing API key → `{ available:false, missing:['apiKey'] }`.
2. Write failing tests for `NUGGET_TRANSCRIPTION_*` taking precedence over
   `OPENAI_*` fallback names.
3. Write failing tests for defaults: base URL, model, timeout, max bytes.
4. Implement resolver. Do not export secret values to any client module.

**Acceptance:** Config tests can assert booleans/names/defaults but never snapshot
or print a real key value.

---

### Task 3 — Implement `/api/transcribe` route with mocked provider tests

**Objective:** Add the server route that validates audio and calls an
OpenAI-compatible transcription endpoint.

**Files:**

- Create: `src/app/api/transcribe/route.ts`
- Create: `src/lib/server/transcriptionClient.ts`
- Test: `src/app/api/transcribe/route.test.ts`
- Test: `src/lib/server/transcriptionClient.test.ts`

**TDD steps:**

1. Test missing env returns `503` with `{ error: { code:'provider_unconfigured' } }`.
2. Test invalid MIME type returns `415` before `fetch` is called.
3. Test oversized upload returns `413` before `fetch` is called.
4. Test provider success maps text/language/segments/provider/model into
   `TranscriptResult` shape.
5. Test provider failure returns sanitized `502`; response must not include secret,
   provider raw body, audio content, or transcript content.
6. Implement route/client with `fetch` mocked in tests.

**Implementation notes:**

- Accept `multipart/form-data` from the browser with fields:
  - `file`
  - `ideaId` (metadata only)
  - `recordingId` (metadata only)
- Validate MIME against known browser recording types, at minimum:
  - `audio/webm`
  - `audio/webm;codecs=opus`
  - `audio/mp4`
  - `audio/mpeg`
  - `audio/wav`
- Server route does **not** persist anything.
- Do not add a provider SDK unless tests show `fetch` is insufficient.

**Acceptance:** Route tests prove no provider call occurs before validation passes.

---

### Task 4 — Implement consent gate service and modal

**Objective:** Ensure no cloud request can happen before explicit user consent.

**Files:**

- Create: `src/lib/privacy/consent.ts`
- Create: `src/components/ConsentSheet.tsx`
- Create: `src/hooks/useConsentGate.tsx` if useful
- Test: `src/lib/privacy/consent.test.ts`
- Test: `src/components/ConsentSheet.test.tsx`

**TDD steps:**

1. Test `ConsentRequiredError` shape.
2. Test cancel path rejects and does not call the provided send callback.
3. Test confirm path resolves and calls the send callback once.
4. Test dialog copy names audio, configured provider label, and purpose.
5. Implement minimal modal/gate.

**Acceptance:** Cloud send cannot be initiated without the confirm result.

---

### Task 5 — Add cloud transcription client provider

**Objective:** Add a browser-side provider that posts to `/api/transcribe` after
consent and returns `TranscriptResult`.

**Files:**

- Create: `src/lib/providers/transcription/cloudProvider.ts`
- Modify: `src/lib/providers/transcription/index.ts`
- Test: `src/lib/providers/transcription/cloudProvider.test.ts`

**TDD steps:**

1. Test unavailable state when `/api/transcribe/config` or route config says missing.
   If no config endpoint is added, test direct `isAvailable()` fallback behavior with
   dependency injection.
2. Test consent cancel makes no `fetch` call.
3. Test successful consent posts a `FormData` with audio Blob and maps result.
4. Test `AbortSignal` is passed through.
5. Implement provider.

**Acceptance:** Provider tests prove no request before consent.

---

### Task 6 — Wire recording UI for real transcription

**Objective:** Let Steven use the feature from the existing browser flow.

**Files:**

- Modify: `src/features/recorder/saveRecording.ts`
- Modify: `src/features/recorder/RecorderPanel.tsx`
- Modify/create: `src/features/recorder/transcriptionOptions.ts` if helpful
- Test: `src/features/recorder/RecorderPanel.test.tsx`
- Test: `src/features/recorder/saveRecording.test.ts`

**TDD steps:**

1. Test stopped draft shows both **Save & Mock Transcribe** and
   **Save & Real Transcribe**.
2. Test missing cloud config disables or explains real transcription path.
3. Test mock path still uses `mock` provider and stores transcript.
4. Test real path uses cloud provider, persists returned transcript, updates idea
   status to `transcribed`, and navigates to detail page.
5. Implement UI with clear busy/error states.

**Acceptance:** Existing mock flow remains unchanged; real flow is additive.

---

### Task 7 — Add production config/deploy docs

**Objective:** Make the provider configuration obvious for future Steven/agents.

**Files:**

- Modify: `README.md`
- Create or modify: `docs/deployment/vercel-env.md`

**Content required:**

- Env var names from the table above.
- Commands:

```bash
vercel env ls
vercel env add NUGGET_TRANSCRIPTION_API_KEY production
vercel env add NUGGET_TRANSCRIPTION_API_KEY preview
vercel env add NUGGET_TRANSCRIPTION_API_KEY development
vercel env pull .env.local
```

- Explicit warning: never commit `.env.local`; never paste key values into chat/logs.
- Note that `https://*.vercel.app` is required for browser mic APIs.

**Acceptance:** Docs explain how to configure without revealing secrets.

---

### Task 8 — Local verification and production deploy

**Objective:** Prove the slice works locally and on Vercel.

**Commands:**

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm audit --audit-level=moderate --omit=dev
```

If env vars are available locally via `vercel env pull .env.local`, run a local
manual smoke:

```bash
npm run dev -- -H 0.0.0.0 -p 3110
```

Then deploy:

```bash
git status --short --branch
git add -A
git commit -m "feat: add real transcription test path"
git push origin goal/real-transcription-test
# merge to main only after review or explicit authorization
vercel deploy --prod --yes
vercel inspect <deployment-url>
```

**Production browser smoke:**

- Load production URL.
- In console verify:

```js
({ isSecureContext, hasGetUserMedia: !!navigator.mediaDevices?.getUserMedia })
```

- Record a short audio clip manually.
- Click **Save & Real Transcribe**.
- Confirm consent.
- Verify detail page shows non-mock transcript text and provider metadata.
- Refresh detail page and verify transcript persists.

**Acceptance:** Final report includes deployment URL, inspect URL, commands run,
manual transcription result status, and whether env vars were configured.

---

## Known Non-Goals

- Extraction/nugget review (`/api/extract`, EPIC-07) is not part of this goal.
- Browser `SpeechRecognition` adapter (06-05) is optional and should not block real
  cloud transcription testing.
- Processing queue (EPIC-05) can remain bypassed for this test slice if direct
  save-and-transcribe is the shortest reliable path; document the bypass and keep
  repository boundaries clean.
- Multi-provider settings UI can wait; a single configured cloud provider is enough.

---

## Final Report Format

Return:

- **Status:** SUCCESS / PARTIAL / BLOCKED
- **Branch / commit:** exact SHA(s)
- **Production URL:** verified URL
- **Vercel env status:** configured / missing, names only, never values
- **What works:** record → consent → real transcription → persisted detail page
- **Verification:** command → result
- **Browser smoke:** secure context, getUserMedia, manual transcription result
- **Known limitations:** queue bypass, provider/model quirks, browser mic caveats
- **Next recommended goal:** extraction layer or processing queue integration
