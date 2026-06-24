# TASK-06-05 — Browser SpeechRecognition adapter (P1)

> Epic: EPIC-06 · Priority: P1 · Est: M · Depends on: 06-01
> PRD: FR-003, FR-305, R-005 · Docs: [product spec Q2](../../product/00-product-spec.md)

## Objective

Add an on-device transcription option using the browser `SpeechRecognition` API
where available, labeled as on-device processing.

## Implementation steps

1. Implement `src/lib/providers/transcription/browserProvider.ts`
   (`mode:'browser'`); `isAvailable()` feature-detects
   `window.SpeechRecognition || webkitSpeechRecognition`.
2. Because Web Speech transcribes live audio (not a Blob), document the
   limitation: this provider is best-effort and may require a live capture path;
   for MVP, gate it behind availability and clearly label **On this device
   (browser)** (FR-003).
3. Map results into `TranscriptResult`; handle no-speech/errors as `ProviderError`.
4. Register only when available; never the silent default.

## Files to create / modify

- `src/lib/providers/transcription/browserProvider.ts`

## Acceptance criteria

- Provider appears only on supporting browsers and is labeled on-device.
- Produces a valid `TranscriptResult` or a typed error.
- Does not become the default automatically.

## Out of scope

Cloud route (06-06); changing capture architecture for live recognition (note the constraint).
</content>
