# TASK-07-05 — Nugget Review UI (accept/edit/reject/regenerate)

> Epic: EPIC-07 · Priority: P0 · Est: M · Depends on: 07-04, EPIC-04
> PRD: §8, FR-402, FR-405, AC-007, §14 · Docs: [UX §3, §4, §9](../../product/03-ux-guidelines.md)

## Objective

Build the focused review surface where users turn suggestions into trusted saved
items.

## Implementation steps

1. Build `src/features/review/ReviewScreen.tsx` at `/review/[ideaId]` listing the
   latest run's pending nuggets, actions, and questions, each marked **"Suggested"**
   (UX §9) with category/priority/confidence and a **source snippet** from the
   transcript span (FR-405).
2. Per item: Accept, Edit (inline), Reject. Provide **Accept all** and
   **Regenerate** (with preset choice) actions.
3. On accept/reject/edit call `ReviewService`; reflect updates optimistically.
4. Accepted actions link to Actions (EPIC-08); show a confirmation and the source
   back-link (AC-007).
5. Empty/loading/error states (UX §4); also surface run `warnings`.

## Files to create / modify

- `src/features/review/ReviewScreen.tsx` + item components
- `src/app/review/[ideaId]/page.tsx`

## Acceptance criteria

- AC-007: accepting an action makes it appear in Actions, linked to the source idea.
- Items show source snippets and are clearly marked as suggestions until accepted.
- Edit/reject/regenerate work and persist via ReviewService.
- Fully keyboard-accessible; warnings surfaced.

## Out of scope

Actions management screen (EPIC-08); cloud extraction (07-07).
</content>
