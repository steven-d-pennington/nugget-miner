# EPIC-06 — Transcription

> Milestone M3 (mock) / M5 (real) · Priority P0 · Feature F-4
> Product context: [architecture §3](../../product/01-architecture.md),
> [product spec Q2](../../product/00-product-spec.md)

## Goal

Define the `TranscriptionProvider` contract, ship a deterministic mock adapter,
persist editable transcripts linked to recordings, and add real adapters
(browser + cloud) behind the same contract and consent.

## Outcome / DoD

- Mock adapter returns deterministic transcripts via the EPIC-05 queue.
- Transcripts persist, link to the recording, and are manually editable (AC-006).
- (M5) A real cloud adapter runs behind consent with no client keys.

## Tasks

| ID | Title | Depends on |
| --- | --- | --- |
| [TASK-06-01](./TASK-06-01-provider-contract-registry.md) | Provider interface + registry | EPIC-01 |
| [TASK-06-02](./TASK-06-02-mock-adapter.md) | Deterministic mock adapter | 06-01 |
| [TASK-06-03](./TASK-06-03-persist-and-chain.md) | Persist transcript + queue integration | 06-02, EPIC-05 |
| [TASK-06-04](./TASK-06-04-editable-transcript-ui.md) | Editable transcript UI (AC-006) | 06-03, EPIC-04 |
| [TASK-06-05](./TASK-06-05-browser-adapter.md) | Browser SpeechRecognition adapter (P1) | 06-01 |
| [TASK-06-06](./TASK-06-06-cloud-route-adapter.md) | `/api/transcribe` + cloud adapter (M5) | 06-01, EPIC-10 |

## Sequencing

06-01 → 06-02 → 06-03 → 06-04; 06-05 (P1) and 06-06 (M5) after 06-01.
</content>
