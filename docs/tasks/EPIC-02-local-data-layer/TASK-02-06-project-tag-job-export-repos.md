# TASK-02-06 — Project / tag / processingJob / export repositories

> Epic: EPIC-02 · Priority: P0 · Est: M · Depends on: 02-03
> PRD: §11, FR-203, FR-304, FR-704 · Docs: [data model §3](../../product/02-data-model.md)

## Objective

Implement the supporting repositories for organization (projects, tags), the
processing queue's persistence, and export history.

## Implementation steps

1. `projectRepository`: `create`, `getById`, `list(includeArchived?)`,
   `update`, `setArchived`.
2. `tagRepository`: `ensure(name)` (create-or-get by unique name, init
   `usageCount`), `incrementUsage(name)`, `decrementUsage(name)`,
   `list()` (by usage desc), used when ideas/actions add/remove tags.
3. `processingJobRepository`: `create(job)` (`status:'queued', progress:0,
   attempts:0`), `getById`, `listByStatus`, `listByIdeaId`,
   `update(id, patch)` (bumps `updatedAt`), `listActive()`
   (queued+processing via `[status+createdAt]`).
4. `exportRepository`: `record(scope, format, itemCount)`, `listRecent()`.
5. Add a `storageRepository` helper exposing `estimateUsage()` (via
   `navigator.storage.estimate()`) and `largestRecordings(limit)` for FR-704.

## Files to create / modify

- `src/lib/repositories/{projectRepository,tagRepository,processingJobRepository,exportRepository,storageRepository}.ts`
- barrel update

## Acceptance criteria

- Projects CRUD + archive work and feed library filters.
- `tagRepository.ensure` is idempotent by unique name; usage counts adjust correctly.
- Processing jobs persist with full status lifecycle and `listActive()` ordering.
- `storageRepository.estimateUsage()` returns usage/quota where supported and
  degrades gracefully where not.
- Unit tests cover tag uniqueness/usage and job status queries.

## Out of scope

ProcessingQueue service logic (EPIC-05); export formatting (EPIC-09).
</content>
