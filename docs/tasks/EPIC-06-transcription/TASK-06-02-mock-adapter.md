# TASK-06-02 — Deterministic mock transcription adapter

> Epic: EPIC-06 · Priority: P0 · Est: S · Depends on: 06-01
> PRD: FR-301, §24 · Docs: [architecture §3](../../product/01-architecture.md)

## Objective

Provide a deterministic mock transcription provider so the full pipeline is
demoable and testable offline with no real API.

## Implementation steps

1. Implement `src/lib/providers/transcription/mockProvider.ts`
   (`id:'mock', mode:'mock', isAvailable: () => true`).
2. `transcribe` returns deterministic text derived from inputs (e.g. keyed by
   `recordingId`/duration) with plausible `segments`, `language:'en'`, and a
   fixed `confidence`. Simulate a short delay and honor `AbortSignal`.
3. Provide a fixture-backed mapping so specific fixtures (no-transcript,
   failed-transcript) produce the intended outcomes (the failed one throws a
   `ProviderError`).
4. Register the mock provider at startup as the default.

## Files to create / modify

- `src/lib/providers/transcription/mockProvider.ts`
- registration in providers bootstrap

## Acceptance criteria

- Same input → same transcript (deterministic).
- Respects `AbortSignal` (cancels promptly).
- The failed-transcript fixture path throws `ProviderError`.
- Registered and selectable as default in settings.

## Out of scope

Persistence/queue chaining (06-03).
</content>
