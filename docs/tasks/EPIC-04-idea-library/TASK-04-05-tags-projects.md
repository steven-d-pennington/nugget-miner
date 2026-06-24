# TASK-04-05 — Tags & projects assignment

> Epic: EPIC-04 · Priority: P0 · Est: M · Depends on: 04-02, 04-03
> PRD: FR-203, §11 · Docs: [data model §3](../../product/02-data-model.md)

## Objective

Support organizing ideas with tags and projects, keeping tag usage counts and
library filters consistent.

## Implementation steps

1. Build a `TagEditor` (add/remove tags on an idea): on add, call
   `tagRepository.ensure(name)` + `incrementUsage`; on remove, `decrementUsage`;
   update `idea.tags`.
2. Build a `ProjectPicker` (assign/clear `projectId`); support creating a project
   inline via `projectRepository.create`.
3. Wire both into Idea Detail metadata; reflect changes in library filters (04-02).
4. Normalize tag names (trim/lowercase compare) to avoid duplicates.

## Files to create / modify

- `src/features/library/{TagEditor,ProjectPicker}.tsx`
- integrate into `IdeaDetailScreen.tsx`

## Acceptance criteria

- Adding/removing tags updates the idea and adjusts `tags.usageCount` correctly.
- Assigning a project (incl. inline create) updates the idea and library filters.
- Duplicate tag names are prevented by normalization.

## Out of scope

Bulk tag/project assignment (04-07); project management screen (deferred).
</content>
