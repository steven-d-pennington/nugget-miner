# TASK-05-01 — ProcessingQueue service

> Epic: EPIC-05 · Priority: P0 · Est: M · Depends on: EPIC-02
> PRD: §12, FR-304 · Docs: [architecture §3–4](../../product/01-architecture.md), [data model §3](../../product/02-data-model.md)

## Objective

Implement the queue that persists jobs and exposes enqueue/cancel/retry/subscribe
over `processingJobRepository`.

## Implementation steps

1. Implement `src/lib/services/ProcessingQueue.ts` matching the architecture §3
   interface: `enqueue`, `cancel`, `retry`, `subscribe`.
2. `enqueue` creates a `processingJobs` row (`status:'queued'`, `progress:0`,
   `attempts:0`) and triggers the runner (05-02) to pick it up; returns `jobId`.
3. Maintain an in-memory subscriber set notified on any job change; rehydrate
   active jobs from the DB on startup so a reload resumes/repairs state.
4. `cancel` sets `status:'canceled'` and signals the runner's `AbortController`.
5. `retry` re-queues a failed job (increments `attempts`) without touching source
   artifacts.
6. Enforce a small concurrency limit (e.g. 1–2) so the device isn't overloaded.

## Files to create / modify

- `src/lib/services/ProcessingQueue.ts`, `ProcessingQueue.test.ts`

## Acceptance criteria

- Enqueue persists a queued job and returns an id; subscribers are notified.
- Cancel/retry transition status correctly and persist.
- On startup, in-flight (`processing`) jobs are reconciled (re-queued or marked
  failed) — no jobs stuck silently.
- Concurrency limit respected.
- Tested against `fake-indexeddb` with a stub runner.

## Out of scope

Actual provider execution (05-02); UI (05-04).
</content>
