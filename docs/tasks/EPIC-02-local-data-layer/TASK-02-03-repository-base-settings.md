# TASK-02-03 — Repository base, typed errors, settings repository

> Epic: EPIC-02 · Priority: P0 · Est: M · Depends on: 02-02
> PRD: §11, §12, §24 · Docs: [data model §1, §6](../../product/02-data-model.md), [architecture §5](../../product/01-architecture.md)

## Objective

Establish the repository pattern, the typed error hierarchy, shared helpers
(ID/timestamp generation), and the singleton `settings` repository with defaults.

## Implementation steps

1. Create `src/lib/errors.ts` with `NuggetError` base and subclasses
   `StorageError`, `ValidationError`, `ProviderError`, `ConsentRequiredError`
   (each with a stable `code`).
2. Create `src/lib/repositories/_helpers.ts`: `newId()`
   (`crypto.randomUUID()`), `now()`, and a `withTimestamps` helper for
   create/update.
3. Establish the repository convention: each repository is a plain object/module
   exporting async functions with explicit return types; it imports `getDb()` and
   maps Dexie errors to `StorageError`.
4. Implement `settingsRepository`: `get()`, `ensureDefaults()` (creates the
   `id:'app'` singleton with documented defaults: `privacyMode:'local-only'`,
   `processingMode:'local'`, providers `'mock'`, preset `'general-thought'`,
   `retentionPolicy:'keep-forever'`, `encryptionEnabled:false`), `update(patch)`.
5. Call `ensureDefaults()` on app bootstrap (export a helper for EPIC-01 to invoke).

## Files to create / modify

- `src/lib/errors.ts`
- `src/lib/repositories/_helpers.ts`, `src/lib/repositories/settingsRepository.ts`
- `src/lib/repositories/index.ts` barrel

## Acceptance criteria

- `ensureDefaults()` is idempotent and yields the documented default settings.
- `update()` merges a patch and bumps `updatedAt`.
- Dexie failures surface as `StorageError`, not raw exceptions.
- Repository modules contain the only `getDb()` usages (besides `lib/db`).
- Unit tests cover defaults + update against `fake-indexeddb`.

## Out of scope

Other entity repositories (02-04..06).
</content>
