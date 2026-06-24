# EPIC-05 — Processing Queue

> Milestone M3 · Priority P0 · Feature F-4
> Product context: [architecture §3–4](../../product/01-architecture.md)

## Goal

Orchestrate transcription and extraction as local, observable, retryable,
cancellable jobs. Long jobs never freeze the UI; failures never harm the source
recording.

## Outcome / DoD

- AC-005: a failed job leaves the recording intact and offers retry / provider change.
- Jobs persist through queued → processing → complete/failed/canceled and survive reload.
- Mock providers run end-to-end through the queue with visible progress.

## Tasks

| ID | Title | Depends on |
| --- | --- | --- |
| [TASK-05-01](./TASK-05-01-queue-service.md) | ProcessingQueue service (enqueue/cancel/retry/subscribe) | EPIC-02 |
| [TASK-05-02](./TASK-05-02-job-runner.md) | Job runner/executor + provider dispatch | 05-01, EPIC-06/07 ifaces |
| [TASK-05-03](./TASK-05-03-failure-recovery.md) | Failure recovery + retry semantics (AC-005) | 05-02 |
| [TASK-05-04](./TASK-05-04-queue-hook-ui.md) | `useProcessingQueue` hook + progress UI | 05-01 |
| [TASK-05-05](./TASK-05-05-dev-inspector.md) | Dev queue inspector | 05-01 |

## Sequencing

05-01 → 05-02 → 05-03; 05-04 parallel after 05-01; 05-05 last.
</content>
