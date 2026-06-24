# Nugget — Task Documents

Executable decomposition of the [Nugget PRD](../../Nugget_PRD.md) into product
foundation docs plus per-epic, agent-actionable task files.

## Read this first

Before picking up any task, read the product foundation docs — every task assumes
them:

1. [`product/00-product-spec.md`](../product/00-product-spec.md) — resolved
   product decisions (PRD §22) + feature catalog (F-1…F-10).
2. [`product/01-architecture.md`](../product/01-architecture.md) — stack, folder
   structure, service/provider contracts, conventions.
3. [`product/02-data-model.md`](../product/02-data-model.md) — Dexie schema,
   types, indexes, relationships, migrations.
4. [`product/03-ux-guidelines.md`](../product/03-ux-guidelines.md) — IA, screens,
   states, copy, accessibility.

## How tasks are structured

Each epic is a folder with a `README.md` (goal, DoD, task table, sequencing) and
`TASK-XX-YY-*.md` files. Every task is self-contained: **objective, dependencies,
implementation steps, files to create/modify, contracts touched, testable
acceptance criteria, test requirements, and out-of-scope.** An agent should be
able to complete a task end-to-end from the task + the four product docs without
product clarification.

Task IDs: `TASK-<epic>-<seq>`. Priorities: P0 (MVP), P1 (MVP/beta), P2 (later).

## Epics

| Epic | Theme | Milestone | Tasks |
| --- | --- | --- | --- |
| [EPIC-01](./EPIC-01-pwa-foundation/) | PWA foundation | M1 | 6 |
| [EPIC-02](./EPIC-02-local-data-layer/) | Local data layer | M1 | 8 |
| [EPIC-03](./EPIC-03-recorder/) | Recorder | M2 | 7 |
| [EPIC-04](./EPIC-04-idea-library/) | Idea library | M2–M3 | 7 |
| [EPIC-05](./EPIC-05-processing-queue/) | Processing queue | M3 | 5 |
| [EPIC-06](./EPIC-06-transcription/) | Transcription | M3 / M5 | 6 |
| [EPIC-07](./EPIC-07-extraction/) | Extraction | M3 / M5 | 7 |
| [EPIC-08](./EPIC-08-actions/) | Actions | M3 | 5 |
| [EPIC-09](./EPIC-09-search-export/) | Search & export | M4 | 7 |
| [EPIC-10](./EPIC-10-privacy-settings/) | Privacy & settings | M1 / M5 | 8 |
| [EPIC-11](./EPIC-11-quality/) | Quality | M4 + continuous | 7 |

## Build order (milestones, PRD §18)

- **M1 — App shell & storage:** EPIC-01, EPIC-02, EPIC-10 (10-01/10-02).
- **M2 — Recording MVP:** EPIC-03, EPIC-04 (list/detail).
- **M3 — Mock processing & review:** EPIC-05, EPIC-06 (mock), EPIC-07 (mock), EPIC-08.
- **M4 — Search, export & polish:** EPIC-09, EPIC-11 suites.
- **M5 — Real providers (beta):** EPIC-06/07 cloud adapters, EPIC-10 (10-07 guards).

## Critical dependency spine

```
EPIC-01 ─▶ EPIC-02 ─▶ EPIC-03 ─▶ EPIC-04
                 └▶ EPIC-05 ─▶ EPIC-06 ─▶ EPIC-07 ─▶ EPIC-08
                 └▶ EPIC-09        EPIC-10 (consent gates 05/06/07 cloud)
EPIC-11 spans all.
```

## Acceptance-criteria coverage (PRD §17)

AC-001/002 → EPIC-03 · AC-003 → EPIC-04 · AC-004 → EPIC-10 · AC-005 → EPIC-05 ·
AC-006 → EPIC-06 · AC-007 → EPIC-07/08 · AC-008/009 → EPIC-09 · AC-010 →
EPIC-04/02. Verification owned by [EPIC-11](./EPIC-11-quality/).
</content>
