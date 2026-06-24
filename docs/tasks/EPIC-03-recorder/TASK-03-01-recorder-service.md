# TASK-03-01 — RecorderService state machine + MediaRecorder

> Epic: EPIC-03 · Priority: P0 · Est: M · Depends on: EPIC-01
> PRD: FR-002, FR-101, FR-104, R-001 · Docs: [architecture §3](../../product/01-architecture.md)

## Objective

Implement the framework-agnostic `RecorderService` that owns audio capture as an
explicit state machine, keeping capture logic out of React (PRD §24).

## Implementation steps

1. Implement `src/lib/services/RecorderService.ts` matching the architecture §3
   interface and `RecorderState` union.
2. `start()` calls `getUserMedia({audio:true})` **only on first invocation**
   (FR-002), transitions `idle → requesting-permission → recording`, and starts a
   `MediaRecorder`, collecting chunks.
3. Pick a supported mime type via `MediaRecorder.isTypeSupported` (prefer
   `audio/webm;codecs=opus`, fallback `audio/mp4`/platform default) for
   iOS/Safari variance (R-001).
4. `stop()` finalizes the Blob, computes `durationMs` and `sizeBytes`, returns a
   `RecordingDraft` (no persistence here), and returns to `idle`.
5. `cancel()` discards chunks/stream; release tracks on stop/cancel/error.
6. Handle permission denial / no-device → `error` state with a typed reason;
   never throw raw.

## Files to create / modify

- `src/lib/services/RecorderService.ts`
- `src/lib/services/RecorderService.test.ts`

## Acceptance criteria

- State transitions follow the documented machine; illegal transitions are no-ops/throw typed errors.
- `getUserMedia` is invoked only on first `start()`; permission-denied yields `error` state, not a crash.
- `stop()` returns a non-empty Blob with correct `mimeType`, `durationMs`, `sizeBytes`.
- Media tracks are released after stop/cancel (no lingering mic indicator).
- Tests (mocked MediaRecorder/getUserMedia) cover start/stop, denial, cancel.

## Out of scope

Level meter (03-02), React binding (03-03), persistence (03-05).
</content>
