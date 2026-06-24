# EPIC-09 — Search & Export

> Milestone M4 · Priority P0 · Features F-7, F-8
> Product context: [data model](../../product/02-data-model.md),
> [product spec Q6](../../product/00-product-spec.md)

## Goal

Instant local search across all idea content, Markdown + JSON export, JSON
import with dedupe, storage-usage visibility, and retention controls — all
accountless and offline-capable.

## Outcome / DoD

- AC-008: search returns matching ideas with context.
- AC-009: Markdown export contains title, date, transcript, summary, nuggets,
  actions, questions, tags.
- JSON export/import round-trips with safe duplicate handling.

## Tasks

| ID | Title | Depends on |
| --- | --- | --- |
| [TASK-09-01](./TASK-09-01-search-service.md) | SearchService + local index | EPIC-02, EPIC-06/07 |
| [TASK-09-02](./TASK-09-02-search-ui-filters.md) | Search UI + filters | 09-01 |
| [TASK-09-03](./TASK-09-03-markdown-export.md) | Markdown export (AC-009) | EPIC-02 |
| [TASK-09-04](./TASK-09-04-json-export.md) | JSON database export | EPIC-02 |
| [TASK-09-05](./TASK-09-05-json-import.md) | JSON import + dedupe | 09-04 |
| [TASK-09-06](./TASK-09-06-storage-usage.md) | Storage-usage view (P1) | EPIC-02 |
| [TASK-09-07](./TASK-09-07-retention.md) | Retention policy enforcement (P1) | EPIC-02, EPIC-10 |

## Sequencing

09-01 → 09-02 (search); 09-03 → 09-04 → 09-05 (export/import) in parallel;
09-06/09-07 (P1) after the data layer.
</content>
