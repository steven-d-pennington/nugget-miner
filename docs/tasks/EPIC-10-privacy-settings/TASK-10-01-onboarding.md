# TASK-10-01 — Onboarding & privacy primer

> Epic: EPIC-10 · Priority: P0 · Est: S · Depends on: EPIC-01
> PRD: FR-001, §14 · Docs: [UX §3, §5](../../product/03-ux-guidelines.md)

## Objective

Explain the local-first model on first run, building trust before the user records.

## Implementation steps

1. Build `/onboarding` (no tab bar) with three cards (UX §3): *Stored on this
   device*, *You choose what gets processed*, *Export or delete anytime* — plain
   language (§14).
2. "Start" sets `settings.onboardingCompletedAt` and routes to Home. Do **not**
   request mic permission here (FR-002).
3. Gate first-run routing: if onboarding incomplete, redirect to `/onboarding`;
   allow re-viewing later from Settings.
4. Fully accessible (focus order, headings, keyboard).

## Files to create / modify

- `src/features/settings/Onboarding.tsx`, `src/app/(onboarding)/onboarding/page.tsx`
- first-run redirect (layout/middleware or client guard)

## Acceptance criteria

- First run shows onboarding; completing it persists and routes to Home.
- No mic permission is requested during onboarding.
- Re-accessible from Settings; accessible by keyboard/SR.

## Out of scope

Consent gate (10-02); settings (10-04).
</content>
