# TASK-02-05 — ExtractionRun / nugget / action / question repositories

> Epic: EPIC-02 · Priority: P0 · Est: M · Depends on: 02-03
> PRD: §11, FR-401..404, FR-501..504 · Docs: [data model §3, §4](../../product/02-data-model.md)

## Objective

Implement repositories for extraction runs and the items they produce, plus
action items (including manual actions).

## Implementation steps

1. `extractionRunRepository`: `create(run)` (stores `rawJson`, `preset`,
   `promptVersion`, `schemaVersion`, `status`, optional `summary`/`warnings`),
   `getByIdeaId`, `getLatest(ideaId)`, `setStatus`.
2. `nuggetRepository`: `bulkCreate(nuggets)`, `listByIdeaId`,
   `listByRun(runId)`, `updateStatus(id, status)`, `update(id, patch)`,
   `deleteByIdeaId`.
3. `questionRepository`: `bulkCreate`, `listByIdeaId`, `updateStatus`,
   `deleteByIdeaId`.
4. `actionItemRepository`:
   - `create(input)` (supports `ideaId` undefined → manual; defaults
     `status:'open'`, `priority` from input or `'medium'`, `tags:[]`).
   - `getById`, `update`, `setStatus(id, ActionStatus)`,
     `list(filters?)` (by status/priority/project/dueDate/tag),
     `listByIdeaId`, `detachFromIdea(ideaId)` (clears `ideaId`/`sourceSpan`),
     `deleteByIdeaId`.

## Files to create / modify

- `src/lib/repositories/{extractionRunRepository,nuggetRepository,questionRepository,actionItemRepository}.ts`
- barrel update

## Acceptance criteria

- Extraction run persists with raw JSON + version fields and is retrievable by idea/latest.
- Nuggets/questions bulk-create and filter by status (pending/accepted/rejected).
- Action items support manual creation (`ideaId` undefined) and full filter set.
- `detachFromIdea` clears link fields without deleting the action (supports 02-07).
- Unit tests cover create/list/filter/status transitions and manual actions.

## Out of scope

ReviewService orchestration (EPIC-07); Actions UI (EPIC-08).
</content>
