# Nugget demo video handoff

## Files

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

## Verification

- Encoded duration: `172.000000` seconds
- Video: H.264, 1920x1080, 30 fps, `yuv420p`
- Audio: none; intentionally reserved for Steven's voiceover
- Full decode: passed with no reported frame errors
- Caption cues: 14
- Final MP4 size: approximately 4.2 MB

After adding narration, watch the entire result once on headphones and once on
a phone speaker. The public YouTube upload still requires owner approval and a
logged-out playback check.
