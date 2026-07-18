# Nugget demo video handoff

## Approved hybrid candidate

Steven approved `nugget-demo-hybrid-narrated.mp4` on July 18, 2026 as the
current upload candidate. It combines genuine iPhone capture and live waveform
footage with a deterministic walkthrough of the current sample library, subtle
push-in motion, OpenAI narration, and embedded English captions.

- `nugget-demo-hybrid-narrated.mp4` - approved 2:51.5 upload candidate.
- `nugget-demo-hybrid-silent.mp4` - clean silent edit master.
- `nugget-demo-hybrid-contact-sheet.png` - chapter-level visual verification.
- `../demo-video-hybrid/README.md` - exact provenance, replacement workflow,
  render commands, and verification record.

## Files

- `nugget-demo-final-phone-walkthrough.mp4` — the 2:51.5 candidate that replaces
  the first 2:16 with Steven's real iPhone walkthrough footage while retaining
  the verified Settings, attribution, closing beats, OpenAI narration, and
  embedded English captions.
- `nugget-demo-phone-contact-sheet.png` — visual QC overview of the phone-footage
  candidate.
- `nugget-demo-final-with-openai-narration.mp4` — the finished 2:52 video with
  OpenAI TTS narration and an embedded English caption track.
- `nugget-demo-silent-walkthrough.mp4` — the 1920x1080, 30 fps, silent
  picture master locked at 2:52.
- `NUGGET_DEMO_VOICEOVER_BEAT_MAP.md` — timestamped narration, voice-clone
  pacing notes, pronunciation hints, and the final mux command.
- `nugget-demo-voiceover.srt` — 14 caption cues matching the beat map.
- `nugget-demo-contact-sheet.png` — visual QC overview of the complete edit.

## What was recorded

The central portrait recording is a live walkthrough of the public production
app at `https://nugget-miner-kappa.vercel.app`. It shows the real animated
capture state, local save, review interaction, search and category filtering,
Cards and Compact views, summary-first idea detail, linked Actions, and
Settings/model health.

The recording used an isolated browser profile, a generated safe audio test
tone, and the shipped local sample library. No personal data or API key appears
in the video, and no OpenAI request was made for this capture. The prepared
review state and local sample views are explicitly labeled in the edit.

## Narration

The narrated export uses OpenAI `tts-1-hd` with the `onyx` voice at 0.95x
generation speed. The fourteen narration cues were generated separately and
placed at the beat-map timestamps. Thirteen fit without time compression; the
short model-health cue was adjusted by 3.7% to remain inside its visual beat.

The audio is normalized to -16 LUFS with a true peak below -1 dBTP. The video
contains a persistent `AI-GENERATED NARRATION - OPENAI TTS-1-HD` disclosure.

## Verification

- Encoded duration: `172.000000` seconds
- Video: H.264, 1920x1080, 30 fps, `yuv420p`
- Narrated export audio: AAC, 48 kHz, mono, English
- Narrated export captions: embedded English `mov_text` track plus source SRT
- Full decode: passed with no reported frame errors
- Caption cues: 14
- Narrated MP4 size: approximately 6.6 MB
- Silent MP4 size: approximately 4.2 MB

After adding narration, watch the entire result once on headphones and once on
a phone speaker. The public YouTube upload still requires owner approval and a
logged-out playback check.

For the phone-footage source inventory, edit map, and reproducible render
command, see `../demo-video-draft/PHONE_CAPTURE_EDIT.md`.
