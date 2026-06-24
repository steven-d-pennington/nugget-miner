# TASK-03-05 — Persist draft → idea + recording

> Epic: EPIC-03 · Priority: P0 · Est: S · Depends on: 03-04, EPIC-02
> PRD: FR-104, AC-002, §14 · Docs: [data model §3](../../product/02-data-model.md), [UX §9](../../product/03-ux-guidelines.md)

## Objective

Turn a `RecordingDraft` into persisted `Idea` + `Recording` records, with a
default title, and route the user appropriately based on their choice.

## Implementation steps

1. Implement a `saveRecording(draft, { process })` flow in
   `src/features/recorder/saveRecording.ts`:
   - create the idea (`sourceType:'recording'`, `status:'captured'`,
     `durationMs` from draft, default title `"Idea — {Mon D, h:mm a}"` per UX §9),
   - add the recording (Blob + metadata + waveform) linked to the idea.
2. **Save** → navigate to the idea detail (or back to Home with a "Saved" toast).
   **Save & Process** → same, then enqueue a transcription job (call into
   EPIC-05 `ProcessingQueue`; if not yet built, leave a clearly-marked
   integration point/TODO that the EPIC-05 task wires).
3. Ensure the whole save is local and produces **zero** network requests (AC-002).
4. Surface storage failures as trust-preserving errors; never lose the draft
   silently (offer retry).

## Files to create / modify

- `src/features/recorder/saveRecording.ts`
- wire into `RecorderScreen.tsx`

## Acceptance criteria

- AC-002: after Save, the recording + metadata persist and the idea appears in
  the library with no network activity.
- Default title matches the UX §9 format and is later renamable (EPIC-04).
- Save & Process creates the idea/recording and enqueues a transcription job
  (or hits the documented integration point).
- A simulated storage error keeps the draft and offers retry.

## Out of scope

Library rendering (EPIC-04); queue execution (EPIC-05).
</content>
