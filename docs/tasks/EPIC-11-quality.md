# EPIC-11 — Quality

> Source: [Nugget PRD](../../Nugget_PRD.md) §20 (Testing & QA), §10 (NFRs), §17, §18 Milestone 4, §19
> Status: Ongoing · Priority: P0 · Milestone: M4 (and continuous)

## Summary

Establish the testing, accessibility, and QA strategy that runs across every
epic: unit tests for services, integration tests for core flows, offline tests,
a browser/device matrix, data-migration tests, accessibility tests, and privacy
tests. This epic ratifies the MVP acceptance criteria (PRD §17).

## Scope (PRD §20)

### Unit tests
- Recorder state machine, repository methods, provider adapters, extraction
  schema validation, export formatting.

### Integration tests (core flows)
- Onboarding, record/save, list/detail, mock transcript, mock extraction, accept
  action, search, export, delete.

### Offline tests
- App load after cache, save recordings offline, browse ideas offline, queue
  processing when provider unavailable.

### Browser/device matrix
- iPhone Safari / installed PWA mode, desktop Chrome/Edge, desktop Safari where
  available, microphone-permission-denied cases.

### Data migration tests
- Schema upgrades preserve existing ideas and recordings.

### Accessibility tests (NFR-006)
- Keyboard navigation, screen-reader labels, focus management, color contrast,
  reduced motion.

### Privacy tests (PRD §15)
- No network calls during local-only capture; cloud processing requires explicit
  confirmation; server logs avoid user content.

## Related PRD requirements

- NFR-006 Accessibility — required for all core flows.
- NFR-003 Durability, NFR-004 Offline, NFR-005 Performance, NFR-007 Reliability — validated by tests.
- Acceptance Criteria AC-001 … AC-010 (PRD §17) — each gets coverage.

## Acceptance-criteria coverage map (PRD §17)

| AC | Scenario | Owning epic |
| --- | --- | --- |
| AC-001 | First recording: timer + level feedback | EPIC-03 |
| AC-002 | Local save, no network | EPIC-03 |
| AC-003 | Offline library | EPIC-04 |
| AC-004 | Cloud consent | EPIC-10 |
| AC-005 | Processing failure safety | EPIC-05 |
| AC-006 | Editable transcript feeds search/extraction | EPIC-06 |
| AC-007 | Nugget review → Actions link | EPIC-07 / EPIC-08 |
| AC-008 | Search returns matching context | EPIC-09 |
| AC-009 | Markdown export contents | EPIC-09 |
| AC-010 | Delete cascade/detach | EPIC-04 |

## Implementation notes

- Wire a test runner (e.g. Vitest/Jest) + component testing + an offline/SW test
  harness early; add to CI.
- Reuse the EPIC-02 fixtures (short/long recording, no transcript, failed
  transcript, failed extraction, many actions, many tags, deleted source idea)
  as shared test data (PRD §24).
- Add automated accessibility checks (e.g. axe) plus a manual screen-reader pass
  on core flows (NFR-006).
- Privacy tests must assert zero network activity during local-only capture
  (NFR-001, PRD §15).

## Definition of Done

- Unit + integration suites cover the flows in PRD §20 and pass in CI.
- Offline, migration, accessibility, and privacy suites exist and pass.
- All AC-001 … AC-010 have automated and/or documented manual coverage.
- Core flows pass manual QA on iPhone Safari/PWA and one desktop browser (PRD §23).

## Dependencies

- Cross-cutting — exercises all other epics; begins alongside EPIC-01 and continues through M4.
</content>
