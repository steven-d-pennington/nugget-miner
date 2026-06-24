# TASK-10-02 — Consent gate service + UI (AC-004)

> Epic: EPIC-10 · Priority: P0 · Est: M · Depends on: EPIC-01, EPIC-02
> PRD: FR-004, AC-004, NFR-001, §15 · Docs: [UX §5](../../product/03-ux-guidelines.md), [architecture §6](../../product/01-architecture.md)

## Objective

Guarantee no content leaves the device without an explicit, contextual,
cancellable consent — the core trust mechanism.

## Implementation steps

1. Implement `src/lib/privacy/consent.ts`: `requireConsent({ dataLabel,
   providerLabel, purpose })` returning a promise that resolves only if the user
   confirms; otherwise throws `ConsentRequiredError`.
2. Back it with a modal `<dialog>` `ConsentSheet` (UX §5) naming *what* is sent,
   *to whom*, *why*; **Cancel** is default focus; **Send for processing** confirms.
3. Cloud provider adapters (06-06, 07-07) and the runner (05-02) call
   `requireConsent` before any network send; consent is per-action (not sticky)
   unless the user opts into "remember for this session".
4. When `privacyMode === 'local-only'`, cloud providers are unavailable and the
   gate explains how to enable cloud in Settings.
5. Emit no telemetry; store no content (NFR-001).

## Files to create / modify

- `src/lib/privacy/consent.ts`, `src/components/ConsentSheet.tsx`
- hook points in the runner + cloud adapters

## Acceptance criteria

- AC-004: any cloud send shows the consent explanation first and is cancellable.
- Canceling aborts the send (`ConsentRequiredError`); no request is made.
- Local-only mode blocks cloud providers with a clear path to enable.
- A privacy test confirms no network call precedes consent.

## Out of scope

Indicator/labels (10-03); provider selection (10-05).
</content>
