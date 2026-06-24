# TASK-09-04 — JSON database export

> Epic: EPIC-09 · Priority: P0 · Est: S · Depends on: EPIC-02
> PRD: FR-702, NFR-008 · Docs: [data model §5](../../product/02-data-model.md)

## Objective

Export all structured app data to a portable JSON file (no account, no audio
blobs by default).

## Implementation steps

1. Add `ExportService.toJson(scope)` serializing all entities (ideas, transcripts,
   extractionRuns, nuggets, actionItems, questions, projects, tags, settings, and
   recording **metadata** — excluding the Blob by default) plus a header with
   `schemaVersion` and `exportedAt`.
2. Default scope = entire database; allow selection scope too.
3. Trigger download; record via `exportRepository.record`.
4. Document the audio-exclusion default (audio ZIP is FR-706, deferred).

## Files to create / modify

- `src/lib/services/ExportService.ts` (json branch)

## Acceptance criteria

- Full-database JSON includes all structured entities + `schemaVersion`.
- Recording Blobs are excluded by default (metadata retained).
- Export is offline and recorded.

## Out of scope

Import (09-05); audio packaging (P2).
</content>
