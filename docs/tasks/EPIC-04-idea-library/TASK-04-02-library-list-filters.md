# TASK-04-02 — Library list + filters

> Epic: EPIC-04 · Priority: P0 · Est: M · Depends on: EPIC-02
> PRD: FR-201, §8, NFR-005, AC-003 · Docs: [UX §3, §4, §9](../../product/03-ux-guidelines.md)

## Objective

Build the searchable, filterable, reverse-chronological idea list.

## Implementation steps

1. Build `src/features/library/LibraryScreen.tsx` listing ideas via
   `ideaRepository.listByRecency(filters)` with title, relative/absolute date
   (UX §9), duration, processing status badge, and action count (FR-201).
2. Add filter controls: project, tag, status, processing state, favorite,
   archived (archived hidden by default). Reflect filters in URL query for
   shareable/back-button state.
3. Implement list virtualization or windowing if needed to stay instant at
   hundreds of items (NFR-005); avoid loading recording Blobs in the list.
4. Implement loading/empty/error/populated states (UX §4); empty shows capture copy.
5. Each row links to `/idea/[ideaId]`.

## Files to create / modify

- `src/features/library/LibraryScreen.tsx`, `IdeaListItem.tsx`, filter components
- `src/app/library/page.tsx`

## Acceptance criteria

- List is reverse-chron with all FR-201 fields; archived excluded by default.
- Each documented filter narrows results and persists in the URL.
- No Blob loads in the list path; remains responsive with hundreds of ideas.
- Works offline (AC-003) since data is local.

## Out of scope

Full-text search (EPIC-09 provides search; this is metadata filtering).
</content>
