# TASK-06-04 — Editable transcript UI (AC-006)

> Epic: EPIC-06 · Priority: P0 · Est: M · Depends on: 06-03, EPIC-04
> PRD: FR-303, AC-006 · Docs: [UX §4](../../product/03-ux-guidelines.md), [data model §3](../../product/02-data-model.md)

## Objective

Let users read and edit the transcript on Idea Detail, with edits feeding search
and re-extraction.

## Implementation steps

1. Build a `TranscriptSection` for Idea Detail: read mode + edit mode
   (`<textarea>`), Save/Cancel.
2. On save, call `transcriptRepository.updateText(ideaId, text)` (sets
   `edited:true`, bumps `updatedAt`); optimistic UI with rollback on error.
3. After an edit, trigger a search re-index (EPIC-09 seam) and offer
   **Re-run extraction** using the edited text (enqueue extraction).
4. Implement loading/empty (no transcript yet → "Process to generate")/error
   states (UX §4).

## Files to create / modify

- `src/features/library/TranscriptSection.tsx`
- integrate into `IdeaDetailScreen.tsx`

## Acceptance criteria

- AC-006: editing + saving the transcript updates stored text; subsequent search
  and re-extraction use the edited text.
- Empty state guides the user to process; errors are recoverable.
- Edit is keyboard-accessible and announces save.

## Out of scope

Search indexing internals (EPIC-09); extraction (EPIC-07).
</content>
