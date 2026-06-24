# EPIC-03 — Recorder

> Milestone M2 · Priority P0 · Feature F-2
> Product context: [architecture §3 (RecorderService)](../../product/01-architecture.md),
> [UX §3](../../product/03-ux-guidelines.md)

## Goal

Deliver frictionless one-tap capture: a `RecorderService` state machine,
MediaRecorder capture with just-in-time mic permission, a live level meter, the
recorder screen, persistence into idea+recording, and playback on idea detail.

## Outcome / DoD

- AC-001: tapping Record + granting permission shows an active timer + level meter.
- AC-002: Save persists recording + metadata locally; appears in library with no network.
- Mic permission requested only on first record (FR-002).
- Playback works on idea detail (FR-105).

## Tasks

| ID | Title | Depends on |
| --- | --- | --- |
| [TASK-03-01](./TASK-03-01-recorder-service.md) | RecorderService state machine + MediaRecorder | EPIC-01 |
| [TASK-03-02](./TASK-03-02-level-meter-waveform.md) | Level meter + waveform preview | 03-01 |
| [TASK-03-03](./TASK-03-03-use-recorder-hook.md) | `useRecorder` hook | 03-01, 03-02 |
| [TASK-03-04](./TASK-03-04-recorder-screen.md) | Recorder screen UI + post-stop actions | 03-03 |
| [TASK-03-05](./TASK-03-05-persist-recording.md) | Persist draft → idea + recording | 03-04, EPIC-02 |
| [TASK-03-06](./TASK-03-06-playback.md) | Playback component on idea detail | 03-05 |
| [TASK-03-07](./TASK-03-07-pause-resume-warnings.md) | Pause/resume + storage/length warnings (P1) | 03-04 |

## Sequencing

03-01 → 03-02 → 03-03 → 03-04 → 03-05 → 03-06; 03-07 (P1) after 03-04.
</content>
