# TASK-08-01 — Actions screen + grouping/filters

> Epic: EPIC-08 · Priority: P0 · Est: M · Depends on: EPIC-02
> PRD: §8, FR-501, FR-503 · Docs: [UX §3, §4](../../product/03-ux-guidelines.md)

## Objective

Build the Actions view listing accepted/manual actions, grouped and filterable.

## Implementation steps

1. Build `src/features/actions/ActionsScreen.tsx` at `/actions`, loading via
   `actionItemRepository.list(filters)`.
2. Default grouping by status (Open / Done / Archived); allow grouping/filtering
   by project, priority, and due date (FR-503). Surface overdue items.
3. Each row shows title, priority, due date (UX §9), project, and a source badge
   (idea-linked vs manual) linking back to the idea.
4. Implement loading/empty/error states (UX §4); empty uses the canonical Actions copy.

## Files to create / modify

- `src/features/actions/ActionsScreen.tsx`, `ActionListItem.tsx`, filter controls
- `src/app/actions/page.tsx`

## Acceptance criteria

- Actions list groups by status and filters by project/priority/due date.
- Overdue actions are visually distinguished (not by color alone; UX §7).
- Rows link to their source idea (or indicate manual).
- Empty state shows the canonical copy.

## Out of scope

CRUD/status transitions (08-02); manual creation (08-03).
</content>
