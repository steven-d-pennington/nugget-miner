# EPIC-03 — Recorder

> Source: [Nugget PRD](../../Nugget_PRD.md) §7 J1, §9 (Recording), §18 Milestone 2, §19, §24
> Status: Not started · Priority: P0 · Milestone: M2

## Summary

Build the Recorder screen and underlying `RecorderService` state machine:
just-in-time microphone permission, start/stop/save/delete, duration and state
display, audio-level feedback, local Blob persistence with metadata, and
playback on the idea detail screen.

## Scope

### Functional requirements (PRD §9 — Recording and playback)

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-002 | P0 | Do not request microphone permission until the user initiates recording. |
| FR-101 | P0 | Start, stop, save, and delete a recording from a dedicated Recorder screen. |
| FR-102 | P0 | Display recording duration and current recording state. |
| FR-103 | P0 | Show a simple audio-level meter / waveform-style feedback while recording. |
| FR-104 | P0 | Save audio as a local Blob with metadata: createdAt, duration, MIME type, file size. |
| FR-105 | P0 | Provide playback controls on the idea detail screen. |
| FR-106 | P1 | Support pause/resume where browser support and complexity allow. |
| FR-107 | P1 | Warn when storage is low or a recording is unusually long. |

### User journey (PRD §7 J1)
1. Open Nugget → tap Record → request mic permission only when needed.
2. Show timer, recording state, audio-level feedback.
3. Stop → choose Save / Process Now / Delete.
4. Save locally with timestamp, duration, default title.

## Related PRD requirements

- AC-001 — tapping Record + granting permission shows active timer and audio-level feedback.
- AC-002 — Save persists recording + metadata locally and it appears in library with no network.
- NFR-005 — long processing/recording must not freeze the UI.
- NFR-007 — failures leave the original recording intact.
- R-001 / R-007 (PRD §21) — browser recording variance; long-recording memory risk.
- §24 — keep capture logic out of components; wrap a RecorderService/state machine in hooks.

## Acceptance criteria

- AC-001: Active timer + audio-level feedback appear after permission grant.
- AC-002: Saved recording + metadata persist locally and show in library offline.
- Mic permission is requested only on first record action (FR-002).
- Recorded Blob stores MIME type, sizeBytes, durationMs, createdAt (FR-104).
- Playback works from idea detail (FR-105).
- "Process Now" hands off to the processing queue (EPIC-05) without blocking the UI.

## Implementation notes

- Implement a `RecorderService` state machine (idle → requesting → recording →
  [paused] → stopping → saved/discarded); expose via a React hook (PRD §24).
- Use MediaRecorder / Web Audio; feature-detect and degrade gracefully (R-001).
- Compute a lightweight `waveformPreview` for storage (PRD §11) where feasible.
- Persist via EPIC-02 `recordings`/`ideas` repositories; default title from timestamp.
- Warn on large/long recordings; consider recommended limits and streaming (R-007).

## Definition of Done

- Recorder screen with record/stop/save/delete, timer, state, level meter.
- Just-in-time mic permission; denied-permission path handled gracefully.
- Recordings persist as Blobs with full metadata; playback on idea detail.
- AC-001 and AC-002 pass on iPhone Safari/PWA and one desktop browser.

## Dependencies

- EPIC-01 (shell/routing), EPIC-02 (recordings/ideas repos).
- Feeds EPIC-04 (library), EPIC-05 (Process Now → queue).
</content>
