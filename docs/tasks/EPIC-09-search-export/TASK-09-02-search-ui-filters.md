# TASK-09-02 — Search UI + filters

> Epic: EPIC-09 · Priority: P0 · Est: M · Depends on: 09-01
> PRD: FR-602, FR-603, AC-008 · Docs: [UX §3, §4](../../product/03-ux-guidelines.md)

## Objective

Surface search in the Library with contextual results and filters.

## Implementation steps

1. Add a search input to the Library (or a dedicated `/search`); debounce queries
   into `SearchService.search`.
2. Render results with title, matched snippet (highlighted), match type badge,
   and a link to the idea (FR-602); jump to the matching section where feasible.
3. Add filters (FR-603): date range, project, tag, processing state, action
   status, favorite/archive — combinable with the query; reflect in URL.
4. Implement loading/empty ("No matches")/error states (UX §4).

## Files to create / modify

- `src/features/search/SearchBar.tsx`, `SearchResults.tsx`
- integrate into `LibraryScreen.tsx` (or `src/app/search/page.tsx`)

## Acceptance criteria

- AC-008: a matching term surfaces the idea with identifying context.
- Filters narrow results and combine with the text query; persisted in URL.
- Keyboard-accessible; empty/error states present.

## Out of scope

Index internals (09-01).
</content>
