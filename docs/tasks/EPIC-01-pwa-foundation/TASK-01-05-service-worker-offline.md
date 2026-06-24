# TASK-01-05 — Serwist service worker + offline app shell

> Epic: EPIC-01 · Priority: P0 · Est: M · Depends on: 01-04
> PRD: NFR-004 · Docs: [architecture §1](../../product/01-architecture.md)

## Objective

Provide an offline-capable app shell so the installed app loads and navigates
with no network after first visit.

## Implementation steps

1. Integrate Serwist (`@serwist/next`) into `next.config.mjs`; create the service
   worker entry (`src/app/sw.ts`) with default precaching of the build manifest.
2. Configure runtime caching: app shell + static assets precached
   (cache-first/stale-while-revalidate); navigation requests fall back to a
   cached shell when offline. **Do not** cache `/api/**` (content routes stay
   network-only; no user content in SW caches).
3. Register the service worker on the client (production only); guard dev to
   avoid stale-cache friction.
4. Add an offline indicator (uses `navigator.onLine` + `online`/`offline`
   events) surfaced in the header for use by later epics.
5. Ensure the SW does not interfere with IndexedDB (EPIC-02) or audio blobs.

## Files to create / modify

- `next.config.mjs`, `src/app/sw.ts`
- `src/app/register-sw.tsx` (client registration)
- `src/hooks/useOnlineStatus.ts`

## Acceptance criteria

- After one online visit, reloading with the network offline still loads the app
  shell and allows navigation between cached routes (NFR-004).
- `/api/**` requests are never served from cache.
- No service-worker cache contains audio/transcript content.
- Offline status is observable via `useOnlineStatus`.
- Verified by a Playwright offline test stub (completed in 01-06/EPIC-11).

## Out of scope

Offline data persistence (EPIC-02), offline queueing of jobs (EPIC-05).
</content>
