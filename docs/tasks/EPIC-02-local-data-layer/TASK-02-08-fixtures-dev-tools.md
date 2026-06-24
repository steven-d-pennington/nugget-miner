# TASK-02-08 — Fixtures, dev DB tools, migration test

> Epic: EPIC-02 · Priority: P0/P1 · Est: M · Depends on: 02-04, 02-05, 02-06
> PRD: FR-804, §24, NFR-003 · Docs: [data model §5, §7](../../product/02-data-model.md)

## Objective

Provide deterministic fixtures, developer database tools, and the migration
preservation test that protects user data across schema upgrades.

## Implementation steps

1. Build fixture builders in `src/test/fixtures` (deterministic seeds): short
   recording, long recording, idea-with-no-transcript, failed-transcript,
   failed-extraction, many-actions, many-tags, deleted-source (detached actions).
   Provide a `seedSampleDatabase()` that loads a representative mix.
2. Add a dev tools module (`src/lib/dev/dbTools.ts`): `seed()`, `clearAll()`,
   `exportDatabaseJson()`, `inspectJobQueue()` — guarded to dev/Settings-debug only.
3. Wire these into a Settings "Developer" section stub (full UI in EPIC-10), or a
   `/settings` debug panel behind an env flag.
4. Add a **second Dexie version** with a no-op/illustrative `upgrade()` (e.g. add
   an index) to exercise the migration path, keeping v1 untouched.
5. Write a migration test: seed data on v1 schema, open at v2, assert all ideas
   and recordings survive intact (NFR-003).

## Files to create / modify

- `src/test/fixtures/*.ts`, `src/lib/dev/dbTools.ts`
- `src/lib/db/schema.ts` (add version 2)
- `src/lib/db/migrations.test.ts`

## Acceptance criteria

- All eight fixture scenarios build deterministically and persist correctly.
- `seed`/`clearAll`/`exportDatabaseJson`/`inspectJobQueue` work against the real DB.
- Migration test proves a v1→v2 upgrade preserves ideas + recordings.
- Dev tools are not exposed in production builds.

## Out of scope

Production export/import (EPIC-09); full Settings UI (EPIC-10).
</content>
