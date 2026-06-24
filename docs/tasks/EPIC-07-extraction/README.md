# EPIC-07 — Extraction

> Milestone M3 (mock) / M5 (real) · Priority P0 · Features F-4, F-5
> Product context: [architecture §3](../../product/01-architecture.md),
> [PRD §13 schema](../../../Nugget_PRD.md)

## Goal

Define the `ExtractionProvider` contract + Zod-validated result schema, ship a
deterministic mock, persist extraction runs, and build the Nugget Review flow
that turns suggestions into accepted, source-linked records.

## Outcome / DoD

- Mock adapter returns deterministic, schema-valid output via the queue.
- Invalid output is rejected by validation, never persisted.
- AC-007: accepting an action creates a linked `ActionItem` shown in Actions.
- Every item links to its transcript `sourceSpan`.

## Tasks

| ID | Title | Depends on |
| --- | --- | --- |
| [TASK-07-01](./TASK-07-01-contract-and-schema.md) | Provider interface + Zod result schema | EPIC-01 |
| [TASK-07-02](./TASK-07-02-mock-adapter.md) | Deterministic mock adapter | 07-01 |
| [TASK-07-03](./TASK-07-03-persist-run.md) | Persist ExtractionRun + queue integration | 07-02, EPIC-05 |
| [TASK-07-04](./TASK-07-04-review-service.md) | ReviewService (raw → pending → accepted) | 07-03 |
| [TASK-07-05](./TASK-07-05-review-ui.md) | Nugget Review UI (accept/edit/reject/regenerate) | 07-04, EPIC-04 |
| [TASK-07-06](./TASK-07-06-presets.md) | Extraction presets (P1) | 07-02 |
| [TASK-07-07](./TASK-07-07-cloud-route-adapter.md) | `/api/extract` + cloud adapter (M5) | 07-01, 07-08, EPIC-10 |
| [TASK-07-08](./TASK-07-08-llm-layer.md) | Server-only LLM prompt/model layer | 07-01 |

## Sequencing

07-01 → 07-02 → 07-03 → 07-04 → 07-05; 07-06 (P1) after 07-02; 07-08 after 07-01; 07-07 (M5) after 07-08 + EPIC-10.
</content>
