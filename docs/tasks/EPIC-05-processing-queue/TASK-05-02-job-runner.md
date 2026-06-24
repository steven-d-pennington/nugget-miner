# TASK-05-02 — Job runner/executor + provider dispatch

> Epic: EPIC-05 · Priority: P0 · Est: M · Depends on: 05-01, EPIC-06/07 interfaces
> PRD: §12, NFR-005 · Docs: [architecture §3–4](../../product/01-architecture.md)

## Objective

Execute queued jobs by dispatching to the correct provider and chaining
transcription → extraction, keeping the UI responsive.

## Implementation steps

1. Implement a runner that pulls the next `queued` job (respecting concurrency),
   sets `status:'processing'`, and dispatches by `type`:
   - `transcription` → resolve `TranscriptionProvider` by id, call `transcribe`
     with an `AbortSignal`, persist the transcript (EPIC-06), then **auto-enqueue
     an extraction job** for the idea.
   - `extraction` → resolve `ExtractionProvider`, call `extract`, validate +
     persist `ExtractionRun` (EPIC-07).
2. Update `progress` where the provider reports it; otherwise use coarse
   milestones (0 → 0.5 → 1).
3. Before any `cloud`-mode provider call, require the consent gate
   (`ConsentRequiredError` if not granted) — coordinate with EPIC-10.
4. Offload heavy work appropriately (provider adapters may use workers); never
   block the main thread for long stretches (NFR-005).
5. On success set `status:'complete'`; on throw, hand to failure recovery (05-03).

## Files to create / modify

- `src/lib/services/processingRunner.ts` (used by ProcessingQueue)
- provider registry lookups in `src/lib/providers/index.ts`

## Acceptance criteria

- A queued transcription job runs the provider, stores a transcript, and chains
  an extraction job automatically.
- Cloud-mode jobs are blocked without consent (`ConsentRequiredError`).
- Progress updates are observable; the UI stays responsive during runs.
- Abort via cancel stops the provider call promptly.

## Out of scope

Provider implementations (EPIC-06/07); consent UI (EPIC-10).
</content>
