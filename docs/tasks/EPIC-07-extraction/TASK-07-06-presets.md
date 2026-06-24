# TASK-07-06 — Extraction presets (P1)

> Epic: EPIC-07 · Priority: P1 · Est: S · Depends on: 07-02
> PRD: FR-406, Q8 · Docs: [product spec §3 Q8](../../product/00-product-spec.md)

## Objective

Offer the four extraction presets, defaulting to "general thought," that shape
extraction context without changing storage shape.

## Implementation steps

1. Define the preset set in `ExtractionContext` (already typed): `product-idea`,
   `work-reminder`, `story-idea`, `general-thought` (default).
2. Add a preset selector at the point of processing (Recorder "Save & Process",
   Idea Detail Process, and Review "Regenerate"); persist the chosen preset on
   the `extractionRuns` row.
3. Wire the default from `settings.defaultExtractionPreset`.
4. For real providers (07-07), the preset maps to a prompt variant
   (`promptVersion`); for mock it varies fixture output (07-02).

## Files to create / modify

- `src/features/review/PresetSelector.tsx`
- wire into process entry points

## Acceptance criteria

- The four presets are selectable; default is "general thought."
- Chosen preset is recorded on the run and influences output.
- Storage shape is unchanged across presets.

## Out of scope

Real prompt engineering (07-07).
</content>
