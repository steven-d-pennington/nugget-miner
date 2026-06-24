# TASK-03-03 — `useRecorder` hook

> Epic: EPIC-03 · Priority: P0 · Est: S · Depends on: 03-01, 03-02
> PRD: §24 · Docs: [architecture §2 (layering)](../../product/01-architecture.md)

## Objective

Expose the RecorderService to React via a hook so components stay free of capture
logic.

## Implementation steps

1. Implement `src/hooks/useRecorder.ts` returning `{ state, elapsedMs, level,
   start, pause, resume, stop, cancel }`.
2. Subscribe to `onLevel` and a 100–250ms elapsed timer while recording; clean up
   on unmount (release service, stop timers).
3. Expose a typed error/reason for the `error` state for the UI to render
   trust-preserving copy.
4. Ensure a single service instance per hook usage; guard against double-start.

## Files to create / modify

- `src/hooks/useRecorder.ts`, `src/hooks/useRecorder.test.tsx`

## Acceptance criteria

- Hook reflects service state and updates `elapsedMs`/`level` while recording.
- Unmount during recording cancels capture and releases the mic.
- Calling `start` twice does not create two streams.
- Tested with a mocked service.

## Out of scope

Screen layout (03-04), persistence (03-05).
</content>
