# TASK-06-06 — `/api/transcribe` route + cloud adapter (M5)

> Epic: EPIC-06 · Priority: P1 (M5) · Est: M · Depends on: 06-01, EPIC-10 (consent + guards)
> PRD: §13, §15, NFR-002, Q2 · Docs: [architecture §5–6](../../product/01-architecture.md)

## Objective

Add an optional server-side transcription path (OpenAI-compatible Whisper) behind
consent, with no API keys on the client.

## Implementation steps

1. Implement `src/app/api/transcribe/route.ts` (POST): accept audio + minimal
   metadata; validate MIME type + size limits **before** processing (NFR-002);
   read the provider key from server env only.
2. Call the configured Whisper-compatible service; return `{ text, segments?,
   confidence?, language?, provider }`. **Do not persist audio** (PRD §13).
3. Sanitize errors (no provider/secret/content leakage); never log audio/transcript.
4. Implement `src/lib/providers/transcription/cloudProvider.ts` (`mode:'cloud'`)
   that POSTs the Blob to the route; it must pass the consent gate (EPIC-10)
   before sending and support `AbortSignal`.
5. Add basic rate limiting on the route (NFR-010).

## Files to create / modify

- `src/app/api/transcribe/route.ts`
- `src/lib/providers/transcription/cloudProvider.ts`

## Acceptance criteria

- Oversized/wrong-type payloads are rejected before any provider call.
- No API key is present in any client bundle; key is read only server-side.
- Errors returned to the client are sanitized; no content is logged.
- The cloud adapter refuses to send without consent (AC-004 path, EPIC-10).

## Out of scope

Consent UI (EPIC-10); extraction route (EPIC-07).
</content>
