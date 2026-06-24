# TASK-06-03 — Persist transcript + queue integration

> Epic: EPIC-06 · Priority: P0 · Est: S · Depends on: 06-02, EPIC-05
> PRD: FR-302, FR-304 · Docs: [data model §3](../../product/02-data-model.md)

## Objective

Wire transcription into the processing runner so results persist and chain into
extraction.

## Implementation steps

1. In the runner (05-02), for `transcription` jobs: resolve the provider, call
   `transcribe`, then `transcriptRepository.upsert(ideaId, result)` and set
   `idea.status` (`transcribing` → `transcribed`).
2. Link `transcript.jobId` to the job; carry `provider`/`confidence`/`language`/
   `segments`.
3. On success, auto-enqueue an `extraction` job for the idea (EPIC-07 consumes it).
4. Ensure idempotency: re-running transcription updates (not duplicates) the transcript.

## Files to create / modify

- `src/lib/services/processingRunner.ts` (transcription branch)
- minor: `ideaRepository.setStatus` usage

## Acceptance criteria

- A transcription job persists a transcript linked to the recording/idea and
  updates idea status.
- Completion auto-enqueues extraction.
- Re-transcription replaces the prior transcript without duplicating rows.

## Out of scope

Transcript editing UI (06-04); extraction (EPIC-07).
</content>
