# Nugget MVP Sprint 5 PWA Security and Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an installable, secure, deployed Nugget build whose critical capture, offline, retry, and duplicate-prevention flows are verified in a real browser and on real devices.

**Architecture:** Add a deliberately small service worker that caches the app shell and same-origin static assets but never API responses. Harden server routes with stable client/IP rate keys, validation, security headers, and sanitized logging. Use Playwright with a generated fake audio device and intercepted deterministic provider responses for browser automation, while keeping real GPT quality verification in Sprint 2's live evaluation suite.

**Tech Stack:** Next.js PWA metadata, Service Worker API, Playwright 1.61.1, Chromium fake-media flags, Vercel, TypeScript, Vitest.

## Global Constraints

- Offline capture must work after one successful online load.
- The service worker must never cache `/api/*` responses, audio upload bodies, transcripts, extraction payloads, or local export downloads.
- Do not rely on Background Sync, push, or service-worker model calls.
- Microphone access is limited to the same origin.
- API keys remain server-only.
- Rate limiting must not require account creation or block normal judging.
- Provider failures and logs must not expose transcript/audio/model-output bodies.
- Automated E2E uses deterministic intercepted providers; live GPT-5.6 evidence remains separate.
- Test latest available Chromium and mobile Safari where hardware is available; document exact versions.
- No feature work after the July 20 6:00 PM Pacific freeze unless it fixes core flow, data safety, deployment, or submission truthfulness.
- Use focused security/E2E tests and manual checks, not broad coverage or full TDD.

---

### Task 1: Add the installable offline application shell

**Files:**
- Create: `src/app/manifest.ts`
- Create: `public/icons/nugget.svg`
- Create: `public/sw.js`
- Create: `src/components/ServiceWorkerRegistration.tsx`
- Create: `src/components/InstallAppButton.tsx`
- Create: `src/components/ServiceWorkerRegistration.test.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: web app manifest, service-worker registration, install prompt, and offline shell

- [ ] **Step 1: Create an original fallback icon or use the final design asset**

If the final design system provides production icons, copy them to `public/icons/` with manifest paths documented below. Otherwise create `public/icons/nugget.svg` as a square ivory field with an original faceted amber polygon mark and no copied external logo. It must contain:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-labelledby="title">
  <title id="title">Nugget</title>
  <rect width="512" height="512" rx="112" fill="#FBF8F2"/>
  <path d="M256 92 382 174 350 352 256 420 154 352 126 174Z" fill="#E5A11A"/>
  <path d="m256 92 40 132-170-50Zm0 0 126 82-86 50Zm40 132 54 128-94 68Zm0 0-40 196-102-68Zm0 0-170-50 28 178Zm0 0 86-50-32 178Z" fill="none" stroke="#FFF2D4" stroke-width="14" stroke-linejoin="round"/>
</svg>
```

- [ ] **Step 2: Add manifest metadata**

Create `src/app/manifest.ts`:

```ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nugget',
    short_name: 'Nugget',
    description: 'Capture spoken ideas and organize them into useful, editable records.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FBF8F2',
    theme_color: '#FBF8F2',
    orientation: 'portrait-primary',
    categories: ['productivity', 'utilities'],
    icons: [{ src: '/icons/nugget.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
  };
}
```

If PNG icons are supplied, add exact 192×192 and 512×512 entries before the SVG entry.

- [ ] **Step 3: Implement conservative service-worker caching**

Create `public/sw.js`:

```js
const CACHE = 'nugget-shell-v1';
const SHELL = ['/', '/ideas', '/actions', '/settings', '/icons/nugget.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('nugget-') && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => (await caches.match(request)) || caches.match('/')));
    return;
  }

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      const copy = response.clone();
      void caches.open(CACHE).then((cache) => cache.put(request, copy));
      return response;
    })));
  }
});
```

- [ ] **Step 4: Register only in production**

`ServiceWorkerRegistration` runs in a client effect when `'serviceWorker' in navigator` and `process.env.NODE_ENV === 'production'`. Register `/sw.js`, log only a generic registration failure in development, and render nothing.

- [ ] **Step 5: Add install affordance**

Listen for `beforeinstallprompt`, store the event, and show **Install Nugget** in Settings only while install is available. Hide after acceptance or `appinstalled`. On iOS without the event, show compact manual **Share → Add to Home Screen** instructions.

- [ ] **Step 6: Test registration guards and commit**

Assert no development registration, one production registration, no API path in `SHELL`, and install button visibility from a synthetic event.

```powershell
npx vitest run src/components/ServiceWorkerRegistration.test.tsx
git add src/app/manifest.ts src/app/layout.tsx src/app/globals.css public/icons public/sw.js src/components/ServiceWorkerRegistration.tsx src/components/InstallAppButton.tsx src/components/ServiceWorkerRegistration.test.tsx
git commit -m "feat: make Nugget installable and offline-ready"
```

### Task 2: Harden API routes and response headers

**Files:**
- Create: `src/lib/server/rateLimit.ts`
- Create: `src/lib/server/rateLimit.test.ts`
- Create: `src/lib/server/requestIdentity.ts`
- Create: `src/lib/server/requestIdentity.test.ts`
- Modify: `src/app/api/transcribe/route.ts`
- Modify: `src/app/api/transcribe/route.test.ts`
- Modify: `src/app/api/extract/segment/route.ts`
- Modify: `src/app/api/extract/segment/route.test.ts`
- Modify: `src/app/api/extract/organize/route.ts`
- Modify: `src/app/api/extract/organize/route.test.ts`
- Modify: `next.config.mjs`

**Interfaces:**
- Produces: anonymous per-instance request limits, stable safety ID validation, and security headers

- [ ] **Step 1: Extract a privacy-preserving request key**

```ts
export function requestIdentity(request: Request, clientId?: string) {
  if (clientId && /^[0-9a-f-]{36}$/i.test(clientId)) return `client:${clientId}`;
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return `ip:${forwarded || 'unknown'}`;
}
```

Do not log the returned value. It is only a short-lived in-memory map key and the stable `clientId` is also passed as OpenAI `safety_identifier`.

- [ ] **Step 2: Implement a bounded token window**

```ts
interface Bucket { count: number; resetAt: number }
const buckets = new Map<string, Bucket>();

export function consumeRateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    const bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, bucket);
    return { allowed: true, remaining: limit - 1, resetAt: bucket.resetAt };
  }
  current.count += 1;
  return { allowed: current.count <= limit, remaining: Math.max(0, limit - current.count), resetAt: current.resetAt };
}
```

Delete expired entries when the map exceeds 2,000 keys. This is best-effort per server instance; document that Vercel/edge controls remain the durable production layer.

- [ ] **Step 3: Apply route-specific limits**

- Transcription: 10 requests per 10 minutes.
- Segmentation: 30 requests per 10 minutes.
- Organization: 30 requests per 10 minutes.

Consume after body/client ID validation but before provider calls. On rejection return 429:

```json
{ "error": { "code": "rate_limited", "message": "Too many processing requests. Try again in a few minutes." } }
```

Set `Retry-After` and `X-RateLimit-Remaining`. Never rate-limit GET config/health.

- [ ] **Step 4: Tighten request validation**

- Transcription requires allowed content type and non-zero file size, and checks max bytes before provider call.
- Segment/organize require UUID capture/transcript/safety IDs and reject unknown keys through strict Zod schemas.
- Reject category descriptions over 800 characters and more than 20 categories.
- Reject more than 12 candidates and quotes outside max transcript length.
- Read request bodies exactly once.

- [ ] **Step 5: Add global security headers**

In `next.config.mjs` add:

```js
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Permissions-Policy', value: 'microphone=(self), camera=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
    ],
  }];
},
```

Do not add a restrictive `script-src` during the deadline without validating Next production scripts.

- [ ] **Step 6: Test bypass and boundaries**

Assert separate client IDs have separate buckets, the 11th transcription request rejects, expired windows reset, invalid IDs reject before rate consumption, 429 includes Retry-After, keys never appear in body, and headers are present in a built app response.

- [ ] **Step 7: Run and commit**

```powershell
npx vitest run src/lib/server/rateLimit.test.ts src/lib/server/requestIdentity.test.ts src/app/api/transcribe/route.test.ts src/app/api/extract/segment/route.test.ts src/app/api/extract/organize/route.test.ts
git add src/lib/server src/app/api next.config.mjs
git commit -m "security: harden anonymous processing routes"
```

### Task 3: Centralize recoverable user errors and storage checks

**Files:**
- Modify: `src/lib/errors.ts`
- Create: `src/lib/userErrorMessage.ts`
- Create: `src/lib/userErrorMessage.test.ts`
- Create: `src/lib/storage/storageHealth.ts`
- Create: `src/lib/storage/storageHealth.test.ts`
- Modify: `src/features/recorder/RecorderPanel.tsx`
- Modify: `src/features/capture/CaptureDetailScreen.tsx`
- Modify: `src/features/review/ReviewScreen.tsx`
- Modify: `src/features/settings/SettingsScreen.tsx`

**Interfaces:**
- Produces: stable recovery copy and storage estimate/persistence status

- [ ] **Step 1: Map stable error codes to concrete recovery**

`userErrorMessage(error)` returns `{ title, detail, actionLabel? }`. Required mappings:

| Code/condition | Title | Detail | Action |
|---|---|---|---|
| `NotAllowedError` | Microphone access is blocked | Allow microphone access in browser settings, then try again. Nothing was recorded. | Try again |
| unsupported recorder | Recording is not supported here | Use Paste a ramble or open Nugget in a current Safari, Chrome, or Edge browser. | Paste a ramble |
| quota | This device is low on storage | The unsaved recording is still available on this screen. Free space, export/delete older data, then retry save. | Retry save |
| offline | Waiting for connection | Your capture is saved locally. Open Nugget when connected to continue processing. | none |
| `provider_unconfigured` | Processing is not configured | The recording is saved. Configure OpenAI on the server or use the deployed demo. | none |
| `provider_error` | Processing did not finish | Your recording and completed stages are saved. Retry from the last successful step. | Retry |
| `invalid_model_output` | Nugget could not organize this result | Your recording and transcript are saved. Retry once or edit the transcript first. | Retry |
| `cloud_consent_required` | Cloud processing is off | Enable cloud processing to transcribe and organize this capture. | Review privacy |

Never display provider body text or stack traces.

- [ ] **Step 2: Add storage health helper**

```ts
export async function storageHealth() {
  const estimate = await navigator.storage?.estimate?.();
  const persisted = await navigator.storage?.persisted?.();
  return {
    usage: estimate?.usage,
    quota: estimate?.quota,
    persisted: persisted ?? false,
    usageRatio: estimate?.usage && estimate.quota ? estimate.usage / estimate.quota : undefined,
  };
}
```

Settings may request `navigator.storage.persist()` only from an explicit **Improve offline storage reliability** button.

- [ ] **Step 3: Replace ad hoc error text**

Use the mapper in Recorder, Capture, Review, and Settings. Add `role="alert"` only to active errors, keep the user's unsaved form/draft state, and wire the mapped action.

- [ ] **Step 4: Verify production logging**

Search and remove `console.log` calls that include request bodies, transcript, raw JSON, `Blob`, or `response.output`. Generic error code logging is allowed only server-side.

```powershell
rg -n "console\.(log|error|warn)|rawJson|transcript\.text" src
```

- [ ] **Step 5: Test and commit**

```powershell
npx vitest run src/lib/userErrorMessage.test.ts src/lib/storage/storageHealth.test.ts
git add src/lib src/features/recorder/RecorderPanel.tsx src/features/capture/CaptureDetailScreen.tsx src/features/review/ReviewScreen.tsx src/features/settings/SettingsScreen.tsx
git commit -m "fix: preserve user work through recoverable failures"
```

### Task 4: Install Playwright and create deterministic fake audio

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `playwright.config.ts`
- Create: `scripts/generate-test-tone.mjs`
- Create after script runs: `e2e/fixtures/tone.wav`
- Create: `e2e/helpers/providerMocks.ts`

**Interfaces:**
- Produces: `npm run test:e2e` with fake microphone and route interception

- [ ] **Step 1: Install pinned Playwright**

```powershell
npm install --save-dev @playwright/test@1.61.1
npx playwright install chromium
```

- [ ] **Step 2: Add scripts**

```json
"test:e2e": "node scripts/generate-test-tone.mjs && playwright test",
"test:e2e:ui": "node scripts/generate-test-tone.mjs && playwright test --ui"
```

- [ ] **Step 3: Generate a valid two-second WAV without an external binary**

`generate-test-tone.mjs` writes 16-bit mono PCM at 44,100 Hz. Use a 440 Hz sine at 20% amplitude, write a 44-byte RIFF/WAVE header, and skip writing when an existing file has the expected size `176444` bytes. Ensure `e2e/fixtures` exists.

Core sample loop:

```js
for (let index = 0; index < sampleCount; index += 1) {
  const sample = Math.sin((2 * Math.PI * 440 * index) / sampleRate) * 0.2;
  buffer.writeInt16LE(Math.round(sample * 32767), 44 + index * 2);
}
```

- [ ] **Step 4: Configure Chromium fake media**

`playwright.config.ts`:

```ts
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const tone = path.resolve('e2e/fixtures/tone.wav');

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    permissions: ['microphone'],
    ...devices['Desktop Chrome'],
    launchOptions: {
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        `--use-file-for-fake-audio-capture=${tone}`,
      ],
    },
  },
  webServer: {
    command: 'npm run dev -- --hostname 127.0.0.1',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 5: Create route-mock helpers**

`installSuccessfulProviderMocks(page)` fulfills:

- GET `/api/transcribe` and `/api/extract` as available with correct models;
- POST `/api/transcribe` with a transcript containing two distinct ideas;
- POST `/api/extract/segment` with two valid candidates/spans;
- POST `/api/extract/organize` with two rich ideas using allowed default category IDs.

Use exact Sprint 2 schemas. `installFailOnceOrganizationMock(page)` returns sanitized 502 once, then the valid response.

- [ ] **Step 6: Generate and validate the fixture**

```powershell
node scripts/generate-test-tone.mjs
Get-Item e2e/fixtures/tone.wav | Select-Object Name,Length
npx playwright test --list
```

Expected: length 176444; Playwright lists tests after Task 5 creates them.

- [ ] **Step 7: Commit setup**

```powershell
git add package.json package-lock.json playwright.config.ts scripts/generate-test-tone.mjs e2e/fixtures/tone.wav e2e/helpers/providerMocks.ts
git commit -m "test: configure browser capture fixtures"
```

### Task 5: Automate the three critical browser paths

**Files:**
- Create: `e2e/capture-to-library.spec.ts`
- Create: `e2e/offline-resume.spec.ts`
- Create: `e2e/retry-idempotency.spec.ts`

**Interfaces:**
- Consumes: fake microphone, deterministic route mocks, production IndexedDB path
- Produces: browser proof for the approved critical flows

- [ ] **Step 1: Test record → process → confirm → library**

Flow:

```ts
test('records, organizes two ideas, confirms them, and finds them in the library', async ({ page }) => {
  await installSuccessfulProviderMocks(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Record' }).click();
  await expect(page.getByText('Listening…')).toBeVisible();
  await page.waitForTimeout(1_000);
  await page.getByRole('button', { name: 'Stop & save' }).click();
  await expect(page.getByText('Recording saved')).toBeVisible();
  await enableCloudProcessingIfAsked(page);
  await page.getByRole('button', { name: /Process now|Organize/ }).click();
  await expect(page.getByRole('heading', { name: '2 ideas found' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm all ready ideas' }).click();
  await page.getByRole('link', { name: 'Ideas' }).click();
  await expect(page.getByText('Create a neighborhood tool-sharing library')).toBeVisible();
  await expect(page.getByText('Plan a school research outline')).toBeVisible();
});
```

Use exact accessible names implemented in Sprint 3; if names differ because of the final design system, update both component and test copy consistently.

- [ ] **Step 2: Test offline record → reopen/reconnect → process**

Load online once, set context offline, record and save, verify queued/local copy, reload or revisit Capture, restore online, dispatch/wait for resume, then confirm the idea. Assert no network call was attempted before online restoration.

- [ ] **Step 3: Test failed organization → retry without duplicates**

Use fail-once mock. Verify recording/transcript saved, Retry visible, second processing succeeds, confirm one action, repeat the confirmation navigation or action request, and assert one idea row and one action row.

- [ ] **Step 4: Add per-test IndexedDB isolation**

Before each test, open the origin and delete `nugget` database through `indexedDB.deleteDatabase('nugget')`, then reload. Do not share order-dependent data.

- [ ] **Step 5: Run repeatedly**

```powershell
npm run test:e2e
npm run test:e2e
```

Expected: both consecutive runs pass with no retries locally.

- [ ] **Step 6: Commit**

```powershell
git add e2e
git commit -m "test: verify critical Nugget browser flows"
```

### Task 6: Deploy and verify the production build

**Files:**
- Create: `docs/qa/production-smoke-checklist.md`
- Modify: `docs/deployment/vercel-env.md`
- Modify: `docs/hackathon/BUILD_WEEK_EVIDENCE.md`

**Interfaces:**
- Produces: public HTTPS judging URL and verified production behavior

- [ ] **Step 1: Run dependency and build checks**

```powershell
npm audit --omit=dev
npm run check
npm run test:e2e
```

Expected: no unresolved critical/high production vulnerability. Do not run `npm audit fix --force`; update only a direct vulnerable dependency with a reviewed changelog and rerun all checks.

- [ ] **Step 2: Verify Vercel environment**

```powershell
vercel env ls
vercel env pull .env.local
```

Confirm production and preview have `OPENAI_API_KEY` and expected model overrides. Never print or commit `.env.local`.

- [ ] **Step 3: Build with Vercel configuration**

```powershell
vercel pull --yes
vercel build
$deploymentOutput = vercel deploy --prebuilt
$deploymentOutput
$url = ($deploymentOutput | Where-Object { $_ -match 'https://' } | Select-Object -Last 1).Trim()
if (-not $url) { throw 'Vercel did not return a deployment URL.' }
```

After preview smoke testing, promote or deploy production through the user's existing Vercel workflow. Record the exact URL.

- [ ] **Step 4: Check headers and health**

```powershell
Invoke-RestMethod "$url/api/health"
(Invoke-WebRequest $url).Headers
```

Expected: `$url` contains the HTTPS URL captured in Step 3. Health names GPT-5.6 and GPT-4o mini Transcribe without a secret; headers include content type, referrer, frame, permissions, and CSP controls.

- [ ] **Step 5: Execute production smoke matrix**

Document exact device/browser/version for:

- desktop Chromium: record, process, confirm, search, export;
- desktop Edge or Safari when available;
- physical iPhone Safari or Android Chrome: install, record, background app briefly, reopen, review;
- offline installed app: open shell, record, save, reconnect;
- PWA manifest/icon and standalone launch;
- all error and privacy copy;
- no API response served from service-worker cache.

- [ ] **Step 6: Record deployment evidence**

Add URL, deployment ID/date, health result, browser matrix, and screenshots to the Sprint 5 evidence row. Keep the public deployment available through August 5 at 5:00 PM Pacific.

- [ ] **Step 7: Commit documentation**

```powershell
git add docs/qa/production-smoke-checklist.md docs/deployment/vercel-env.md docs/hackathon/BUILD_WEEK_EVIDENCE.md
git commit -m "docs: verify production Nugget deployment"
```

### Task 7: Freeze features and close Sprint 5

**Files:**
- Create: `docs/hackathon/FEATURE_FREEZE.md`
- Modify: `docs/hackathon/BUILD_WEEK_EVIDENCE.md`

**Interfaces:**
- Produces: explicit freeze boundary for submission day

- [ ] **Step 1: Run the final engineering gate**

```powershell
npm run check
npm run test:e2e
npm run eval:live
git diff --check
git status --short --branch
```

Expected: all pass; live eval report still meets gates.

- [ ] **Step 2: Review the stop-the-line list**

Manually confirm:

- no lost recording on refresh;
- no duplicate on retry;
- no invalid output bypass;
- no unsupported explicit field;
- no local-only cloud claim;
- no broken deployed demo step.

- [ ] **Step 3: Create freeze document**

`FEATURE_FREEZE.md` records timestamp, production URL/deployment, passing commits, eval model/score, E2E result, known non-blocking limitations, and allowed post-freeze fixes. It states that no new features are accepted after July 20 at 6:00 PM Pacific.

- [ ] **Step 4: Commit the freeze**

```powershell
git add docs/hackathon/FEATURE_FREEZE.md docs/hackathon/BUILD_WEEK_EVIDENCE.md docs/evals/latest.json
git commit -m "chore: freeze Nugget MVP for submission"
git status --short --branch
```

## Sprint 5 exit checklist

- [ ] Manifest, icon, standalone display, and service-worker registration work.
- [ ] Offline shell and recording work after an online visit.
- [ ] Service worker never caches APIs or user content.
- [ ] Request validation, anonymous rate controls, and security headers work.
- [ ] Errors preserve work and offer concrete recovery.
- [ ] Fake-audio Playwright environment is reproducible.
- [ ] All three critical E2E flows pass twice.
- [ ] Real-device/browser production matrix is recorded.
- [ ] Public HTTPS deployment passes health and smoke checks.
- [ ] Live eval still meets gates.
- [ ] Feature freeze is committed.
- [ ] Sprint 5 evidence row is complete.
