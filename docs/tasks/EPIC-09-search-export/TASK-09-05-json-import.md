# TASK-09-05 — JSON import + dedupe (P1)

> Epic: EPIC-09 · Priority: P1 · Est: M · Depends on: 09-04
> PRD: FR-703, R-002 · Docs: [data model §5](../../product/02-data-model.md)

## Objective

Re-import a prior JSON export, reconciling duplicates safely so users can restore
or merge data.

## Implementation steps

1. Add `ExportService.importJson(file)`: parse + **Zod-validate** the payload
   (`src/lib/validation/importPayload.ts`); check `schemaVersion` and
   upgrade/transform older payloads where possible (data model §5).
2. Reconcile by stable `id`: existing → skip or update (offer "merge" vs
   "replace"); missing → insert. Never silently overwrite without a chosen
   strategy; surface a summary (added/updated/skipped).
3. Recompute derived fields after import (`actionCount`, tag `usageCount`) and
   reindex search (09-01).
4. Run within a transaction; roll back on validation failure.

## Files to create / modify

- `src/lib/services/ExportService.ts` (import), `src/lib/validation/importPayload.ts`
- import UI in Settings (EPIC-10)

## Acceptance criteria

- A file produced by 09-04 re-imports cleanly and round-trips.
- Duplicate ids are reconciled per chosen strategy; a summary is shown.
- Invalid payloads are rejected without partial writes.

## Out of scope

Conflict UI polish beyond the summary; audio import.
</content>
