# TASK-07-02 — Deterministic mock extraction adapter

> Epic: EPIC-07 · Priority: P0 · Est: S · Depends on: 07-01
> PRD: FR-401, §24 · Docs: [PRD §13](../../../Nugget_PRD.md)

## Objective

Provide a deterministic mock extraction provider producing schema-valid output so
review and downstream flows are demoable offline.

## Implementation steps

1. Implement `src/lib/providers/extraction/mockProvider.ts`
   (`id:'mock', mode:'mock', isAvailable: () => true`).
2. `extract` derives deterministic `summary`, 2–4 `nuggets` (varied categories),
   1–3 `actions` (varied priorities), 1–2 `questions`, suggested `tags`, and
   `warnings`, all with valid `sourceSpan`s computed against the transcript text.
   Honor `AbortSignal`.
3. Vary output by `context.preset` so presets are observable (07-06).
4. Map the failed-extraction fixture to throw `ProviderError`.
5. Output must pass `parseExtractionResult` (07-01).

## Files to create / modify

- `src/lib/providers/extraction/mockProvider.ts`
- registration in providers bootstrap

## Acceptance criteria

- Deterministic, schema-valid output that passes Zod validation.
- `sourceSpan`s reference real offsets in the transcript.
- Failed-extraction fixture throws `ProviderError`.
- Output differs by preset.

## Out of scope

Persistence/review (07-03/04).
</content>
