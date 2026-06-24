# TASK-10-06 — Safe nuclear reset

> Epic: EPIC-10 · Priority: P0 · Est: S · Depends on: 10-04
> PRD: FR-802, §14, §15 · Docs: [UX §6](../../product/03-ux-guidelines.md)

## Objective

Let users wipe all local data with a clear, deliberate, non-accidental flow.

## Implementation steps

1. Add a "Reset app" action in Settings opening a confirm flow that **names what
   is deleted** (all ideas, recordings, transcripts, extractions, actions,
   settings) and requires a deliberate confirm (type "DELETE" or hold-to-confirm;
   UX §6) — not default-focused.
2. On confirm, clear all Dexie tables (and search index, object URLs, dev caches)
   via a `resetApp()` helper; then re-run `settingsRepository.ensureDefaults()`
   and route to onboarding.
3. Ensure no partial wipe leaves the app in a broken state (transaction or
   recreate-DB approach).

## Files to create / modify

- `src/features/settings/ResetPanel.tsx`, `src/lib/dev/resetApp.ts` (prod-safe)

## Acceptance criteria

- Reset clearly explains consequences and requires deliberate confirmation.
- After reset, the database is empty, defaults are restored, and onboarding shows.
- No broken intermediate state on failure.

## Out of scope

Selective deletion (covered by per-idea delete, EPIC-04).
</content>
