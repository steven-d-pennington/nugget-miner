# TASK-11-05 — Accessibility tests

> Epic: EPIC-11 · Priority: P0 · Est: M · Depends on: all UI epics
> PRD: NFR-006, §20 · Docs: [UX §7](../../product/03-ux-guidelines.md)

## Objective

Verify core flows meet the accessibility bar.

## Implementation steps

1. Automated axe checks (`@axe-core/playwright`) on each core screen: Onboarding,
   Home, Recorder, Library, Idea Detail, Review, Actions, Settings — fail on
   violations.
2. Keyboard-only e2e pass through the primary journey (record → review → accept →
   search → export) asserting focus order, visible focus, and dialog focus
   trap/return (UX §7).
3. Assert `aria-live` announcements for recording state and processing status.
4. Add a manual screen-reader checklist (VoiceOver iOS + desktop) to 11-07.

## Acceptance criteria

- axe reports no violations on core screens.
- The primary journey is completable by keyboard alone with correct focus management.
- Status/recording changes are announced to assistive tech.

## Out of scope

Manual SR sign-off (tracked in 11-07).
</content>
