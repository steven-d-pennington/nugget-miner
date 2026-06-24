# TASK-01-03 — App routes + navigation shell

> Epic: EPIC-01 · Priority: P0 · Est: M · Depends on: 01-02
> PRD: §8 · Docs: [UX §2, §3](../../product/03-ux-guidelines.md)

## Objective

Create every core route as a placeholder screen and the persistent navigation so
later epics fill in content without touching routing.

## Implementation steps

1. Create App Router routes, each rendering a `Screen` with a heading and a
   "Coming soon" placeholder:
   - `/` (Home/Inbox), `/library`, `/actions`, `/settings`
   - `/onboarding`, `/idea/[ideaId]`, `/review/[ideaId]`
   - route group `(onboarding)` may wrap onboarding without the tab bar.
2. Build `BottomNav` (mobile) / `SideNav` (desktop) with the four primary tabs
   (Home, Library, Actions, Settings) per UX §2; active-state styling; render via
   `AppShell`. Hide nav on `/onboarding`.
3. Add a persistent **Record** affordance on Home (FAB-style) linking to the
   recorder entry (placeholder until EPIC-03). Reachable in one tap (UX §2).
4. Add a header slot containing the app name and a placeholder privacy-indicator
   chip (wired in EPIC-10).
5. Ensure keyboard navigability and correct landmark roles (`nav`, `main`).

## Files to create / modify

- `src/app/**/page.tsx` for each route above; `(onboarding)` layout
- `src/components/{BottomNav,SideNav,NavLink,RecordButton}.tsx`
- `src/components/AppShell.tsx` (wire nav + header)

## Acceptance criteria

- All routes in PRD §8 resolve and are reachable from nav (placeholder content OK).
- Record affordance is present on Home and reachable in one tap.
- Active tab is visually indicated; nav is keyboard-operable with visible focus.
- `/onboarding` renders without the tab bar.
- Responsive: bottom nav on mobile widths, side nav on desktop.

## Out of scope

Screen content/data (EPIC-03/04+), real recorder, real privacy chip behavior.
</content>
