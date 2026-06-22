# EPIC-06 — Transcription

> Source: [Nugget PRD](../../Nugget_PRD.md) §9 (Transcription), §12, §13, §18 Milestone 3 & 5, §19, §24
> Status: Not started · Priority: P0 · Milestone: M3 (mock), M5 (real)

## Summary

Define the `TranscriptionProvider` interface and ship a deterministic mock
adapter for MVP, store transcripts linked to recordings, allow manual transcript
editing, and track job state. Real providers (browser/on-device, local WASM,
server/API) plug in behind the same contract in M5.

## Scope

### Functional requirements (PRD §9 — Transcription)

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-301 | P0 | Transcription service interface with at least a mock adapter for MVP. |
| FR-302 | P0 | Store transcripts locally, linked to the source recording. |
| FR-303 | P0 | Allow manual editing of transcript text. |
| FR-304 | P0 | Track job state (shared with EPIC-05 queue). |
| FR-305 | P1 | Multiple transcription providers behind a common adapter contract. |
| FR-306 | P1 | Retry and provider switching without losing the source recording. |

### Provider contract (PRD §12)

```ts
type TranscriptionProvider = {
  id: string;
  label: string;
  mode: "mock" | "local" | "browser" | "cloud";
  transcribe(input: { ideaId: string; recordingId: string; audioBlob: Blob }):
    Promise<TranscriptResult>;
};
```

### Optional cloud route (PRD §13, M5)
- `POST /api/transcribe` — accepts audio + metadata **after explicit consent**;
  returns transcript text, optional segments, confidence, language, provider
  metadata. Server must not persist audio by default.

## Related PRD requirements

- §3 labels: "mock", "browser/on-device where available", "cloud/API opt-in" (FR-003, EPIC-10).
- AC-006 — editing and saving a transcript updates what search and later extraction use.
- NFR-002 Security — no API keys in client; validate payload size; sanitize errors; avoid logging content.
- NFR-007 — failure leaves recording intact (via EPIC-05).
- R-005 (PRD §21) — local/browser transcription quality varies; allow fallback via abstraction.
- §24 — adapters behind interfaces; start with mock returning deterministic fixtures.

## Acceptance criteria

- AC-006: Editing + saving a transcript makes search (EPIC-09) and re-extraction
  (EPIC-07) use the updated text.
- Mock adapter returns deterministic transcript fixtures (FR-301).
- Transcript persists in `transcripts` linked to recording/idea (FR-302).
- Manual edit persists and updates `updatedAt` (FR-303).
- Provider switching/retry preserves the source recording (FR-306).

## Implementation notes

- Keep the contract identical across mock/local/browser/cloud so the queue and UI
  are provider-agnostic (FR-305).
- Cloud adapter must route through `/api/transcribe` only after EPIC-10 consent;
  never embed keys client-side (NFR-002).
- Store `provider`, `confidence`, `language`, `segments`, `jobId` per PRD §11.
- Edited transcript is the source of truth for downstream extraction/search.

## Definition of Done

- `TranscriptionProvider` interface + deterministic mock adapter, run via EPIC-05 queue.
- Transcripts stored, linked, and manually editable; AC-006 passes.
- (M5) At least one real adapter behind consent + server route with no client keys.

## Dependencies

- EPIC-02 (`transcripts`), EPIC-05 (queue), EPIC-10 (consent for cloud).
- Feeds EPIC-07 (extraction) and EPIC-09 (search).
</content>
