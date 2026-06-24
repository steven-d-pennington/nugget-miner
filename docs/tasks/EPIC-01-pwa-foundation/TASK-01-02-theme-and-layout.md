# TASK-01-02 — Theme tokens, dark mode, layout primitives

> Epic: EPIC-01 · Priority: P0 · Est: S · Depends on: 01-01
> PRD: §14 · Docs: [UX §1, §4, §7](../../product/03-ux-guidelines.md)

## Objective

Establish the design-token system, dark-mode-first theming, and the small set of
layout primitives every screen reuses.

## Implementation steps

1. Define CSS variables in `globals.css` for both schemes: `--bg`, `--surface`,
   `--text`, `--muted`, `--accent`, `--danger`, `--success`, `--radius`,
   `--space-1..6`. Default to dark; provide a light override via
   `prefers-color-scheme` and a `.light`/`.dark` class on `<html>`.
2. Map Tailwind theme colors/spacing/radius to these variables so utilities and
   tokens stay in sync.
3. Wrap all non-essential transitions in `@media (prefers-reduced-motion: reduce)`
   guards (UX §7).
4. Build layout primitives in `src/components`: `AppShell` (header + main +
   bottom nav slot), `Screen` (max-width, padding), `Stack`/`Row` (flex helpers),
   `Card`, `Button` (variants: primary/secondary/danger/ghost; 44px min target),
   `EmptyState`, `ErrorState`, `Skeleton`.
5. Ensure `Button` and interactive primitives have visible focus rings and pass
   AA contrast in both themes.

## Files to create / modify

- `src/app/globals.css`, `tailwind.config.ts`
- `src/components/{AppShell,Screen,Stack,Card,Button,EmptyState,ErrorState,Skeleton}.tsx`
- `src/components/index.ts` barrel

## Acceptance criteria

- Toggling color scheme swaps tokens with no hard-coded colors in components.
- `Button` renders all variants with visible focus and ≥44px hit area.
- `EmptyState`/`ErrorState`/`Skeleton` exist and are used by later screens (UX §4).
- No animation plays under `prefers-reduced-motion: reduce`.
- axe check on a primitives demo page reports no violations (verified in 01-06).

## Out of scope

Real screen content; navigation wiring (01-03).
</content>
