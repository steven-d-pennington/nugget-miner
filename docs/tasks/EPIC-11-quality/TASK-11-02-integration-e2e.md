# TASK-11-02 — Integration / e2e for core flows

> Epic: EPIC-11 · Priority: P0 · Est: L · Depends on: EPIC-03…09
> PRD: §20, §17 · Docs: [UX §3](../../product/03-ux-guidelines.md)

## Objective

Verify the end-to-end user journeys and the acceptance criteria that span
multiple modules.

## Implementation steps

1. Playwright flows (mock providers, seeded DB): onboarding → record/save
   (AC-001/002) → list/detail (AC-003) → mock transcript (AC-006) → mock
   extraction → accept action (AC-007) → search (AC-008) → export (AC-009) →
   delete (AC-010).
2. Processing-failure flow: force a mock failure, assert recording intact + retry
   (AC-005).
3. Use deterministic fixtures (EPIC-02) and stub time/IDs where needed.
4. Run in CI as a separate job (from 01-06).

## Acceptance criteria

- The full journey passes end-to-end with mock providers.
- AC-001…AC-010 each have at least one passing integration/e2e assertion.
- Failure flow proves recording safety + retry (AC-005).

## Out of scope

Real provider integration tests (covered separately at M5).
</content>
