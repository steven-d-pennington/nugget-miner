# EPIC-08 — Actions

> Milestone M3 · Priority P0 · Feature F-6
> Product context: [data model §3](../../product/02-data-model.md),
> [UX §3](../../product/03-ux-guidelines.md)

## Goal

Give users a clear "what to do next" surface: action CRUD with status workflow,
filters/grouping, manual actions, and a persistent back-link to the source idea.

## Outcome / DoD

- AC-007: accepted extraction actions appear here, linked to their source idea.
- Full lifecycle (create/edit/complete/reopen/archive/delete) + filters work.
- Manual actions supported; source links navigable.

## Tasks

| ID | Title | Depends on |
| --- | --- | --- |
| [TASK-08-01](./TASK-08-01-actions-screen.md) | Actions screen + grouping/filters | EPIC-02 |
| [TASK-08-02](./TASK-08-02-crud-workflow.md) | Action CRUD + status workflow | 08-01 |
| [TASK-08-03](./TASK-08-03-manual-actions.md) | Manual action creation | 08-01 |
| [TASK-08-04](./TASK-08-04-source-link-counts.md) | Source-link navigation + action-count sync | 08-02, EPIC-04 |
| [TASK-08-05](./TASK-08-05-export-seam.md) | External-export data shape (design, deferred) | 08-02 |

## Sequencing

08-01 → 08-02 → 08-03/08-04; 08-05 is design-only (P2).
</content>
