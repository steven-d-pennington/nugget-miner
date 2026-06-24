# EPIC-02 — Local Data Layer

> Milestone M1 · Priority P0
> Product context: [data model](../../product/02-data-model.md),
> [architecture §2–3](../../product/01-architecture.md)

## Goal

Implement the typed domain model, Dexie schema with migrations, the repository
layer (the only code touching IndexedDB), cascade delete, fixtures, and developer
DB tools. This is the persistence backbone for every feature epic.

## Outcome / DoD

- All entities from the data model exist with the specified indexes.
- Typed repositories with explicit returns and typed errors; no Dexie imports
  outside `lib/repositories`/`lib/db`.
- Cascade delete + detach setting implemented and tested.
- A real migration path exists with a passing preservation test.
- Fixtures + dev tools (seed/clear/export/inspect) available.

## Tasks

| ID | Title | Depends on |
| --- | --- | --- |
| [TASK-02-01](./TASK-02-01-domain-types.md) | Domain types + enums | EPIC-01 |
| [TASK-02-02](./TASK-02-02-dexie-schema-migrations.md) | Dexie instance, schema v1, migration scaffold | 02-01 |
| [TASK-02-03](./TASK-02-03-repository-base-settings.md) | Repository base, typed errors, settings repo | 02-02 |
| [TASK-02-04](./TASK-02-04-idea-recording-transcript-repos.md) | Idea / recording / transcript repos | 02-03 |
| [TASK-02-05](./TASK-02-05-extraction-nugget-action-question-repos.md) | ExtractionRun / nugget / action / question repos | 02-03 |
| [TASK-02-06](./TASK-02-06-project-tag-job-export-repos.md) | Project / tag / processingJob / export repos | 02-03 |
| [TASK-02-07](./TASK-02-07-cascade-delete.md) | Cascade delete + detach setting (AC-010) | 02-04, 02-05 |
| [TASK-02-08](./TASK-02-08-fixtures-dev-tools.md) | Fixtures + dev DB tools (FR-804) + migration test | 02-04…06 |

## Sequencing

02-01 → 02-02 → 02-03, then 02-04/05/06 in parallel, then 02-07 and 02-08.
</content>
