# EPIC-05 — Processing Queue

> Source: [Nugget PRD](../../Nugget_PRD.md) §7 J2, §9 (Transcription job state), §12, §18 Milestone 3, §19
> Status: Not started · Priority: P0 · Milestone: M3

## Summary

Implement the local `ProcessingQueue` that orchestrates transcription and
extraction jobs: a `processingJobs` model with statuses, progress, retry,
cancel, and failure recovery, wired to mock providers for MVP. Long jobs must
never freeze the UI and failures must never harm the source recording.

## Scope

- `processingJobs` lifecycle (PRD §11): id, ideaId, type, provider, status,
  progress, errorMessage, createdAt, updatedAt.
- Job statuses (FR-304): queued, processing, complete, failed, canceled.
- Enqueue transcription and extraction jobs; "Process Now" entry from Recorder
  (EPIC-03) and Idea Detail (EPIC-04).
- Retry and cancel; failure recovery that preserves source recording (NFR-007).
- Progress/retry state surfaced to UI (PRD §7 J2 step 4).
- Mock provider wiring (deterministic) for MVP; real adapters behind same queue (EPIC-06/07, M5).

### Functional requirements (PRD §9)

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-304 | P0 | Track transcription job state: queued, processing, complete, failed, canceled. |
| FR-306 | P1 | Support retry and provider switching without losing source recording. |

## Related PRD requirements

- §7 J2 — create a processing job and show progress/retry state.
- §12 — ProcessingQueue stores jobs locally; retry, cancel, failure recovery.
- AC-005 — on failure, original recording stays intact; user can retry or change provider.
- NFR-005 — long jobs must not freeze the UI.
- NFR-007 — processing failures leave the recording intact and present a retry path.
- R-004 (PRD §21) — background queue work for heavy operations.

## Acceptance criteria

- AC-005: A failed transcription/extraction leaves the recording intact and
  offers retry / provider change.
- Jobs transition through queued → processing → complete/failed/canceled and
  persist across reload (FR-304).
- Cancel stops a job; retry re-runs without losing the source recording (FR-306).
- UI reflects progress without blocking interaction (NFR-005).

## Implementation notes

- Run jobs off the main thread where practical (e.g. async tasks / worker) so the
  UI stays responsive (NFR-005, R-007).
- Provider switching updates `processingJobs.provider`; do not mutate the
  `recordings` blob on failure (NFR-007).
- Expose a dev queue inspector (ties to FR-804 / EPIC-02).
- Define `type: "transcription" | "extraction"` and dispatch to the matching
  provider interface (EPIC-06 / EPIC-07).

## Definition of Done

- `ProcessingQueue` with persistent jobs, full status lifecycle, retry, cancel.
- Mock providers run end-to-end through the queue with visible progress.
- AC-005 passes; failures never corrupt or remove the source recording.

## Dependencies

- EPIC-02 (`processingJobs` repo), EPIC-03 (recordings, Process Now).
- Drives EPIC-06 (transcription) and EPIC-07 (extraction).
</content>
