# TASK-02-02 — Dexie instance, schema v1, migration scaffold

> Epic: EPIC-02 · Priority: P0 · Est: M · Depends on: 02-01
> PRD: §11, §24 · Docs: [data model §3, §5](../../product/02-data-model.md)

## Objective

Create the single Dexie database with all tables/indexes from the data model and
an append-only migration framework so schema upgrades never reset user data.

## Implementation steps

1. Create `src/lib/db/index.ts` exporting a typed `NuggetDB extends Dexie` with
   `Table<T, string>` properties for every entity.
2. In `src/lib/db/schema.ts`, define `db.version(1).stores({...})` using the
   exact index strings from data model §3 (e.g.
   `ideas: '&id, createdAt, status, projectId, favorite, archived, *tags'`).
3. Establish the migration convention: versions are append-only; document in a
   header comment that released versions must never be edited (only new
   `.version(n).upgrade()` added).
4. Export `SCHEMA_VERSION` and keep it in sync with the Dexie version.
5. Provide `getDb()` accessor and ensure the DB is a singleton (HMR-safe).

## Files to create / modify

- `src/lib/db/index.ts`, `src/lib/db/schema.ts`

## Acceptance criteria

- Opening the DB creates all tables with the specified primary keys and indexes.
- Compound/multi-entry indexes (`[status+createdAt]`, `*tags`) exist and are queryable.
- The Dexie instance is the only place importing `dexie` (architecture §2).
- A trivial round-trip (put/get an idea) works against `fake-indexeddb` in a test.

## Out of scope

Repository methods (02-03+), the real second migration + preservation test (02-08).
</content>
