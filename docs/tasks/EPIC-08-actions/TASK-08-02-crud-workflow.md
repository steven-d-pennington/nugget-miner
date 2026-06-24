# TASK-08-02 — Action CRUD + status workflow

> Epic: EPIC-08 · Priority: P0 · Est: M · Depends on: 08-01
> PRD: FR-502 · Docs: [data model §2–3](../../product/02-data-model.md)

## Objective

Support the full action lifecycle from the Actions screen and Idea Detail.

## Implementation steps

1. Implement edit (title, description, priority, due date, project, tags) via
   `actionItemRepository.update`.
2. Implement status transitions: complete (`open→done`), reopen (`done→open`),
   archive (`→archived`), and delete (with confirm; UX §6).
3. Provide quick complete (checkbox) on rows with optimistic update + undo toast.
4. Keep transitions accessible and announced (UX §7); recompute the idea's
   `actionCount` on changes (08-04 wires the link).

## Files to create / modify

- `src/features/actions/ActionEditor.tsx`
- row-level controls in `ActionsScreen.tsx` / Idea Detail actions section

## Acceptance criteria

- Create/edit/complete/reopen/archive/delete all persist correctly (FR-502).
- Quick-complete is optimistic with undo; delete confirms first.
- Status changes are keyboard-accessible and announced.

## Out of scope

Manual-only creation flow (08-03); export (08-05).
</content>
