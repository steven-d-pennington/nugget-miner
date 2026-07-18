# Nugget hybrid demo video design

## Purpose

Create a smoother, credible Build Week walkthrough that shows Nugget as a real
mobile product rather than a sequence of static screenshots. The final edit must
make the core flow easy to follow, remain under three minutes, and preserve a
clean replacement point for a newer iPhone recording if Steven supplies one.

## Approved direction

The video is a hybrid of two truthful sources:

1. A newly captured browser walkthrough of the current Nugget interface at a
   phone viewport.
2. A short segment from Steven's existing iPhone screen recording where the
   live waveform visibly responds to his voice.

The iPhone footage is the preferred recording insert. No simulated waveform is
needed in the submission candidate. A simulated waveform may only appear in an
internal timing draft and must be visibly disclosed as a placeholder.

## Deliverables

Produce two synchronized outputs:

- **Silent visual master:** the complete picture edit without narration, suitable
  for replacing the recording insert or adding a different voice track.
- **Narrated review copy:** the same picture edit with the existing approved
  narration and captions where they remain accurate and aligned.

Both outputs use H.264 video, a 1920 x 1080 canvas, 30 frames per second,
`yuv420p`, and fast-start metadata. The narrated copy uses AAC audio and embedded
English captions when available.

## Source material

The edit may use these existing local iPhone captures:

- `ScreenRecording_07-18-2026 02-35-48_1.MP4` for the strongest live waveform;
- `ScreenRecording_07-18-2026 02-38-45_1.MP4` for stop, local save, and
  processing continuity;
- the other previously reviewed July 18 recordings only when they provide a
  cleaner transition than the new browser walkthrough.

The browser walkthrough uses the latest verified Nugget preview or a local build
of the same commit. It must show only synthetic hackathon-safe content. If the
sample library is used, every visible `Sample` label remains intact and the
narration must not describe sample rows as the direct output of the recording.

## Story and timing

Target **2:48 to 2:53**, with a hard maximum of **2:59**. The approved
narration currently ends at 2:51.5, so the picture edit follows its established
beats instead of compressing or rewriting the audio.

| Time | Chapter | Visual intent |
| --- | --- | --- |
| 0:00-0:16 | Capture | Establish the mobile-first record control and the problem Nugget solves. |
| 0:16-0:29 | Real recording insert | Use the genuine iPhone clip with the strongest responsive waveform. Keep this thirteen-second block independently replaceable. |
| 0:29-0:49 | Save and process | Show stop, local save, and the resumable processing timeline as one readable flow. |
| 0:49-1:18 | Review | Show that one ramble becomes separate editable ideas, including category, tags, goals, blockers, and research. |
| 1:18-1:39 | Ideas | Show the card feed, Compact toggle, and one useful category or tag filter. |
| 1:39-1:59 | Idea detail | Move from summary to the bold `Why it matters` and `What's in the way` sections, research, resources, actions, and source. |
| 1:59-2:16 | Actions | Complete one next action while keeping its source idea visible. |
| 2:16-2:40 | Settings | Show the privacy boundary and live provider health without exposing secrets. |
| 2:40-2:52 | Attribution and close | Show truthful Codex attribution, then return to Capture and hold on the Nugget record control. |

The picture edit may shift individual chapters by several seconds to match real
interaction speed, but it must preserve this order and remain below the hard
runtime limit.

## Motion language

- Keep the phone centered on Nugget's warm canvas with a restrained border and
  soft shadow.
- Use direct cuts when a tap causes a route change; use short dissolves only for
  chapter changes or source changes.
- Add subtle 4-8 percent push-ins to direct attention to the waveform, review
  fields, library toggle, and structured idea sections.
- Prefer real scrolling and taps over static holds. Slow or retime only enough
  to make labels readable.
- Do not add decorative motion that competes with the product interaction.
- Preserve the portrait source without stretching, cropping controls, or hiding
  disclosure and `Sample` labels.

## Recording replacement contract

The recording insert is a single, self-contained block in the edit timeline.
Its replacement clip must:

- be portrait phone footage;
- show the Nugget recording state and responsive waveform;
- run between twelve and eighteen seconds;
- include no private notifications or unrelated content;
- enter from the idle Capture screen and end before or immediately after
  `Stop & save`.

The final render script exposes the replacement source path, start time, and
duration as parameters. Replacing the clip must not require rebuilding the rest
of the walkthrough.

## Truthfulness and submission safety

- Do not present a simulated waveform as a real microphone recording.
- Do not cut from a visible processing error to a successful result as though
  the same request succeeded.
- Preserve `Sample` labels and disclose sample data in narration when it is used.
- Do not claim that transcription, GPT organization, or research happens fully
  on-device.
- Do not show API keys, private task content, personal notifications, or a
  private Codex session identifier.
- Show only provider names and availability actually visible in the app.
- Use synthetic or personal demo content, never employer or customer material.

## Verification

Before delivery:

1. Probe both output files for duration, dimensions, codecs, frame rate, audio,
   caption streams, and fast-start compatibility.
2. Generate a visual contact sheet covering every chapter.
3. Watch the complete narrated copy at normal speed and check audio-picture
   alignment, readable labels, disclosure, and the recording splice.
4. Confirm the silent and narrated copies share the same picture duration.
5. Confirm the runtime is no longer than 2:59 and that no frame exposes private
   data or misleading state.

## Out of scope

- Re-recording Steven's voice or requiring him to complete another full take;
- inventing a different product design for the video;
- adding new Nugget features solely for the edit;
- uploading or submitting the video before Steven reviews and approves it.
