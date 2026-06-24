# TASK-04-07 — Favorites/pins + bulk actions (P1)

> Epic: EPIC-04 · Priority: P1 · Est: M · Depends on: 04-02
> PRD: FR-205, FR-206 · Docs: [UX §3, §6](../../product/03-ux-guidelines.md)

## Objective

Add favorites/pinning and multi-select bulk operations to the library.

## Implementation steps

1. Add a favorite toggle on rows + detail (`ideaRepository.toggleFavorite`); add
   a "Favorites" filter and optional pinned-to-top ordering (FR-205).
2. Add a selection mode in the library: checkboxes + a bulk action bar for
   **archive**, **delete**, **export** (EPIC-09), **assign project/tag** (FR-206).
3. Bulk delete reuses the confirm dialog (UX §6) and runs cascade per item in a
   batched transaction; show progress for large selections.
4. Keep selection state accessible (announce count; keyboard toggling).

## Files to create / modify

- `src/features/library/LibraryScreen.tsx` (selection mode)
- `src/features/library/BulkActionBar.tsx`

## Acceptance criteria

- Favoriting works and the Favorites filter/pinning behaves as specified.
- Bulk archive/delete/assign operate on the selection; delete confirms first.
- Bulk export hands the selection to EPIC-09's export (or a documented seam).
- Selection is keyboard- and SR-accessible.

## Out of scope

Export formatting (EPIC-09); project management screen.
</content>
