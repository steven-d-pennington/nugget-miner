# TASK-08-04 — Source-link navigation + action-count sync

> Epic: EPIC-08 · Priority: P0 · Est: S · Depends on: 08-02, EPIC-04
> PRD: FR-504, FR-201 · Docs: [data model §4](../../product/02-data-model.md)

## Objective

Keep each action navigable back to its source idea and keep the idea's
denormalized `actionCount` accurate.

## Implementation steps

1. On idea-linked actions, render a back-link to `/idea/[ideaId]` and, where
   available, scroll/highlight the `sourceSpan` in the transcript (FR-504).
2. Render the idea's accepted actions inside the Idea Detail Actions section
   (`actionItemRepository.listByIdeaId`).
3. Recompute `idea.actionCount` on create/accept/delete/detach so the library
   (FR-201) stays accurate; centralize via `ideaRepository.recomputeActionCount`.
4. Ensure detach-on-delete (02-07) leaves manual-style orphan actions navigable
   but unlinked.

## Files to create / modify

- Idea Detail actions section; Actions row back-link
- hooks into create/accept/delete paths to call `recomputeActionCount`

## Acceptance criteria

- Each idea-linked action navigates to its source idea (and span where possible).
- Idea Detail lists its actions; library action counts match reality after changes.
- Detached actions remain usable without a dangling link.

## Out of scope

External export (08-05).
</content>
