# TASK-11-01 — Unit tests for services / repositories / validation

> Epic: EPIC-11 · Priority: P0 · Est: M · Depends on: EPIC-02…09
> PRD: §20 · Docs: [architecture §7](../../product/01-architecture.md)

## Objective

Cover the testable service/repository/validation units called out in PRD §20.

## Implementation steps

1. Recorder state machine (03-01): transitions, permission denial, cleanup.
2. Repository methods (EPIC-02) against `fake-indexeddb`: CRUD, filters, tag
   usage, cascade delete + detach (AC-010), action-count recompute.
3. Provider adapters via their interfaces: mock transcription/extraction
   determinism; failure-fixture errors.
4. Extraction schema validation (07-01): valid parses, malformed rejected.
5. Export formatting (09-03/04): Markdown contents (AC-009), JSON shape + audio
   exclusion; import dedupe (09-05).
6. ReviewService (07-04), ProcessingQueue (05-01) status logic.

## Acceptance criteria

- Each listed unit has tests; suite is green in CI.
- AC-009 (Markdown contents) and AC-010 (cascade/detach) are asserted at unit level.
- Coverage thresholds (set a sensible floor, e.g. services/repos ≥ 80%) enforced.

## Out of scope

Flow-level integration (11-02).
</content>
