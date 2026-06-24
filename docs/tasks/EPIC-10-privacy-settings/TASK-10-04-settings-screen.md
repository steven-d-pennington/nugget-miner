# TASK-10-04 — Settings screen

> Epic: EPIC-10 · Priority: P0 · Est: M · Depends on: EPIC-02
> PRD: FR-801, §8 · Docs: [UX §3](../../product/03-ux-guidelines.md)

## Objective

Build the Settings hub wiring together privacy, data, and app controls.

## Implementation steps

1. Build `src/features/settings/SettingsScreen.tsx` at `/settings` with sections:
   **Privacy** (mode toggle local-only ↔ cloud-enabled), **Processing providers**
   (10-05), **Retention** (policy chooser → 09-07, with consequence copy),
   **Storage** (09-06), **Export / Import** (09-03/04/05), **Reset** (10-06),
   **About** (app version), and a **Developer** section (dev tools/queue inspector,
   dev builds only).
2. Read/write via `settingsRepository.update`; reflect changes app-wide
   (indicator 10-03).
3. Switching to cloud-enabled explains what it changes and still requires
   per-action consent (10-02).
4. Accessible forms (labels, fieldsets, keyboard).

## Files to create / modify

- `src/features/settings/SettingsScreen.tsx` + section components
- `src/app/settings/page.tsx`

## Acceptance criteria

- All FR-801 controls present: privacy mode, providers, export, reset, version.
- Toggling privacy mode persists and updates the indicator; cloud still needs consent.
- Retention chooser shows consequences before enabling audio deletion (§14).
- Developer section hidden in production.

## Out of scope

Provider specifics (10-05); reset internals (10-06).
</content>
