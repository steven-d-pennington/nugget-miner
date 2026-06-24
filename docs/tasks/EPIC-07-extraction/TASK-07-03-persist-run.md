# TASK-07-03 — Persist ExtractionRun + queue integration

> Epic: EPIC-07 · Priority: P0 · Est: S · Depends on: 07-02, EPIC-05
> PRD: FR-401, FR-403 · Docs: [data model §3](../../product/02-data-model.md)

## Objective

Run extraction through the queue, validate, and persist the raw run linked to the
transcript and idea.

## Implementation steps

1. In the runner (05-02), for `extraction` jobs: resolve the provider, call
   `extract({ ideaId, transcript, context })`, then `parseExtractionResult` the
   output (07-01). On validation failure → `ValidationError` → failed job (05-03).
2. Persist an `extractionRuns` row via `extractionRunRepository.create` with
   `rawJson`, `preset`, `promptVersion`, `schemaVersion`, `status:'complete'`,
   convenience `summary`, and `warnings`.
3. Set `idea.status` (`extracting` → `reviewed` happens after review; mark a
   `needs-review` signal via pending items in 07-04).
4. Idempotency: a re-run creates a **new** ExtractionRun (history preserved); does
   not mutate prior runs (data model §5).

## Files to create / modify

- `src/lib/services/processingRunner.ts` (extraction branch)

## Acceptance criteria

- Extraction output is validated before persistence; invalid output fails the job
  safely (recording/transcript intact).
- A new ExtractionRun is stored per run, linked to transcript + idea.
- `promptVersion`/`schemaVersion` recorded; prior runs untouched.

## Out of scope

Pending-item materialization + review (07-04/05).
</content>
