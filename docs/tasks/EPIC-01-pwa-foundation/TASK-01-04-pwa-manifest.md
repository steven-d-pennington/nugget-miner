# TASK-01-04 — PWA manifest, icons, install guidance

> Epic: EPIC-01 · Priority: P0 · Est: S · Depends on: 01-01
> PRD: §6 (install prompt guidance), §8 · Docs: [architecture §1](../../product/01-architecture.md)

## Objective

Make Nugget installable to the iPhone Home Screen and desktop, with correct
metadata and a lightweight install hint.

## Implementation steps

1. Add a web app manifest (`app/manifest.ts` or `public/manifest.webmanifest`):
   `name` "Nugget", `short_name` "Nugget", `display: standalone`,
   `theme_color`/`background_color` from dark tokens, `start_url: '/'`,
   `orientation: portrait`.
2. Generate maskable + standard icons (192/512) and an Apple touch icon; add iOS
   `apple-mobile-web-app-*` meta and `viewport-fit=cover` via Next metadata.
3. Add a dismissible "Add to Home Screen" hint component: on iOS Safari show the
   Share→Add instructions; elsewhere use the `beforeinstallprompt` event. Persist
   dismissal in `localStorage` (UI-only flag, not user content).
4. Set Next `metadata` (title template, description, theme color).

## Files to create / modify

- `src/app/manifest.ts`, `src/app/layout.tsx` (metadata + apple meta)
- `public/icons/*`
- `src/components/InstallHint.tsx`

## Acceptance criteria

- Browser/devtools recognizes the app as installable; manifest validates.
- Installing to iPhone Home Screen launches standalone (no browser chrome).
- Install hint appears once, is dismissible, and does not reappear after dismissal.
- Theme color and icons render correctly in standalone mode.

## Out of scope

Service worker / offline caching (01-05).
</content>
