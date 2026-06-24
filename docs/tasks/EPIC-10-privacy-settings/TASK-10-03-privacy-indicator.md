# TASK-10-03 — Privacy indicator + processing-mode labels

> Epic: EPIC-10 · Priority: P0/P1 · Est: S · Depends on: 10-02
> PRD: FR-003, FR-005, §14 · Docs: [UX §5](../../product/03-ux-guidelines.md)

## Objective

Keep the user continuously aware of privacy state and clearly label every
processing mode.

## Implementation steps

1. Build a `PrivacyIndicator` chip in the header reading **Local-only** (default)
   or **Cloud-enabled**, driven by `settings.privacyMode`; tapping opens privacy
   settings (FR-005).
2. Standardize processing-mode labels everywhere a provider appears: **On this
   device (mock)**, **On this device (browser)**, **Cloud (opt-in)** (FR-003) —
   centralize in a `providerModeLabel(mode)` helper.
3. Show the indicator on processing screens (Recorder process, Idea Detail,
   Review) as well as Settings.

## Files to create / modify

- `src/components/PrivacyIndicator.tsx`, `src/lib/privacy/labels.ts`
- mount in `AppShell` header (replace 01-03 placeholder)

## Acceptance criteria

- Indicator reflects current privacy mode and links to settings.
- Provider modes use the standardized labels consistently.
- Indicator present on settings + processing screens.

## Out of scope

Toggling cloud mode (10-04/10-05).
</content>
