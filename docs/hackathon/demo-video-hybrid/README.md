# Nugget hybrid demo video

This directory contains the reproducible capture and edit tools for the hybrid
Nugget demo candidate. The edit combines a genuine iPhone capture for the
microphone and processing flow with a deterministic browser walkthrough of the
current UI. It does not simulate microphone input or present synthetic sample
data as a real user's data.

## Review outputs

- `../demo-video-final/nugget-demo-hybrid-narrated.mp4` - narrated review copy
  with embedded English captions and an AI-narration disclosure.
- `../demo-video-final/nugget-demo-hybrid-silent.mp4` - clean silent edit master.
- `../demo-video-final/nugget-demo-hybrid-contact-sheet.png` - twelve-frame
  visual QC sheet.
- `browser-walkthrough.webm` - isolated 430 x 932 browser source.
- `browser-walkthrough-timeline.json` - normalized chapter offsets read by the
  renderer.

Steven approved the complete narrated review copy on July 18, 2026. The hybrid
candidate and its verification evidence are therefore ready to be tracked and
published with the existing MVP pull request.

## Provenance and truthfulness

| Final time | Source | What it shows |
| --- | --- | --- |
| 0:00-0:16 | iPhone `01-10-58`, 0:24-0:40 | Capture-first home and entry into recording |
| 0:16-0:29 | Replaceable iPhone source, default `02-35-48`, 0:38-0:51 | Genuine timer and live microphone waveform |
| 0:29-0:49 | iPhone `02-38-45`, 1:02-1:22 | Local save and resumable processing |
| 0:49-1:02 | iPhone `02-35-48`, 2:20.5-2:33.5 | Three-idea review entry |
| 1:02-1:18 | iPhone `02-38-45`, 1:44-2:00 | Editable organization and confirmation |
| 1:18-1:39 | Isolated local browser profile | Disclosed sample library, Cards, and Compact |
| 1:39-1:59 | Isolated local browser profile | Summary-first idea detail and grounding |
| 1:59-2:16 | Isolated local browser profile | Linked Actions and completion state |
| 2:16-2:51.5 | Previously verified production walkthrough | Settings, model health, GPT-5.6/Codex attribution, and close |

The browser profile is created fresh for each capture and loads only Nugget's
built-in sample library through the visible **Load sample library** control.
Every sample idea remains visibly labeled `Sample`. The capture makes no OpenAI
request and includes no API key, notifications, private task identifiers, or
personal content.

The final tail is reused from the previous public-production walkthrough because
the current local process intentionally had no API secrets and therefore could
not truthfully show provider health as available.

## Rebuild

Start the current app on an isolated local port:

```powershell
node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3107
```

In another PowerShell window, capture the browser chapters:

```powershell
$env:NUGGET_DEMO_BASE_URL = 'http://127.0.0.1:3107'
try {
    node docs/hackathon/demo-video-hybrid/capture-walkthrough.mjs
}
finally {
    Remove-Item Env:NUGGET_DEMO_BASE_URL -ErrorAction SilentlyContinue
}
```

Render both masters and the contact sheet:

```powershell
& docs/hackathon/demo-video-hybrid/build-hybrid-demo.ps1
```

The renderer reads browser offsets by chapter name, centers portrait footage on
the warm Nugget canvas, and applies restrained push-ins capped at 1.06 scale.
It produces a 30 fps H.264 final even though Chromium's WebM source is 25 fps.

## Replace the genuine recording insert

The live waveform section is independently replaceable without changing the
filter graph:

```powershell
& docs/hackathon/demo-video-hybrid/build-hybrid-demo.ps1 `
    -RecordingSource 'C:\path\to\new-iphone-recording.mp4' `
    -RecordingStart 12.5 `
    -RecordingDuration 13
```

Keep the replacement at thirteen seconds to preserve the approved narration
beat map. A fifteen-second contract render was also verified successfully; the
renderer adjusts the total edit duration rather than hiding or stretching the
extra footage. Pass `-SkipNarrated` when validating only a silent replacement.

## Verification record

- Capture harness syntax: passed with `node --check`.
- Browser source: VP8, 430 x 932, 25 fps, 46.68 seconds; all seven chapter
  markers fit inside the encoded source.
- Default silent master: H.264, 1920 x 1080, 30 fps, limited-range `yuv420p`,
  171.533 seconds, 8,937,586 bytes.
- Replacement contract: a different 15-second range rendered successfully as
  H.264, 1920 x 1080, 30 fps, `yuv420p`, 173.533 seconds.
- Narrated review copy: H.264 video, English 48 kHz mono AAC audio, embedded
  English `mov_text` captions, 171.500 seconds, 11,267,199 bytes.
- Caption source: 14 cues.
- Full narrated-file decode: passed with no reported frame errors.
- Contact-sheet review: capture, waveform, save/process, review, sample library,
  idea detail, Actions, Settings, and close are all present; Sample and
  AI-narration disclosures remain visible.

The final human-watch gate was approved on July 18, 2026. A logged-out playback
check is still required after the eventual YouTube upload.
