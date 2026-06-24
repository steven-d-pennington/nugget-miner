# EPIC-11 — Quality

> Milestone M4 + continuous · Priority P0 · Feature: cross-cutting
> Product context: [architecture §7](../../product/01-architecture.md),
> [PRD §20](../../../Nugget_PRD.md)

## Goal

Build the test coverage and QA that ratify the MVP acceptance criteria: unit,
integration, offline, migration, accessibility, and privacy tests, plus a
browser/device QA matrix. Builds on the harness from TASK-01-06.

## Outcome / DoD

- Unit + integration suites cover PRD §20 flows and pass in CI.
- Offline, migration, accessibility, and privacy suites exist and pass.
- Every AC-001…AC-010 has automated and/or documented coverage.
- Core flows pass manual QA on iPhone Safari/PWA + one desktop browser.

## Acceptance-criteria ownership

| AC | Owning epic | Verified by task |
| --- | --- | --- |
| AC-001/002 | EPIC-03 | 11-02 |
| AC-003 | EPIC-04 | 11-02, 11-03 |
| AC-004 | EPIC-10 | 11-06 |
| AC-005 | EPIC-05 | 11-02 |
| AC-006 | EPIC-06 | 11-02 |
| AC-007 | EPIC-07/08 | 11-02 |
| AC-008 | EPIC-09 | 11-02 |
| AC-009 | EPIC-09 | 11-01/11-02 |
| AC-010 | EPIC-04/02 | 11-01 |

## Tasks

| ID | Title | Depends on |
| --- | --- | --- |
| [TASK-11-01](./TASK-11-01-unit-tests.md) | Unit tests for services/repos/validation | EPIC-02…09 |
| [TASK-11-02](./TASK-11-02-integration-e2e.md) | Integration/e2e for core flows | EPIC-03…09 |
| [TASK-11-03](./TASK-11-03-offline-tests.md) | Offline tests | EPIC-01/02 |
| [TASK-11-04](./TASK-11-04-migration-tests.md) | Data-migration tests | EPIC-02 |
| [TASK-11-05](./TASK-11-05-accessibility-tests.md) | Accessibility tests | all UI epics |
| [TASK-11-06](./TASK-11-06-privacy-tests.md) | Privacy tests (no-network local-only) | EPIC-10 |
| [TASK-11-07](./TASK-11-07-qa-matrix.md) | Browser/device QA matrix + checklist | all |

## Sequencing

Runs continuously; each suite lands as its target epics complete. 11-07 is the
final manual QA gate before beta.
</content>
