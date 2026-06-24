# TASK-03-04 — Recorder screen UI + post-stop actions

> Epic: EPIC-03 · Priority: P0 · Est: M · Depends on: 03-03
> PRD: §7 J1, FR-101, FR-102, AC-001 · Docs: [UX §3, §4, §7](../../product/03-ux-guidelines.md)

## Objective

Build the recorder screen: start/stop, elapsed timer, recording state, level
meter, and the post-stop Save / Save & Process / Discard choices.

## Implementation steps

1. Create the recorder UI in `src/features/recorder/RecorderScreen.tsx`, mounted
   from the Home Record affordance (a route `/record` or a modal sheet).
2. Idle: large Record button. Recording: elapsed `m:ss`, `LevelMeter`, a textual
   "Recording…" state (for SR), and Stop.
3. On stop, show a preview card (waveform + duration) with **Save**,
   **Save & Process**, **Discard** (UX §3). Discard requires no confirm (nothing
   persisted yet) but Save & Process is the only path that enqueues processing.
4. Announce recording start/stop and elapsed milestones via `aria-live` (UX §7).
5. Handle `error` state with trust-preserving copy + a retry/permission hint.

## Files to create / modify

- `src/features/recorder/RecorderScreen.tsx`
- `src/app/record/page.tsx` (or modal integration on Home)
- supporting components (`RecordingPreview`)

## Acceptance criteria

- AC-001: after granting permission, an active timer and level meter appear.
- Stop reveals Save / Save & Process / Discard.
- Permission-denied shows a clear, recoverable message (not a dead end).
- Screen is fully keyboard-operable; state changes announced to SR.

## Out of scope

Persistence + enqueue wiring (03-05); processing itself (EPIC-05+).
</content>
