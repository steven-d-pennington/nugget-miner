# TASK-05-03 — Failure recovery + retry semantics (AC-005)

> Epic: EPIC-05 · Priority: P0 · Est: S · Depends on: 05-02
> PRD: AC-005, NFR-007, R-004 · Docs: [architecture §5](../../product/01-architecture.md), [UX §4](../../product/03-ux-guidelines.md)

## Objective

Guarantee that failures are safe, sanitized, and recoverable without harming the
source recording.

## Implementation steps

1. On a job throw, set `status:'failed'` and store a **sanitized** `errorMessage`
   (no provider secrets/stack/content; PRD §15). Never mutate or delete the
   recording/transcript on failure (NFR-007).
2. Distinguish error classes (`ProviderError`, `ConsentRequiredError`, network,
   timeout) to drive UI copy and retry affordances.
3. Provide retry (re-queue, `attempts++`) and "switch provider then retry" paths;
   optionally auto-retry transient errors a bounded number of times with backoff.
4. Surface trust-preserving messages (UX §4): "The extraction failed, but your
   original recording is safe."

## Files to create / modify

- `src/lib/services/processingRunner.ts` (error handling)
- `src/lib/services/ProcessingQueue.ts` (retry/provider-switch)

## Acceptance criteria

- AC-005: after a forced transcription/extraction failure, the recording remains
  intact and retry / provider-switch are offered.
- `errorMessage` is sanitized (assert no secret/content leakage).
- Retry increments attempts and re-runs; provider switch updates `provider`.

## Out of scope

Provider-specific error mapping (EPIC-06/07); consent (EPIC-10).
</content>
