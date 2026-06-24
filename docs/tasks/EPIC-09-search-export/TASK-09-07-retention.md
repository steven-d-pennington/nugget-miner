# TASK-09-07 — Retention policy enforcement (P1)

> Epic: EPIC-09 · Priority: P1 · Est: M · Depends on: EPIC-02, EPIC-10
> PRD: FR-705, §14, §15, Q3 · Docs: [product spec §3 Q3](../../product/00-product-spec.md)

## Objective

Enforce the user's retention policy without ever silently destroying audio.

## Implementation steps

1. Read `settings.retentionPolicy`: `keep-forever` (default — no action),
   `delete-audio-after-transcript`, `archive-after-days` (`retentionDays`).
2. Implement an idempotent `applyRetention()` pass run on app start / settings
   change: for `delete-audio-after-transcript`, delete recording Blobs for ideas
   with a saved transcript (keep transcript + metadata); for `archive-after-days`,
   archive ideas older than N days.
3. **Before** any audio deletion, ensure the user saw the consequence when
   choosing the policy (EPIC-10 settings copy) — never auto-destroy without that
   (§14). Show what will be affected before applying.
4. Make every action reversible where possible (archive) and clearly logged.

## Files to create / modify

- `src/lib/services/retention.ts`
- wire into settings change + app bootstrap

## Acceptance criteria

- Each policy behaves as specified; `keep-forever` never deletes.
- Audio deletion only occurs under an explicit, consequence-acknowledged policy.
- Transcript + metadata survive audio deletion; archive is reversible.

## Out of scope

Settings UI for choosing the policy (EPIC-10).
</content>
