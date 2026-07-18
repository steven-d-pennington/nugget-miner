# Nugget PWA Update Safety Design

**Date:** July 18, 2026
**Status:** Implemented and engineering-verified; physical two-deployment iPhone check pending
**Scope:** Installed-PWA update discovery, optional pre-update export, controlled activation, and recovery

## 1. Problem

Nugget's current service worker calls `skipWaiting()` during installation and claims clients during activation. The application registers the worker but does not observe `waiting`, `updatefound`, or `controllerchange`. An installed home-screen copy can therefore continue executing an older client bundle after a new worker activates, with no in-app refresh control or explanation.

This becomes more consequential as IndexedDB schemas evolve. New database code should not begin until the person deliberately accepts the new application version, and the person should be able to export a copy of local data while the old, known-working version is still running.

## 2. Approved decisions

- Updates are user-controlled. Nugget must not silently reload an open installed app.
- A waiting update appears through an in-app **Update now** prompt.
- **Export data** is an optional secondary action and never a prerequisite for updating.
- Export reuses the existing full JSON export. It does not create a separate backup format.
- Successful export copy is **Export created. Your data remains in Nugget.**
- Do not use **Backup downloaded** or imply that Nugget provides automatic backup or in-app restore.
- An update prompt must not interrupt microphone permission, recording, stopping, local persistence, or an unsaved recording draft.
- The waiting version cannot execute new database migrations until the person selects **Update now** and the new client loads.
- A failed export does not disable **Update now**.
- A failed update leaves the current application usable and offers **Try update again**.

## 3. User experience

### 3.1 Update prompt

When a new worker is waiting and capture is not locked, render a compact update surface above the mobile bottom navigation and within the normal content width on larger screens.

Required copy:

> **New version ready**
> Update Nugget when you're ready. You can export a copy of your local data first.

Required actions:

- **Update now** — primary amber action.
- **Export data** — secondary action using the existing full export.

The prompt is persistent while the worker remains waiting. It is not a modal and does not block reading, exporting, or navigating. The surface follows the existing ivory, navy, amber, and parchment system, uses plain language, supports keyboard focus, and keeps both touch targets at least 48 pixels high.

### 3.2 Export states

- While generating: **Creating export…** and disable only the export action.
- Success: **Export created. Your data remains in Nugget.** Keep **Update now** visible.
- Failure: show the existing safe error mapping with a **Try export again** action. Keep **Update now** visible.
- The export must be built locally and must include the same records as Settings: captures, recordings, transcripts, extraction runs, ideas, categories, tags, actions, and permitted settings.
- Nugget must not imply that the export can currently be restored inside the application.

### 3.3 Capture safety

The update provider owns a global capture-lock signal. The recording flow sets the lock during:

- microphone permission acquisition;
- active recording;
- stopping and blob finalization;
- local save;
- any retained unsaved draft awaiting a retry.

While locked, the update may be detected and retained in memory, but the prompt is not rendered and activation is prohibited. Once the draft is durably saved or discarded and the lock clears, the prompt may appear. Background queue processing does not block an update because each processing stage is persisted and resumable.

## 4. Service-worker lifecycle

### 4.1 Release identity

Every deployment must return a service-worker script containing a unique, non-secret release identifier. The preferred production identifier is Vercel's `VERCEL_DEPLOYMENT_ID`, falling back to `VERCEL_GIT_COMMIT_SHA`; local production builds use a generated build-time fallback. The identifier is safe to expose and may be shortened for the Settings display.

Serve the worker through a same-origin `/sw.js` route with JavaScript content type, root scope, and revalidation/no-cache headers appropriate for service-worker update checks. The release identifier must be embedded in the response body and cache name so a deployment changes the worker bytes and creates a distinct shell cache.

This avoids relying on developers to remember to edit a static cache-version string whenever application code changes.

### 4.2 Installation and waiting

- Install the new shell cache, but do not call `skipWaiting()` automatically.
- If shell precaching fails, installation fails and the current active worker remains in control.
- Registration observes an already-waiting worker and subsequent `updatefound`/installing-state transitions.
- A worker is offered as an update only when an existing controller is present. First installation must not show **New version ready**.
- Call `registration.update()` on initial registration, when the document becomes visible, when the window regains focus, and when connectivity returns. Coalesce checks so repeated foreground events do not create concurrent update requests.

### 4.3 User-controlled activation

Selecting **Update now**:

1. Rechecks that capture is unlocked and a waiting worker still exists.
2. Disables the update actions and shows **Updating Nugget…**.
3. Sends `{ type: 'SKIP_WAITING' }` to the waiting worker.
4. The worker handles that message and calls `self.skipWaiting()`.
5. Activation deletes older `nugget-shell-*` caches and calls `clients.claim()`.
6. The application listens for one `controllerchange` and reloads exactly once.
7. The newly loaded application opens the existing IndexedDB database, allowing Dexie's transactional migration to run under the new version.

A one-shot reload guard prevents loops when browsers deliver duplicate lifecycle events.

### 4.4 Failure and timeout behavior

- Registration or update-check failures remain non-fatal and do not replace the current working application.
- If no waiting worker exists when **Update now** is selected, re-run one update check and restore the prompt state if still unavailable.
- If `controllerchange` does not occur within a bounded timeout, stop showing the busy state and offer **Try update again**. Do not repeatedly reload.
- If the device goes offline after the worker is waiting, local export remains available. Activation may proceed only if the waiting worker and its shell cache are complete.
- Errors must not expose service-worker internals, deployment identifiers, local data, or stack traces.

## 5. Application architecture

### 5.1 Update provider

Add an application-level update provider responsible for:

- service-worker registration and update checks;
- `waiting` worker state;
- capture-lock state;
- export state and messages;
- activation and one-shot reload;
- a stable public interface for Settings.

The current registration-only component is replaced or absorbed by this provider. `AppShell` renders the update prompt so it is available on Capture, Ideas, Actions, detail, review, and Settings screens without duplicating lifecycle code.

### 5.2 Capture integration

`RecorderPanel` continues calculating the authoritative capture lock. `HomeScreen` forwards every lock change to the update provider in addition to hiding its own header/navigation. The recorder must publish the locked state before microphone permission is requested and retain it through local persistence or draft disposal. Screens without an active recorder default to unlocked, and **Update now** rechecks the lock immediately before activation to close the tap-race boundary.

### 5.3 Shared export operation

Extract the Settings export action into a small reusable client service or hook that calls `buildFullExport()` and `downloadText()`. Settings and the update prompt use the same filename, schema, serialization, and safe error behavior.

### 5.4 Settings controls

The About or Offline section shows:

- current short release identifier;
- **Check for updates**;
- **Update now** when a worker is waiting;
- the same optional **Export data** action while an update is waiting.

Manual checking reports one of: **Nugget is up to date**, **New version ready**, or a recoverable check failure. It does not claim that the server has no newer deployment when the browser cannot reach the network.

## 6. Data and migration safety

- Local IndexedDB data is not stored in the service-worker cache and is not deleted during cache cleanup.
- Export runs before worker activation and therefore before new database code can migrate the database.
- Dexie migrations remain transactional and independently tested. Update UX does not make a failed migration safe by itself.
- Future destructive or irreversible schema changes require their own explicit migration design, backward-compatibility decision, and restore strategy.
- The current JSON export is a portable copy but Nugget does not yet support in-app import/restore. The interface must state only what is true.

## 7. First controlled-update rollout

The worker currently deployed before this feature activates immediately. The first release of this controlled lifecycle cannot retroactively add an update prompt to a page already executing the old client code.

For that one transition:

1. An installed copy must be opened online so the existing registration can discover the changed worker.
2. The person may need to fully close and reopen the home-screen app after the new worker installs or activates.
3. Once the new update provider is loaded, subsequent deployments use the controlled **Update now** workflow.

Document this one-time instruction in the release handoff. Do not present it as the permanent update experience.

## 8. Verification

### 8.1 Focused automated checks

- Development does not register a worker; production registers once with root scope.
- First installation does not show an update prompt.
- An existing `registration.waiting` worker produces **New version ready**.
- An installing worker produces the prompt only after reaching `installed` with an existing controller.
- Foreground, focus, and online events request an update without concurrent duplicate calls.
- Capture lock suppresses the prompt and prevents activation; clearing the lock reveals the retained update.
- **Export data** uses the same full export operation as Settings and leaves **Update now** enabled.
- Export success uses **Export created. Your data remains in Nugget.**
- Export failure permits retry and does not block update.
- **Update now** sends only `SKIP_WAITING` to the waiting worker.
- `controllerchange` reloads exactly once.
- Activation timeout returns to a retryable state without a reload loop.
- The worker source embeds the release identifier, does not auto-skip waiting during install, handles `SKIP_WAITING`, deletes only old `nugget-shell-*` caches, and never caches `/api/*` or user content.

### 8.2 Browser and real-device checks

- Install the current production version, deploy a second version, foreground the app, and observe the prompt.
- Verify optional export from the installed iPhone home-screen app and confirm the original local records remain present.
- Start recording before an update is detected; verify no prompt or reload until **Stop & save** completes.
- Select **Update now**, verify one reload, verify the displayed release changes, and confirm recordings, ideas, categories, and actions remain present.
- Repeat once offline with an already-waiting worker, and once with an update-check network failure.
- Confirm API responses, recordings, transcripts, exports, and IndexedDB content never enter Cache Storage.

## 9. Acceptance criteria

- Every Vercel deployment changes the service-worker release identity without a manual cache-name edit.
- Installed users are notified of a waiting version from inside Nugget.
- No update automatically interrupts active or unsaved capture work.
- Users can optionally export a full copy before activation.
- Update copy is accurate and does not imply automatic backup or restore.
- Selecting **Update now** activates the waiting worker and reloads once.
- Existing local data survives the verified update and current migration path.
- Failures preserve the working version and provide a concrete retry.
- Focused tests, production build, deployed smoke checks, and a physical iPhone installed-app update test pass before this is called complete.

## 10. References

- [Service Workers specification](https://www.w3.org/TR/service-workers/)
- [MDN: `ServiceWorkerRegistration.update()`](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/update)
- [MDN: `controllerchange`](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/controllerchange_event)
- [MDN: `skipWaiting()`](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting)
- [Vercel system environment variables](https://vercel.com/docs/environment-variables/system-environment-variables)
