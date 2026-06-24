# TASK-08-03 — Manual action creation

> Epic: EPIC-08 · Priority: P1 · Est: S · Depends on: 08-01
> PRD: FR-505 · Docs: [data model §3](../../product/02-data-model.md)

## Objective

Let users add actions that do not originate from a recording.

## Implementation steps

1. Add a "New action" entry on the Actions screen opening the `ActionEditor`
   (08-02) with no `ideaId` (manual).
2. Persist via `actionItemRepository.create` (no `ideaId`/`extractionRunId`);
   default `status:'open'`, `priority:'medium'`.
3. Display manual actions with a "Manual" badge (no source back-link).

## Files to create / modify

- `src/features/actions/ActionsScreen.tsx` (new-action entry)

## Acceptance criteria

- A manual action is created without a source idea and appears in the list.
- Manual actions are visually distinguished from idea-linked ones.
- They participate in all filters/status transitions.

## Out of scope

Source linking (only for extracted actions, 08-04).
</content>
