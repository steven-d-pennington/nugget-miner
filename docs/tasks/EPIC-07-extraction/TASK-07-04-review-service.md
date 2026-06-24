# TASK-07-04 — ReviewService (raw → pending → accepted)

> Epic: EPIC-07 · Priority: P0 · Est: M · Depends on: 07-03
> PRD: §12, FR-402, FR-403, §14 · Docs: [data model §3–4](../../product/02-data-model.md)

## Objective

Convert a raw ExtractionRun into editable pending items and persist user
decisions, keeping everything traceable to the source span.

## Implementation steps

1. Implement `src/lib/services/ReviewService.ts`:
   - `materialize(runId)` → create `nuggets`/`questions` (`status:'pending'`) and
     **pending** action drafts from the run (actions stay as drafts until
     accepted, to avoid polluting Actions). Each carries `sourceSpan` +
     `extractionRunId` (FR-403).
   - `acceptNugget/rejectNugget/updateNugget`, same for questions.
   - `acceptAction(draft, edits)` → creates an `actionItems` row
     (`status:'open'`) linked to idea + run; `rejectAction`; `updateAction`.
   - `regenerate(ideaId, preset?)` → enqueue a fresh extraction job.
2. When all items are resolved, set `idea.status:'reviewed'` and recompute
   `actionCount`.
3. Treat AI output strictly as suggestions until accepted (§14).

## Files to create / modify

- `src/lib/services/ReviewService.ts`, `ReviewService.test.ts`

## Acceptance criteria

- `materialize` creates pending nuggets/questions + action drafts with source links.
- Accept persists final records; reject marks/drops them; edits are saved.
- Accepting an action creates a linked open `ActionItem` (supports AC-007).
- `regenerate` enqueues a new run without deleting prior accepted items.

## Out of scope

Review screen UI (07-05); Actions screen (EPIC-08).
</content>
