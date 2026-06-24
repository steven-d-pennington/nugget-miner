# TASK-04-04 — Rename + metadata edit

> Epic: EPIC-04 · Priority: P0 · Est: S · Depends on: 04-03
> PRD: FR-202 · Docs: [UX §9](../../product/03-ux-guidelines.md)

## Objective

Let users rename an idea and edit basic metadata inline.

## Implementation steps

1. Add inline title editing on Idea Detail (and optionally list) → persist via
   `ideaRepository.update`; optimistic UI with rollback on error.
2. Allow editing of basic metadata exposed in the Metadata section (title now;
   project/tags handled in 04-05). Validate non-empty title; fall back to default
   title format if cleared (UX §9).
3. Announce save via toast (UX §8); keep edits accessible (labeled input, ESC to cancel).

## Files to create / modify

- `src/features/library/IdeaDetailScreen.tsx` (inline editor) / `EditableTitle.tsx`

## Acceptance criteria

- Renaming persists and updates list + detail; empty title reverts to default.
- Optimistic update rolls back on a storage error.
- Editing is keyboard-accessible (enter to save, escape to cancel).

## Out of scope

Tags/projects (04-05); transcript editing (EPIC-06).
</content>
