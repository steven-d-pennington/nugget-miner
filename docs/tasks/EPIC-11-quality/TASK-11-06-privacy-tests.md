# TASK-11-06 — Privacy tests (no-network local-only)

> Epic: EPIC-11 · Priority: P0 · Est: M · Depends on: EPIC-10
> PRD: §15, §20, NFR-001, AC-004 · Docs: [architecture §6](../../product/01-architecture.md), [UX §5](../../product/03-ux-guidelines.md)

## Objective

Prove the privacy guarantees: nothing leaves the device without consent.

## Implementation steps

1. Network-assertion test: with `privacyMode:'local-only'`, run capture →
   transcribe (mock) → extract (mock) → review → search → export and assert
   **zero** requests to content endpoints (intercept `fetch`/route handlers).
2. Consent test: attempt a cloud provider action; assert the consent sheet shows
   first and that canceling makes **no** request (AC-004); confirming makes
   exactly one, to the expected route.
3. Server-log test: assert API routes do not log audio/transcript content and
   return sanitized errors (10-07).
4. Reset test: nuclear reset removes all content (10-06).

## Acceptance criteria

- Local-only flow produces no content network calls.
- Cloud action requires consent first; cancel = no request (AC-004).
- No content is logged server-side; errors are sanitized.

## Out of scope

Consent/route implementation (EPIC-10).
</content>
