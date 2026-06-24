# TASK-04-06 — Archive + delete (cascade) with confirm

> Epic: EPIC-04 · Priority: P0 · Est: S · Depends on: 04-03, EPIC-02 (02-07)
> PRD: FR-204, AC-010, §14, §15 · Docs: [UX §6](../../product/03-ux-guidelines.md), [data model §4](../../product/02-data-model.md)

## Objective

Let users archive (hide) or permanently delete an idea, with a confirm dialog
that names what is removed and honors the detach setting.

## Implementation steps

1. Add **Archive** toggle (`ideaRepository.setArchived`) — reversible, hides from
   default library view.
2. Add **Delete** with a confirm `<dialog>` (UX §6) that names what is removed
   (recording, transcript, extraction, nuggets, questions, linked actions) and
   defaults focus to Cancel.
3. On confirm, call `ideaRepository.deleteCascade(ideaId, { deleteLinkedActions })`
   reading the setting from `settingsRepository`; navigate back to library with a
   "Deleted" toast.
4. Never auto-delete; respect §14 (no silent destruction).

## Files to create / modify

- `src/features/library/IdeaDetailScreen.tsx` (archive/delete controls)
- `src/components/ConfirmDialog.tsx` (reusable)

## Acceptance criteria

- AC-010: confirmed delete removes the recording, transcript, extraction runs,
  nuggets, questions, and linked actions (or detaches them per setting).
- Confirm dialog names consequences; Cancel is default focus.
- Archive hides the idea from default view and is reversible.

## Out of scope

Cascade implementation itself (02-07); retention-based audio deletion (EPIC-10).
</content>
