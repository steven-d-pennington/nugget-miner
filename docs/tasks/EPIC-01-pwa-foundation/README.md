# EPIC-01 — PWA Foundation

> Milestone M1 · Priority P0 · Feature F-1 shell
> Product context: [architecture](../../product/01-architecture.md),
> [UX guidelines](../../product/03-ux-guidelines.md)

## Goal

Stand up the installable Next.js PWA shell, theme, navigation, offline app
shell, and the test/CI harness that every other epic depends on. No business
logic — just a runnable, installable, navigable, offline-capable, tested skeleton.

## Outcome / DoD

- `npm run dev` serves the app; `npm run build` succeeds; `npm test` and `npm run lint` pass in CI.
- App installs to iPhone Home Screen and launches standalone.
- All core routes exist (placeholder content) and are reachable via nav.
- App shell loads offline after first visit.
- Dark theme + reduced-motion respected at the shell level.

## Tasks

| ID | Title | Depends on |
| --- | --- | --- |
| [TASK-01-01](./TASK-01-01-scaffold-project.md) | Scaffold Next.js + TS strict + Tailwind + lint/format | — |
| [TASK-01-02](./TASK-01-02-theme-and-layout.md) | Theme tokens, dark mode, layout primitives | 01-01 |
| [TASK-01-03](./TASK-01-03-routing-and-nav.md) | App routes + navigation shell | 01-02 |
| [TASK-01-04](./TASK-01-04-pwa-manifest.md) | PWA manifest, icons, install guidance | 01-01 |
| [TASK-01-05](./TASK-01-05-service-worker-offline.md) | Serwist service worker + offline app shell | 01-04 |
| [TASK-01-06](./TASK-01-06-test-ci-harness.md) | Vitest/Playwright/axe + CI pipeline | 01-01 |

## Sequencing

01-01 first. Then 01-02→01-03 (UI shell) and 01-04→01-05 (PWA) can proceed in
parallel; 01-06 can start right after 01-01.
</content>
