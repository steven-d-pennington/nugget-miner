# Nugget MVP Sprint 0 Baseline and Build Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a reproducible, truthful, documented starting point before changing the product architecture.

**Architecture:** Keep the existing application behavior intact while restoring the dependency/build toolchain, documenting the pre-event baseline, sanitizing environment configuration, and exposing a non-secret health check. Add a minimal CI workflow so every later sprint inherits the same verification gate.

**Tech Stack:** Next.js 16.2.9, React 19.2.7, TypeScript 5.9.3, Vitest 4.0.15, GitHub Actions, Vercel.

## Global Constraints

- Start from approved design commit `4c4365b`; preserve pre-event commit `5394b9a`.
- Do not begin the data-model refactor in this sprint.
- Do not add production API keys to the repository, tests, screenshots, or logs.
- Correct misleading local-only copy even if Sprint 3 will later redesign that screen.
- Use focused risk-based verification, not full TDD.
- Exit only when `npm ci`, typecheck, lint, current tests, and production build all pass.

---

### Task 1: Create the execution branch and restore the toolchain

**Files:**
- Modify: `package.json`
- Create: `.env.example`
- Modify: `docs/deployment/vercel-env.md`

**Interfaces:**
- Consumes: lockfile at `package-lock.json`
- Produces: `npm run check` as the shared local and CI gate

- [ ] **Step 1: Create or enter the implementation branch**

Run:

```powershell
git status --short --branch
git switch -c codex/nugget-mvp
```

Expected: branch is `codex/nugget-mvp`; no unrelated working-tree changes are staged.

- [ ] **Step 2: Install exactly from the lockfile**

Run:

```powershell
npm ci
```

Expected: exit code 0 and `node_modules` created without changing `package-lock.json`.

- [ ] **Step 3: Add the shared verification script**

Rewrite `package.json` in readable JSON and preserve all existing versions. Add this script without removing existing scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "test": "vitest run",
    "check": "npm run typecheck && npm run lint && npm test && npm run build"
  }
}
```

- [ ] **Step 4: Create the non-secret environment template**

Create `.env.example` with exactly these documented keys and no values that grant access:

```dotenv
# Required for real transcription and GPT-5.6 organization.
OPENAI_API_KEY=

# Optional endpoint overrides for an OpenAI-compatible gateway.
OPENAI_BASE_URL=https://api.openai.com/v1
NUGGET_TRANSCRIPTION_BASE_URL=https://api.openai.com/v1
NUGGET_LLM_BASE_URL=https://api.openai.com/v1

# MVP model defaults.
NUGGET_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
NUGGET_LLM_MODEL=gpt-5.6
NUGGET_LLM_REASONING_EFFORT=medium

# Server request limits.
NUGGET_TRANSCRIPTION_MAX_BYTES=26214400
NUGGET_LLM_MAX_INPUT_CHARS=24000
NUGGET_TRANSCRIPTION_TIMEOUT_MS=60000
NUGGET_LLM_TIMEOUT_MS=90000
```

- [ ] **Step 5: Make deployment documentation match the template**

Update `docs/deployment/vercel-env.md` to name every key above, identify `OPENAI_API_KEY` as secret, identify the remaining values as optional overrides, and include these commands:

```powershell
vercel env add OPENAI_API_KEY production
vercel env add OPENAI_API_KEY preview
vercel env pull .env.local
```

State that `.env.local` must never be committed.

- [ ] **Step 6: Run the inherited checks and record failures before fixing them**

Run:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: record exact failures in the sprint handoff. Fix only failures already present in the current vertical slice; do not start Sprint 1 work.

- [ ] **Step 7: Commit the readiness setup**

```powershell
git add package.json .env.example docs/deployment/vercel-env.md
git commit -m "chore: establish MVP build configuration"
```

### Task 2: Document the pre-event baseline and evidence ledger

**Files:**
- Create: `docs/hackathon/PRE_HACKATHON_BASELINE.md`
- Create: `docs/hackathon/BUILD_WEEK_EVIDENCE.md`

**Interfaces:**
- Consumes: Git history through `5394b9a`
- Produces: stable before/after evidence referenced by README and Devpost submission

- [ ] **Step 1: Verify baseline facts from Git**

Run:

```powershell
git show --stat --oneline 5394b9a
git log --reverse --oneline 5394b9a^..5394b9a
```

Expected: `5394b9a` is the last pre-event application commit.

- [ ] **Step 2: Create the baseline document**

Create `docs/hackathon/PRE_HACKATHON_BASELINE.md` with this structure and factual content:

```markdown
# Nugget Pre-Build-Week Baseline

**Baseline commit:** `5394b9a`
**Baseline date:** June 24, 2026
**Event work begins:** July 13, 2026

## Working before Build Week

- Browser microphone recording through MediaRecorder
- Audio level feedback and local Blob persistence in Dexie
- Mock and consent-gated cloud transcription
- Editable transcript
- Mock and consent-gated cloud LLM extraction
- One summary with nugget, action, question, tag, and source-span suggestions
- Review actions for accepting or rejecting suggestions

## Not present before Build Week

- Capture-session versus idea separation
- Multiple independent ideas from one ramble
- User-defined categories with classifier descriptions
- Multi-tag idea organization
- GPT-5.6 Responses API structured-output pipeline
- Persisted processing queue, offline resume, and duplicate prevention
- Confirmation of rich idea records
- Searchable idea library, Actions screen, category settings, export, and PWA
- Evaluation harness, end-to-end tests, and hackathon submission evidence

## Verification

Use `git show --stat 5394b9a` and the dated history before July 13 to verify this boundary.
```

- [ ] **Step 3: Create the evidence ledger**

Create `docs/hackathon/BUILD_WEEK_EVIDENCE.md` with a row per sprint and these exact columns:

```markdown
# Build Week Evidence Ledger

| Sprint | Date | Commit(s) | Codex task/session | Working proof | Screenshot/video asset | Notes |
|---|---|---|---|---|---|---|
| 0 |  |  |  |  |  |  |
| 1 |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |
| 4 |  |  |  |  |  |  |
| 5 |  |  |  |  |  |  |
| 6 |  |  |  |  |  |  |

## Primary Codex Session

- Session ID from `/feedback`:
- Why this was the primary implementation task:
```

Blank evidence cells are intentional collection fields. Fill each sprint row at its exit gate.

- [ ] **Step 4: Validate the baseline against the repository**

Run:

```powershell
rg -n "MediaRecorder|cloudTranscriptionProvider|cloudExtractionProvider|ReviewScreen" src
rg -n "manifest|serviceWorker|search\(" src public -g "*" 2>$null
```

Expected: the first command supports the working-before list; the second does not reveal a hidden PWA/search implementation.

- [ ] **Step 5: Commit the evidence boundary**

```powershell
git add docs/hackathon/PRE_HACKATHON_BASELINE.md docs/hackathon/BUILD_WEEK_EVIDENCE.md
git commit -m "docs: record pre-event Nugget baseline"
```

### Task 3: Add a sanitized health route

**Files:**
- Create: `src/app/api/health/route.ts`
- Create: `src/app/api/health/route.test.ts`
- Modify: `src/lib/llm/modelConfig.ts`
- Modify: `src/lib/server/transcriptionConfig.ts`

**Interfaces:**
- Consumes: `publicLlmConfig()` and `publicTranscriptionConfig()`
- Produces: `GET /api/health` with no secrets and a stable `status: "ok"`

- [ ] **Step 1: Add the route test**

Create `src/app/api/health/route.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('/api/health', () => {
  it('reports sanitized provider readiness without returning keys', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'secret-test-key');
    vi.stubEnv('NUGGET_LLM_MODEL', 'gpt-5.6');
    vi.stubEnv('NUGGET_TRANSCRIPTION_MODEL', 'gpt-4o-mini-transcribe');
    const { GET } = await import('./route');

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: 'ok',
      transcription: { available: true, model: 'gpt-4o-mini-transcribe' },
      organization: { available: true, model: 'gpt-5.6' },
    });
    expect(JSON.stringify(body)).not.toContain('secret-test-key');
  });
});
```

- [ ] **Step 2: Implement the route**

Create `src/app/api/health/route.ts`:

```ts
import { publicLlmConfig, resolveLlmConfig } from '@/lib/llm';
import { publicTranscriptionConfig, resolveTranscriptionConfig } from '@/lib/server/transcriptionConfig';

export async function GET() {
  const transcription = publicTranscriptionConfig(resolveTranscriptionConfig());
  const organization = publicLlmConfig(resolveLlmConfig());

  return Response.json({
    status: 'ok',
    transcription: { available: transcription.available, model: transcription.model },
    organization: { available: organization.available, model: organization.model },
  });
}
```

- [ ] **Step 3: Update current model defaults immediately**

In `src/lib/llm/modelConfig.ts`, change:

```ts
const DEFAULT_MODEL = 'gpt-5.6';
const DEFAULT_TIMEOUT_MS = 90_000;
```

In `src/lib/server/transcriptionConfig.ts`, change:

```ts
const DEFAULT_MODEL = 'gpt-4o-mini-transcribe';
```

Do not migrate API shape until Sprint 2.

- [ ] **Step 4: Run the route and configuration tests**

Run:

```powershell
npx vitest run src/app/api/health/route.test.ts src/lib/llm/modelConfig.test.ts src/lib/server/transcriptionConfig.test.ts
```

Expected: all tests pass after updating any assertions that intentionally checked the old defaults.

- [ ] **Step 5: Commit the health check**

```powershell
git add src/app/api/health src/lib/llm/modelConfig.ts src/lib/llm/modelConfig.test.ts src/lib/server/transcriptionConfig.ts src/lib/server/transcriptionConfig.test.ts
git commit -m "feat: expose sanitized provider health"
```

### Task 4: Correct misleading current privacy copy

**Files:**
- Modify: `src/features/recorder/HomeScreen.tsx`
- Modify: `src/features/recorder/RecorderPanel.tsx`
- Modify: `src/features/recorder/HomeScreen.test.tsx`
- Modify: `src/features/recorder/RecorderPanel.test.tsx`

**Interfaces:**
- Produces: truthful copy before the full Sprint 3 redesign

- [ ] **Step 1: Replace the home status language**

In `HomeScreen.tsx`, replace the `Local-only` badge and mock-only paragraph with:

```tsx
<span className="w-fit rounded-full border border-success/40 px-3 py-1 text-sm text-success">
  Local storage
</span>
```

```tsx
<p className="max-w-2xl text-muted">
  Recordings and saved ideas stay in this browser. When you choose cloud processing, audio or transcript text is sent securely to the configured provider.
</p>
```

- [ ] **Step 2: Replace the recorder badge and disclosure**

Use this text in `RecorderPanel.tsx`:

```tsx
<p className="mb-2 inline-flex rounded-full border border-accent/40 px-3 py-1 text-sm text-accent">
  Saved locally first
</p>
<p className="mt-2 text-muted">
  Your recording is saved in this browser before processing. Real transcription sends audio to the configured cloud provider after consent.
</p>
```

- [ ] **Step 3: Update assertions to enforce truthful copy**

In the two component test files, require `Local storage` or `Saved locally first`, require `cloud`, and add:

```ts
expect(screen.queryByText('Local-only')).not.toBeInTheDocument();
expect(screen.queryByText(/everything stays on your device/i)).not.toBeInTheDocument();
```

- [ ] **Step 4: Run the focused component tests**

```powershell
npx vitest run src/features/recorder/HomeScreen.test.tsx src/features/recorder/RecorderPanel.test.tsx
```

Expected: both files pass.

- [ ] **Step 5: Commit the copy correction**

```powershell
git add src/features/recorder/HomeScreen.tsx src/features/recorder/RecorderPanel.tsx src/features/recorder/HomeScreen.test.tsx src/features/recorder/RecorderPanel.test.tsx
git commit -m "fix: describe local storage and cloud processing accurately"
```

### Task 5: Add the CI gate and close Sprint 0

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `docs/hackathon/BUILD_WEEK_EVIDENCE.md`

**Interfaces:**
- Consumes: `npm run check`
- Produces: pull-request and branch CI for the same local verification gate

- [ ] **Step 1: Create the workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, codex/nugget-mvp]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run check
```

- [ ] **Step 2: Run the full local gate**

```powershell
npm run check
git diff --check
```

Expected: every command exits 0.

- [ ] **Step 3: Verify no secret or generated environment file is staged**

```powershell
git status --short
git diff --cached --name-only
rg -n "sk-[A-Za-z0-9_-]{20,}" . -g '!node_modules/**' -g '!.git/**'
```

Expected: no secret-looking match and no `.env.local` entry.

- [ ] **Step 4: Update the evidence ledger**

Fill Sprint 0's date, commit hashes, verification command, and proof. Do not leave the Sprint 0 row blank after exit.

- [ ] **Step 5: Commit and record the sprint exit**

```powershell
git add .github/workflows/ci.yml docs/hackathon/BUILD_WEEK_EVIDENCE.md
git commit -m "ci: verify Nugget MVP build"
git status --short --branch
```

Expected: clean working tree on `codex/nugget-mvp`.

## Sprint 0 exit checklist

- [ ] Pre-event baseline is committed and accurate.
- [ ] Environment variables are documented without secrets.
- [ ] Current UI no longer says the app is local-only.
- [ ] `GET /api/health` is sanitized.
- [ ] Local and CI gates use the same command.
- [ ] `npm run check` passes.
- [ ] Sprint 0 evidence row is complete.
