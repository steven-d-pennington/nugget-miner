# TASK-08-05 — External-export data shape (design, deferred)

> Epic: EPIC-08 · Priority: P2 · Est: S · Depends on: 08-02
> PRD: FR-506, §6, §22 · Docs: [product spec §3 Q6](../../product/00-product-spec.md)

## Objective

Prepare (but do not build) action export to external systems by defining a stable
neutral shape, so a later integration is straightforward.

## Implementation steps

1. Define a neutral `ActionExportDTO` (title, notes, due, priority, source idea
   reference, tags) in `src/types/export.ts`.
2. Add a mapper `toActionExportDTO(action)` used by the Markdown task-list export
   (EPIC-09) now; Apple Reminders/Shortcuts/third-party targets are deferred.
3. Document the deferred targets and where adapters would plug in.

## Files to create / modify

- `src/types/export.ts` (DTO), `src/lib/services/actionExport.ts` (mapper)

## Acceptance criteria

- A neutral DTO + mapper exist and are consumed by Markdown task-list export.
- Deferred targets (Reminders/Shortcuts/etc.) are documented, not implemented.

## Out of scope

Any third-party integration (P2/Post-V1).
</content>
