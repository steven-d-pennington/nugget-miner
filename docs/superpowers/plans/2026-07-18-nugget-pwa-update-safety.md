# Nugget PWA Update Safety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every deployed Nugget release discoverable from an installed PWA and let the user optionally export local data before explicitly activating and reloading into the new version.

**Architecture:** Replace the static self-activating worker with a release-stamped `/sw.js` route whose worker waits for an explicit `SKIP_WAITING` message. A root update provider owns registration, update checks, capture locking, activation, and reload state; `AppShell` and Settings consume that state while a shared export operation preserves one local-data export contract.

**Tech Stack:** Next.js 16 App Router route handlers, React 19 context, Service Worker API, Dexie/IndexedDB, TypeScript, Vitest, Testing Library, Playwright, Vercel system environment variables.

## Global Constraints

- Use Sol for implementation; do not delegate to Terra.
- Use focused risk-based tests, not blanket TDD. Run a red-green cycle for worker activation, capture locking, and export reuse.
- Never cache `/api/*`, recordings, transcripts, IndexedDB data, generated exports, or user-content responses.
- Do not silently reload or activate an update while microphone permission, recording, stopping, local save, or an unsaved draft is active.
- **Export data** remains optional and **Update now** remains available after export success or failure.
- Exact export success copy: **Export created. Your data remains in Nugget.**
- The current JSON export has no in-app restore path; do not call it an automatic backup.
- Preserve `docs/hackathon/demo-video-draft/` and all unrelated user changes.
- Each task ends with focused verification and a task-sized commit.

---

### Task 1: Serve a release-stamped waiting service worker

**Files:**
- Create: `src/lib/pwa/serviceWorkerSource.ts`
- Create: `src/lib/pwa/serviceWorkerSource.test.ts`
- Create: `src/app/sw.js/route.ts`
- Create: `src/app/sw.js/route.test.ts`
- Modify: `next.config.mjs`
- Delete: `public/sw.js`

**Interfaces:**
- Produces: `buildServiceWorkerSource(releaseId: string): string`
- Produces: `GET(): Response` at `/sw.js`
- Produces: build-time `process.env.NEXT_PUBLIC_NUGGET_RELEASE`

- [ ] **Step 1: Add failing worker-source tests**

Create `src/lib/pwa/serviceWorkerSource.test.ts` with assertions that a generated worker:

```ts
const source = buildServiceWorkerSource('dpl_test-123');
const installHandler = source.match(/addEventListener\('install',[\s\S]*?\n\}\);/)?.[0] ?? '';
expect(source).toContain('dpl_test-123');
expect(source).toContain("const CACHE_PREFIX = 'nugget-shell-'");
expect(source).toContain("event.data?.type === 'SKIP_WAITING'");
expect(installHandler).not.toContain('skipWaiting()');
expect(source).toContain("url.pathname.startsWith('/api/')");
expect(source).not.toMatch(/audio|transcript|full-export/i);
```

Also assert hostile release text is serialized as data and cannot inject executable worker statements.

- [ ] **Step 2: Run the source test and verify RED**

Run:

```powershell
npx vitest run src/lib/pwa/serviceWorkerSource.test.ts
```

Expected: FAIL because `serviceWorkerSource.ts` does not exist.

- [ ] **Step 3: Implement the worker source builder**

`buildServiceWorkerSource` must use `JSON.stringify(releaseId)` and produce a worker with these behaviors:

```js
const RELEASE_ID = "serialized release";
const CACHE_PREFIX = 'nugget-shell-';
const CACHE = CACHE_PREFIX + RELEASE_ID;
const SHELL = ['/', '/ideas', '/actions', '/settings', '/icons/nugget.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});
```

Retain the existing network-first navigation fallback and cache-first same-origin `/_next/static/` and `/icons/` handling. Cache only successful responses and leave all API and non-GET requests untouched.

- [ ] **Step 4: Add route and release-ID tests**

Create `src/app/sw.js/route.test.ts` and assert:

```ts
const response = GET();
expect(response.headers.get('content-type')).toContain('application/javascript');
expect(response.headers.get('cache-control')).toContain('no-cache');
expect(response.headers.get('service-worker-allowed')).toBe('/');
expect(await response.text()).toContain(process.env.NEXT_PUBLIC_NUGGET_RELEASE ?? 'local-development');
```

- [ ] **Step 5: Implement the route and build-time release ID**

In `next.config.mjs`, calculate once when the build starts:

```js
const releaseId = process.env.VERCEL_DEPLOYMENT_ID
  ?? process.env.VERCEL_GIT_COMMIT_SHA
  ?? process.env.NEXT_PUBLIC_NUGGET_RELEASE
  ?? `local-${Date.now().toString(36)}`;
```

Expose it through `env: { NEXT_PUBLIC_NUGGET_RELEASE: releaseId }` without exposing secrets. The `/sw.js` route calls `buildServiceWorkerSource(process.env.NEXT_PUBLIC_NUGGET_RELEASE ?? 'local-development')` and returns `Cache-Control: no-cache, no-store, must-revalidate`, `Service-Worker-Allowed: /`, and JavaScript content type. Remove `public/sw.js` so there is one source of truth.

- [ ] **Step 6: Verify and commit Task 1**

Run:

```powershell
npx vitest run src/lib/pwa/serviceWorkerSource.test.ts src/app/sw.js/route.test.ts src/components/ServiceWorkerRegistration.test.tsx
npm run typecheck
```

Expected: worker/route tests pass. The existing registration test may remain green because `/sw.js` is unchanged as the registration URL.

Commit:

```powershell
git add next.config.mjs public/sw.js src/lib/pwa src/app/sw.js
git commit -m "feat: version the Nugget service worker"
```

### Task 2: Share the trusted full-data export operation

**Files:**
- Create: `src/lib/export/exportLocalData.ts`
- Create: `src/lib/export/exportLocalData.test.ts`
- Modify: `src/features/settings/SettingsScreen.tsx`
- Modify: `src/features/settings/SettingsScreen.test.tsx`

**Interfaces:**
- Produces: `exportLocalData(): Promise<{ exportedAt: string; filename: string }>`

- [ ] **Step 1: Write the failing shared-export test**

Mock `buildFullExport` and `downloadText`, call `exportLocalData()`, and assert:

```ts
expect(downloadText).toHaveBeenCalledWith(
  'nugget-full-export-2026-07-18.json',
  expect.stringContaining('nugget-full-export-v1'),
  'application/json',
);
expect(result).toEqual({
  exportedAt: '2026-07-18T08:00:00.000Z',
  filename: 'nugget-full-export-2026-07-18.json',
});
```

- [ ] **Step 2: Run and verify RED**

```powershell
npx vitest run src/lib/export/exportLocalData.test.ts
```

Expected: FAIL because the shared export operation does not exist.

- [ ] **Step 3: Implement and reuse the operation**

`exportLocalData` calls `buildFullExport()`, constructs the existing filename, calls `downloadText`, and returns non-sensitive export metadata. Replace the duplicated Settings implementation with this function. Preserve Settings messages and busy behavior.

- [ ] **Step 4: Verify export behavior and commit**

```powershell
npx vitest run src/lib/export/exportLocalData.test.ts src/lib/export/fullExport.test.ts src/features/settings/SettingsScreen.test.tsx
git add src/lib/export src/features/settings/SettingsScreen.tsx src/features/settings/SettingsScreen.test.tsx
git commit -m "refactor: share local data export"
```

### Task 3: Add the controlled update lifecycle provider

**Files:**
- Create: `src/components/AppUpdateProvider.tsx`
- Create: `src/components/AppUpdateProvider.test.tsx`
- Modify: `src/app/layout.tsx`
- Delete: `src/components/ServiceWorkerRegistration.tsx`
- Modify: `src/components/ServiceWorkerRegistration.test.tsx`

**Interfaces:**
- Produces: `AppUpdateProvider`
- Produces: `useAppUpdate(): AppUpdateContextValue`
- `AppUpdateContextValue` includes:

```ts
interface AppUpdateContextValue {
  releaseId: string;
  status: 'idle' | 'checking' | 'ready' | 'updating' | 'error';
  updateReady: boolean;
  captureLocked: boolean;
  updateMessage?: string;
  setCaptureLocked(locked: boolean): void;
  checkForUpdates(): Promise<void>;
  applyUpdate(): Promise<void>;
}
```

- [ ] **Step 1: Add failing lifecycle tests**

Use minimal fake `ServiceWorker`, `ServiceWorkerRegistration`, and `ServiceWorkerContainer` event targets. Assert:

- development never registers;
- production registers `/sw.js` with `{ scope: '/', updateViaCache: 'none' }`;
- first install with no existing controller does not expose an update;
- `registration.waiting` with an existing controller exposes `updateReady`;
- an installing worker exposes the update only after state becomes `installed`;
- focus, visible `visibilitychange`, and `online` call `registration.update()` without overlapping calls;
- capture lock retains the update but prevents `applyUpdate()`;
- unlocked `applyUpdate()` sends exactly `{ type: 'SKIP_WAITING' }`;
- `controllerchange` invokes an injected `reloadPage` exactly once;
- activation timeout returns `status: 'error'` with retry copy rather than reloading.

- [ ] **Step 2: Run and verify RED**

```powershell
npx vitest run src/components/AppUpdateProvider.test.tsx
```

Expected: FAIL because the provider does not exist.

- [ ] **Step 3: Implement registration and update discovery**

The provider registers only in production. Store the registration, waiting worker, in-flight update promise, activation timer, capture lock, and reload guard in refs where event handlers require current values. Check `registration.waiting` immediately, listen for `updatefound`, and attach a `statechange` handler to `registration.installing`.

Show an update only when `navigator.serviceWorker.controller` exists. Register update checks on mount, `window.focus`, `window.online`, and visible `document.visibilitychange`; remove all listeners on unmount. Coalesce update calls by returning the same in-flight promise.

- [ ] **Step 4: Implement controlled activation and recovery**

Before posting, recheck `captureLockedRef.current` and `waitingWorkerRef.current`. When safe, set `status: 'updating'`, send `{ type: 'SKIP_WAITING' }`, and start a 10-second timeout. A single `controllerchange` clears the timer and calls `reloadPage()` once. Timeout sets `status: 'error'` and the message **The update did not finish. Keep using Nugget or try the update again.**

- [ ] **Step 5: Install the provider at the root**

Replace `ServiceWorkerRegistration` in `layout.tsx` with `AppUpdateProvider` wrapping `InstallAppProvider` and all application children. Keep a non-throwing default context for isolated component tests. Move the legacy registration assertions into the provider test and remove the old component.

- [ ] **Step 6: Verify and commit Task 3**

```powershell
npx vitest run src/components/AppUpdateProvider.test.tsx src/components/ServiceWorkerRegistration.test.tsx
npm run typecheck
git add src/app/layout.tsx src/components/AppUpdateProvider.tsx src/components/AppUpdateProvider.test.tsx src/components/ServiceWorkerRegistration.tsx src/components/ServiceWorkerRegistration.test.tsx
git commit -m "feat: control installed app updates"
```

### Task 4: Add update UI, export option, and capture protection

**Files:**
- Create: `src/components/AppUpdatePrompt.tsx`
- Create: `src/components/AppUpdatePrompt.test.tsx`
- Modify: `src/components/AppShell.tsx`
- Modify: `src/components/AppShell.test.tsx`
- Modify: `src/features/recorder/HomeScreen.tsx`
- Modify: `src/features/recorder/HomeScreen.test.tsx`
- Modify: `src/features/settings/SettingsScreen.tsx`
- Modify: `src/features/settings/SettingsScreen.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `useAppUpdate()` and `exportLocalData()`
- Produces: `AppUpdatePrompt`

- [ ] **Step 1: Add failing prompt and capture-lock tests**

Assert the prompt:

- is absent without `updateReady` and while `captureLocked`;
- renders **New version ready**, **Update now**, and **Export data** when ready;
- calls `applyUpdate` from **Update now**;
- calls `exportLocalData` from **Export data**;
- shows **Creating export…** while pending;
- shows **Export created. Your data remains in Nugget.** on success;
- shows **Try export again** on failure while leaving **Update now** enabled.

Extend the HomeScreen test so its recorder mock publishes `true` and then `false`; assert `setCaptureLocked` receives both transitions.

- [ ] **Step 2: Run and verify RED**

```powershell
npx vitest run src/components/AppUpdatePrompt.test.tsx src/features/recorder/HomeScreen.test.tsx
```

Expected: FAIL because the prompt and provider integration do not exist.

- [ ] **Step 3: Implement the persistent prompt**

Render the prompt from `AppShell` after `<main>` and before `<BottomNav>`. Use an `aria-live="polite"` status region, a navy title, concise gray explanation, amber primary button, quiet secondary button, and a parchment boundary. The component manages only export presentation state; lifecycle state remains in the provider.

- [ ] **Step 4: Connect capture lock**

In `HomeScreen`, obtain `setCaptureLocked` from `useAppUpdate`. Use one callback that updates the local `captureLocked` state and the provider state. On unmount, publish `false`. `applyUpdate()` still rechecks its lock ref to protect against simultaneous taps.

- [ ] **Step 5: Add Settings update controls**

In Settings About or Offline Storage, display `releaseId.slice(0, 12)`, **Check for updates**, **Update now** when ready, and **Export data** when ready. Manual checks use the provider status and report:

- **Nugget is up to date.** after a completed reachable check with no waiting worker;
- **New version ready.** when waiting;
- **Nugget could not check for updates. Check your connection and try again.** on failure.

Do not replace the existing full export section.

- [ ] **Step 6: Style and verify Task 4**

Add `.app-update` styles consistent with the existing design tokens. Keep 48-pixel controls, visible focus, safe-area-aware spacing above bottom navigation, and reduced-motion-safe behavior.

Run:

```powershell
npx vitest run src/components/AppUpdatePrompt.test.tsx src/components/AppUpdateProvider.test.tsx src/components/AppShell.test.tsx src/features/recorder/HomeScreen.test.tsx src/features/settings/SettingsScreen.test.tsx
npm run typecheck
npx eslint src/components/AppUpdateProvider.tsx src/components/AppUpdatePrompt.tsx src/components/AppShell.tsx src/features/recorder/HomeScreen.tsx src/features/settings/SettingsScreen.tsx src/app/sw.js/route.ts src/lib/pwa/serviceWorkerSource.ts src/lib/export/exportLocalData.ts
git add src/components src/features/recorder/HomeScreen.tsx src/features/recorder/HomeScreen.test.tsx src/features/settings/SettingsScreen.tsx src/features/settings/SettingsScreen.test.tsx src/app/globals.css
git commit -m "feat: offer safe installed app updates"
```

### Task 5: Verify the installed update path and publish

**Files:**
- Modify: `docs/qa/production-smoke-checklist.md`
- Modify: `docs/hackathon/BUILD_WEEK_EVIDENCE.md`
- Modify: `docs/superpowers/specs/2026-07-18-nugget-pwa-update-safety-design.md`

**Interfaces:**
- Consumes: completed update flow
- Produces: deployed evidence and first-rollout handoff

- [ ] **Step 1: Run the engineering gate**

```powershell
npx vitest run src/lib/pwa/serviceWorkerSource.test.ts src/app/sw.js/route.test.ts src/lib/export/exportLocalData.test.ts src/components/AppUpdateProvider.test.tsx src/components/AppUpdatePrompt.test.tsx src/components/AppShell.test.tsx src/features/recorder/HomeScreen.test.tsx src/features/settings/SettingsScreen.test.tsx
npm run typecheck
npm run build
git diff --check
```

Run changed-file ESLint separately because known local `.superpowers/sdd` scripts currently prevent a clean repository-wide lint command.

- [ ] **Step 2: Perform local production browser checks**

Run `npm run build` followed by `npm start -- --port 50713`. Verify:

- `/sw.js` returns JavaScript, no-cache headers, and the current release ID;
- first install does not show the update prompt;
- synthetic/fake waiting-worker tests cover the prompt and activation handshake;
- capture, Ideas, Actions, and Settings remain visually intact at 430×932;
- no console errors occur on the primary routes.

- [ ] **Step 3: Update evidence and spec status**

Record exact automated commands, browser checks, deployment IDs, first-rollout close/reopen instructions, and the remaining physical-iPhone two-deployment check. Set the design spec status to implemented only after the engineering gate passes; keep the real-device verification labeled pending until Steven completes it.

- [ ] **Step 4: Commit, push, and deploy preview**

```powershell
git add docs/qa/production-smoke-checklist.md docs/hackathon/BUILD_WEEK_EVIDENCE.md docs/superpowers/specs/2026-07-18-nugget-pwa-update-safety-design.md
git commit -m "docs: verify controlled PWA updates"
git push origin codex/mvp-completion-2026-07-17
vercel ls nugget-miner --yes
```

Wait for the Git preview matching the pushed commit to become READY. Smoke `/` and `/api/health` before promotion.

- [ ] **Step 5: Promote the verified artifact and test the transition**

Using the user's existing production authorization, promote the verified preview. Confirm the production alias, `/`, `/api/health`, and `/sw.js` return 200. Provide the one-time instruction: open the installed app online, fully close it, and reopen it so the new controlled-update client loads.

After Steven confirms that client is loaded, create a second no-code deployment of the same verified commit only if needed for the physical update prompt test. The new `VERCEL_DEPLOYMENT_ID` must change `/sw.js`, and the installed app must then show **New version ready** without a browser refresh control.

- [ ] **Step 6: Final handoff**

Report commits, branch/push state, deployment URLs/IDs, exact checks, first-rollout instructions, real-device evidence status, and any known limitation. Leave only the pre-existing untracked `docs/hackathon/demo-video-draft/` directory in the working tree.

## Completion gate

- [ ] Worker bytes and cache names change for every deployment.
- [ ] New workers wait for an explicit `SKIP_WAITING` message.
- [ ] Installed app discovers updates on launch/foreground/focus/reconnect.
- [ ] Prompt is suppressed through active and unsaved capture work.
- [ ] Optional export uses the exact Settings export contract and accurate copy.
- [ ] Activation reloads once and failures remain retryable.
- [ ] Existing local data survives the verified transition and migration path.
- [ ] Focused tests, typecheck, changed-file lint, production build, preview smoke, and production smoke pass.
- [ ] Physical iPhone installed-app update verification is recorded or explicitly handed off as the only remaining manual check.
