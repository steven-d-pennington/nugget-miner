# Nugget public demo script

> Recording the complete phone walkthrough in one continuous take? Follow
> [ONE_TAKE_DEMO_SCRIPT.md](./ONE_TAKE_DEMO_SCRIPT.md). This document remains
> the evidence and edit-oriented version of the demo plan.

## Recording boundary

The owner-approved local master is
[`demo-video-final/nugget-demo-hybrid-narrated.mp4`](demo-video-final/nugget-demo-hybrid-narrated.mp4).
It is published at [https://youtu.be/ct8tY_JwTPw](https://youtu.be/ct8tY_JwTPw).
Public visibility, runtime, title, description, audio, and the manually
published 14-cue English caption track were verified on July 18, 2026.

The hard runtime ceiling is **2:59**. Target an exported runtime of **2:50**
(acceptable range: **2:45-2:55**). The Sprint 6 plan windows total 2:59; the
target leaves nine seconds for clean cuts and timing drift. Never export a file
at or over 3:00.

## Timed sequence

| Plan window | Target used | Visible screen / route and operator action | Narration | Cut / transition | Evidence that must be visible |
| --- | ---: | --- | --- | --- | --- |
| 0:00-0:18 | 0:17 | **Capture** at `/`. Show the authorized public production URL in browser chrome, then `Quick capture`, `What's on your mind?`, and `Record`. | "Good ideas arrive while you are moving, then disappear inside a long voice note. Nugget starts with one tap: capture first, organize later. This recording is stored in the browser before processing begins." | Straight cut from URL to record control. | Public production origin; `Record`; local-save-before-processing wording; no account prompt. |
| 0:18-0:38 | 0:20 | At `/`, tap `Record`, speak the prepared ramble below, then tap `Stop & save`. Show `Listening…`, live microphone level, and the final timer. | "I am recording two unrelated thoughts in one real ramble. When I choose Stop & save, the audio is saved locally first, so I can leave once the saved state appears." | The 29-33 second ramble exceeds this 20-second window. Show the first portion, a final active timer, then cut to `Stop & save`. Do not speed audio up or imply the entire ramble lasted 20 seconds. | Active recording; microphone level; `Stop & save`; final timer of at least 0:29; no private data. |
| 0:38-0:57 | 0:18 | **Capture detail** at `/capture/<captureId>`. Show `Recording saved`, activate `Process now` and consent if needed, then the `Saved`, `Transcribing`, `Organizing`, `Ready for review` timeline. | "After saving, the capture shows Saved, Transcribing, Organizing, and Ready for review. When I initiate cloud processing, audio goes to transcription and the transcript goes to GPT-5.6. The saved capture stays in this browser." | Hold the active state briefly. If it remains pending, use the truthful fallback below; never cut from an error to a success as though it worked. | `Recording saved`; four-stage timeline; `Process now` or active status; processing disclosure. |
| 0:57-1:38 | 0:39 | **Review** at `/review/<captureId>`. Show `2 ideas found` (or truthful count), Personal and Work drafts, category, tags, blocker, research-needed content, provenance, `View source capture`, then confirm ready ideas. | "One transcript becomes distinct, editable idea records. I can correct the title, category, tags, blocker, research need, and next steps. Provenance and the source capture keep the proposal connected to the ramble, and I confirm only what I trust." | Cut from the timeline only after the actual capture is ready. A preprocessed safe capture requires the disclosure below. | Truthful count; separate Personal and Work records; editable fields; `Explicit`, `Inferred`, or `Suggested`; source link; confirmation action. |
| 1:38-2:06 | 0:27 | **Ideas** at `/ideas`. Search `community`, select `Personal`, and open **Create a neighborhood tool-sharing library** at `/ideas/<ideaId>`. Prefer actual confirmed output. If using local samples, keep `Sample` visible and say so. | "Confirmed records are in Ideas, where search and category and tag filters retrieve them locally. I search community and select Personal. If this row says Sample, it is clearly labeled local demo data, not a live GPT result." | Standard library flow. Never remove a `Sample` chip or call a sample row the live result. | `Ideas`; `community`; `Personal`; category/tag filters; row title; `Sample` if applicable. |
| 2:06-2:24 | 0:17 | **Idea** at `/ideas/<ideaId>`, then **Actions** at `/actions`. Show tool-sharing goal, blocker, `Research needed`, suggested action, `Linked actions`, then complete **Draft a one-page interest survey.** | "The detail keeps the goal, blocker, research need, and suggested action with the idea. Actions collects accepted next steps without losing their source idea." | Click once into Actions; retain the source title or link. | Goal; blocker; `Research needed`; suggested action; linked action; completion state. |
| 2:24-2:44 | 0:19 | **Settings** at `/settings`, `About`. Show `Built with GPT-5.6 and Codex`, non-secret `Transcription` and `Organization` health, then brief README/source/evaluation evidence. | "Settings exposes non-secret model health: transcription reports whisper-1 and organization reports gpt-5.6-terra. The repository retains schemas, focused tests, and a 12-fixture live evaluation with the real response IDs." | Show actual displayed values only. Do not show credentials or imply the fixed fixture suite proves every possible ramble. | About heading; actual health; structured-output/schema, focused-test, or evaluation evidence; no secret. |
| 2:44-2:56 | 0:10 | Keep actual README or dated commit history in view; do not display a Session ID in the recording. | "Codex supported plans, implementation, focused tests, browser checks, debugging, and verification. The human owner made the product and release decisions. The verified Session ID is recorded in the submission materials." | Slow dissolve toward Capture or Ideas. | Actual history; no private task content; no fabricated Session ID. |
| 2:56-2:59 | 0:03 | Return to the Nugget mark and a clean Capture or Ideas screen. | "Nugget makes moving thoughts useful." | End cleanly; no fade beyond 2:59. | Nugget mark; no third-party logo or music issue. |

### GPT-5.6 explanation used by the recording

After consent or an initiated processing action, audio is sent for transcription
when needed and the resulting transcript is sent to GPT-5.6 organization. The
organization flow first separates **untrusted** transcript content into zero or
more source-grounded candidate ideas, then organizes each candidate into
editable fields, one allowed category, tags, research suggestions, and next
actions. Structured results are validated before review records are written.
Do not say that a transcript can direct the model, that the product executes
live research, or that all processing happens on-device.

The source defaults are `gpt-4o-mini-transcribe` for transcription and
`gpt-5.6-terra` for organization. Current public production reports
`whisper-1` and `gpt-5.6-terra` through Settings health.

### Codex explanation used by the recording

Codex supported sprint plans, implementation, focused tests, browser checks,
debugging, and verification. The human owner chose the mobile-first capture
flow, mandatory review, category and tag model, visual direction, scope cuts,
and release boundaries. Do not imply that Codex independently made those
product decisions. The primary implementation `/feedback` Session ID is
verified in the submission materials.

## Prepared two-idea ramble

Use this safe, non-private ramble verbatim. It is 74 words and takes about
30-33 seconds at 135-150 words per minute. The boundary cues are intentional,
but deliver it naturally rather than as test labels.

> Personal: I want to start a neighborhood tool-sharing library so nearby households can borrow rarely used tools instead of buying duplicates. The blocker is tracking availability and responsibility. I need to research lightweight inventory and lending tools. Separately, at work, I want an automated weekly support handoff that carries unresolved tickets, customer impact, owners, and next steps into Monday standup. Before I build it, I need to map which system owns the handoff fields.

The Personal idea contains an explicit blocker and research need; the Work idea
is separate and contains no company, customer, or account data. If the live
outcome does not separate the ideas cleanly, preserve that fact and use the
fallback rather than edit it to look successful.

## Truthful latency and failure fallback

1. Run the full ramble and initiate the real cloud-processing path before the
   final take. Retain the capture ID and visible state as evidence.
2. If organization reaches review within budget, use that real capture for the
   review and primary library sequence.
3. If it remains pending, show saved/processing and say: "This capture is still
   processing. For the remaining interface tour, I am switching to a
   preprocessed safe capture." Add a clearly visible, editor-added on-screen
   video caption or overlay reading `Preprocessed safe capture` on every result
   screen that follows. It is not an app-generated label.
4. If using the shipped local sample library instead, say: "For this interface
   tour, I am using Nugget's clearly labeled local sample library. It does not
   call GPT-5.6 and is not the live result." Keep `Sample` visible.
5. If a provider or validation failure appears, show preserved state and a
   recovery action such as `Retry`, then stop the live-success narrative.

## Pacing check

| Item | Estimated words | Spoken duration at 135-150 WPM | Timing control |
| --- | ---: | ---: | --- |
| Narration outside the ramble | 280 | 1:52-2:04 | Deliver calmly; remove screen holds before trimming words. |
| Prepared ramble | 74 | 0:30-0:33 | Record in full; use the disclosed jump cut to preserve the plan window. |
| Total spoken material | 354 | 2:22-2:37 | Leaves time for the 2:45-2:55 visual target, pointer movement, and cuts. |
| Planned hard window | n/a | 2:59 | A ceiling, never the export target. |

Before export, confirm word count and runtime again. The owner execution gate is
[DEMO_RECORDING_CHECKLIST.md](DEMO_RECORDING_CHECKLIST.md); the pending public
video remains explicit in [DEVPOST_SUBMISSION.md](DEVPOST_SUBMISSION.md).
