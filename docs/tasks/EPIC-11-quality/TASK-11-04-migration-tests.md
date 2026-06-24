# TASK-11-04 — Data-migration tests

> Epic: EPIC-11 · Priority: P0 · Est: S · Depends on: EPIC-02
> PRD: §20, NFR-003 · Docs: [data model §5](../../product/02-data-model.md)

## Objective

Ensure schema upgrades never lose user data.

## Implementation steps

1. Extend the 02-08 migration test into a suite: for each released Dexie version
   bump, seed data on the old version, open at the new version, and assert ideas +
   recordings (and other entities) survive intact.
2. Add a guard test that fails if a released `version(n)` store definition is
   edited in place (enforce append-only via a snapshot of expected schemas).
3. Verify `schemaVersion` in JSON export matches the DB and that import upgrades
   older payloads (09-05).

## Acceptance criteria

- Every version bump has a preservation test that passes (NFR-003).
- Editing a released schema version trips the guard test.
- Export/import schema-version handling is verified.

## Out of scope

New schema features themselves.
</content>
