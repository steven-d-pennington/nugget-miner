# TASK-06-01 — TranscriptionProvider interface + registry

> Epic: EPIC-06 · Priority: P0 · Est: S · Depends on: EPIC-01
> PRD: §12, FR-301, FR-305 · Docs: [architecture §3](../../product/01-architecture.md)

## Objective

Define the transcription provider contract and a registry so providers are
pluggable and UI/queue stay provider-agnostic.

## Implementation steps

1. Create `src/lib/providers/transcription/types.ts` with `TranscriptionProvider`
   and `TranscriptResult` exactly per architecture §3.
2. Create a registry (`src/lib/providers/transcription/index.ts`):
   `registerTranscriptionProvider`, `getTranscriptionProvider(id)`,
   `listTranscriptionProviders()`, returning available providers via
   `isAvailable()`.
3. Document the `mode` semantics (`mock`/`local`/`browser`/`cloud`) and that
   `cloud` requires consent (enforced by the runner/EPIC-10).
4. Export a default provider id resolver reading `settings.transcriptionProviderId`.

## Files to create / modify

- `src/lib/providers/transcription/{types.ts,index.ts}`

## Acceptance criteria

- Interface + result types match architecture §3 field-for-field.
- Registry can register/list/resolve providers and filter by availability.
- No concrete provider import leaks into UI (architecture §2).

## Out of scope

Adapter implementations (06-02/05/06).
</content>
