# TASK-11-03 — Offline tests

> Epic: EPIC-11 · Priority: P0 · Est: M · Depends on: EPIC-01/02
> PRD: §20, NFR-004 · Docs: [architecture §1](../../product/01-architecture.md)

## Objective

Prove the app's offline guarantees hold.

## Implementation steps

1. Playwright with network disabled: app loads from cache after a prior online
   visit; navigation between cached routes works (NFR-004).
2. Save a recording offline and confirm it appears in the library (AC-002 offline).
3. Browse existing ideas + play local recordings offline (AC-003).
4. Enqueue processing while a cloud provider is unavailable/offline → job is
   queued (not lost), surfaces the offline message (UX §4), and runs on
   reconnect (or with the mock provider).

## Acceptance criteria

- Cached app loads + navigates offline.
- Offline save and offline browse/playback work.
- Processing offline queues safely without data loss.

## Out of scope

Service-worker implementation (01-05); queue impl (EPIC-05).
</content>
