# Nugget demo voiceover beat map

## Audio target

- Picture lock: `nugget-demo-silent-walkthrough.mp4`
- Runtime: **2:52 exactly**
- Delivery: warm, conversational, confident; approximately 125-135 words per minute
- Leave the first half-second and final half-second silent.
- Generate dry narration only. No music or sound effects are required.
- Preferred handoff: 48 kHz, 24-bit WAV, mono or centered stereo.
- Aim for narration peaks below -3 dBFS. The finished video can be normalized near -16 LUFS.

The bold labels in the video are chapter cues. The amber disclosures are
intentional and must remain visible in the final upload.

## Timestamped narration

| Time | Picture beat | Voiceover |
| --- | --- | --- |
| 0:00-0:08 | Capture screen and public production origin | **Good ideas arrive while you're moving, then disappear inside a long voice note.** |
| 0:08-0:16 | Concave Record button and ready waveform | **Nugget starts with one tap: capture first, organize later.** |
| 0:16-0:29 | Live timer and animated waveform | **The voice-first screen stays deliberately simple. I can speak naturally, watch the live waveform, and stop when the thought is out of my head.** |
| 0:29-0:49 | Recording saved, source audio, processing timeline | **The recording is saved in this browser before cloud processing begins. From here, Nugget can transcribe the audio, organize the transcript, and return a reviewable result without losing the original source.** |
| 0:49-1:02 | `Preprocessed safe capture` disclosure and three review drafts | **For this interface walkthrough, I'm switching to a clearly disclosed, preprocessed safe capture. One ramble has become three separate nugget drafts.** |
| 1:02-1:18 | Editable fields, source excerpt, provenance, confirmation | **Each draft is editable before I trust it: title, summary, category, tags, purpose, goals, blockers, research needs, and next actions. Explicit, inferred, and suggested labels show how every field relates to the source.** |
| 1:18-1:27 | Ideas library and local-sample disclosure | **This next view is Nugget's labeled local sample library, so it does not make a new GPT-5.6 call.** |
| 1:27-1:39 | Search `community`, Personal filter, Compact and Cards toggles | **I can search locally, filter by category and tags, and switch between a balanced card feed and a compact scan view.** |
| 1:39-1:59 | Summary-first idea detail, blocker, research, action | **Opening an idea puts the useful summary first. The purpose, concrete goal, blocker, research need, and suggested action stay together, while editing and source details remain one tap away.** |
| 1:59-2:16 | Actions screen and completed-state interaction | **Accepted next steps collect in Actions without losing the idea they came from. That turns a useful thought into something I can actually move forward.** |
| 2:16-2:35 | Settings, privacy boundary, and model health | **Nugget keeps saved recordings and ideas in the browser. After explicit consent, transcript text is treated as untrusted input and sent to GPT-5.6 Terra for source-grounded separation and organization. Structured results are validated before review.** |
| 2:35-2:40 | Production health | **Settings also shows live Whisper and GPT-5.6 Terra health.** |
| 2:40-2:49 | Ideas return and attribution | **Codex helped plan, build, test, debug, and verify the product; I made the product and release decisions.** |
| 2:49-2:52 | Final Capture frame | **Nugget makes moving thoughts useful.** |

## Voice-clone production notes

1. Generate one line or one table row at a time. This makes timing corrections
   much easier than regenerating a single three-minute take.
2. Keep the wording exactly as written for the two disclosure beats at 0:49 and
   1:18. They distinguish prepared/sample data from live-provider evidence.
3. Use natural pauses between rows. If the generated read runs long, shorten
   pauses before changing words; do not increase playback speed above 1.03x.
4. Place each clip at its listed start time. A clip may finish early and leave a
   short visual breath before the next chapter.
5. After assembly, listen once on headphones and once through phone speakers.
   Confirm that `GPT-5.6`, `Whisper`, `Codex`, and `Nugget` are pronounced
   correctly.

## Suggested pronunciation hints

- Nugget: `NUG-it`
- Codex: `CODE-ex`
- GPT-5.6: `G P T five point six`
- GPT-5.6 Terra: `G P T five point six TEH-ruh`
- Whisper: standard English pronunciation

## Final mux command

After the narration WAV is saved beside the video as `nugget-demo-voiceover.wav`:

```powershell
ffmpeg -i nugget-demo-silent-walkthrough.mp4 -i nugget-demo-voiceover.wav `
  -c:v copy -c:a aac -b:a 192k -af "loudnorm=I=-16:TP=-1.5:LRA=11" `
  -shortest nugget-demo-final-with-voice.mp4
```

Measure the result after muxing. The public submission must remain below three
minutes; this picture master is intentionally locked at 2:52.
