# TASK-07-07 — `/api/extract` route + cloud adapter (M5)

> Epic: EPIC-07 · Priority: P1 (M5) · Est: M · Depends on: 07-01, 07-08, EPIC-10
> PRD: §13, §15, NFR-002 · Docs: [architecture §5–6](../../product/01-architecture.md), [LLM layer](../../product/04-llm-layer.md)

## Objective

Add an optional server-side extraction path returning schema-valid JSON, behind
consent and with no client keys.

## Implementation steps

1. Implement `src/app/api/extract/route.ts` (POST): accept transcript + context;
   validate payload size; read model key from server env only (NFR-002).
2. Prompt the model to return JSON matching the PRD §13 schema; **server-side
   validate with the same Zod schema** before responding; do not persist the
   transcript (PRD §13).
3. Sanitize errors; never log transcript content.
4. Implement `src/lib/providers/extraction/cloudProvider.ts` (`mode:'cloud'`)
   posting to the route; must pass the consent gate (EPIC-10) and support
   `AbortSignal`.
5. Rate-limit the route (NFR-010).

## Files to create / modify

- `src/app/api/extract/route.ts`
- `src/lib/providers/extraction/cloudProvider.ts`

## Acceptance criteria

- Server validates output against the schema before returning; invalid model
  output yields a sanitized error, not malformed data.
- No key in client bundles; transcript not persisted/logged server-side.
- Cloud adapter refuses to send without consent (AC-004 path).

## Out of scope

Consent UI (EPIC-10); transcription route (06-06).
</content>
