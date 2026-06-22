# EPIC-01 — PWA Foundation

> Source: [Nugget PRD](../../Nugget_PRD.md) §6, §8, §18 Milestone 1, §19
> Status: Not started · Priority: P0 · Milestone: M1

## Summary

Stand up the installable Next.js + React + TypeScript PWA shell that every other
epic builds on: routing for the core screens, an offline-capable
service-worker/cache foundation, calm dark-mode-friendly theme, responsive
iPhone-first layout, and app/install metadata.

## Scope

- Next.js + React + TypeScript (strict mode) project scaffold (PRD §24).
- App routing/navigation for the core screens (PRD §8): Onboarding/Privacy,
  Home/Inbox, Recorder, Idea Library, Idea Detail, Nugget Review, Actions,
  Settings.
- Installable PWA: web app manifest, icons, iOS Home Screen support, install
  prompt guidance.
- Service worker / app-shell caching so the app loads offline (NFR-004).
- Theme: calm, minimal, dark-mode-friendly design tokens (PRD §14).
- Responsive, iPhone-first layout with primary **Record** CTA and secondary
  Review / Search / Actions / Export CTAs (PRD §14).
- Performance baseline: home/library shells feel instant (NFR-005).

## Related PRD requirements

- §6 — MVP/Alpha "Capture and local library": PWA shell, install prompt guidance.
- §8 — Information architecture / screen inventory.
- NFR-004 Offline behavior — app shell loads and core navigation works offline.
- NFR-005 Performance — instant-feeling shells; long jobs never freeze UI.
- NFR-006 Accessibility — semantic HTML, focus states, reduced motion (foundation).
- §24 — TypeScript strict mode; accessible semantic HTML, native controls.

## Acceptance criteria

- App installs to iPhone Home Screen and launches in standalone/PWA mode.
- All core routes from PRD §8 exist and are reachable (placeholder content OK).
- After first load + cache, the app shell loads with no network (NFR-004).
- Dark-mode theme applied; layout is usable on iPhone viewport widths.
- Reduced-motion preference is respected at the shell level (NFR-006).

## Implementation notes

- Keep the shell thin; feature logic lives in later epics' services/hooks.
- Establish design tokens and a layout primitive set used by all screens.
- Use plain-language privacy copy conventions early ("Stored on this device")
  per PRD §14 so later screens stay consistent.
- Defer analytics, auth, payments, and provider SDKs (PRD §24, §5 non-goals).

## Definition of Done

- Installable PWA shell with offline app-shell load and all core routes.
- Responsive dark theme; primary/secondary CTAs placed per PRD §14.
- Lighthouse/PWA install checks pass on iPhone Safari and one desktop browser.

## Dependencies

- None (foundational). Unblocks all other epics.
</content>
