# Nugget Hybrid Demo Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a smooth, truthful Nugget walkthrough with a replaceable genuine iPhone waveform insert, a silent edit master, a narrated review copy, and verification evidence.

**Architecture:** A Playwright capture script records one deterministic phone-viewport walkthrough of the latest local Nugget build after loading the disclosed sample library. A parameterized PowerShell/FFmpeg renderer combines that browser source with the approved iPhone capture ranges and existing narration, then produces the two masters and media evidence without modifying application code.

**Tech Stack:** Node.js, `@playwright/test` 1.61.1, PowerShell 7, FFmpeg 8.1.1, FFprobe, Next.js local production server.

## Global Constraints

- Final runtime must be no longer than **2:59**; target **2:48 to 2:53**.
- Output must be H.264, 1920 x 1080, 30 fps, `yuv420p`, and fast-start compatible.
- The narrated copy uses the existing approved narration and embedded English captions.
- The recording insert must remain independently replaceable through script parameters.
- Do not present a simulated waveform as a real microphone recording.
- Preserve every visible `Sample` label and the narration's sample disclosure.
- Do not expose API keys, private notifications, personal content, or private task identifiers.
- Use one write-enabled agent because all agents share the worktree.
- Preserve the existing untracked rough-cut artifacts; do not stage them.

---

## File map

- Create `docs/hackathon/demo-video-hybrid/capture-walkthrough.mjs`: deterministic browser preparation, interaction capture, and chapter-marker output.
- Create `docs/hackathon/demo-video-hybrid/build-hybrid-demo.ps1`: parameterized FFmpeg edit, narration/caption mux, media probing, and contact-sheet generation.
- Create `docs/hackathon/demo-video-hybrid/README.md`: exact source provenance, commands, outputs, replacement instructions, and verification record.
- Create `docs/hackathon/demo-video-hybrid/browser-walkthrough.webm`: generated browser capture; keep untracked until visual review passes.
- Create `docs/hackathon/demo-video-hybrid/browser-walkthrough-timeline.json`: generated frame-source timing metadata.
- Create `docs/hackathon/demo-video-final/nugget-demo-hybrid-silent.mp4`: silent review master.
- Create `docs/hackathon/demo-video-final/nugget-demo-hybrid-narrated.mp4`: narrated and captioned review copy.
- Create `docs/hackathon/demo-video-final/nugget-demo-hybrid-contact-sheet.png`: chapter-level visual evidence.
- Modify `docs/hackathon/demo-video-final/README.md`: add the approved hybrid candidate only after verification.

---

### Task 1: Capture a deterministic phone walkthrough

**Files:**
- Create: `docs/hackathon/demo-video-hybrid/capture-walkthrough.mjs`
- Create: `docs/hackathon/demo-video-hybrid/browser-walkthrough.webm`
- Create: `docs/hackathon/demo-video-hybrid/browser-walkthrough-timeline.json`

**Interfaces:**
- Consumes: `NUGGET_DEMO_BASE_URL`, defaulting to `http://127.0.0.1:3000`; the current Nugget UI; the built-in disclosed sample library.
- Produces: `browser-walkthrough.webm` and a JSON object shaped as `{ source, viewport, chapters: [{ name, startSeconds, endSeconds }] }`.

- [ ] **Step 1: Confirm capture prerequisites**

Run:

```powershell
node --version
npx playwright --version
Get-Command ffmpeg.exe -ErrorAction SilentlyContinue
```

Expected: Node and Playwright print versions. If `ffmpeg.exe` is not on PATH,
use the verified WinGet path already accepted by `build-phone-demo.ps1`.

- [ ] **Step 2: Create the capture script**

Implement these fixed capture behaviors:

```js
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.NUGGET_DEMO_BASE_URL ?? 'http://127.0.0.1:3000';
const outputDirectory = path.resolve('docs/hackathon/demo-video-hybrid');
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 430, height: 932 },
  recordVideo: { dir: outputDirectory, size: { width: 430, height: 932 } },
  colorScheme: 'light',
  locale: 'en-US',
  timezoneId: 'America/Los_Angeles',
});
const page = await context.newPage();
const video = page.video();
const captureStartedAt = performance.now();
const chapters = [];

async function mark(name, action) {
  const startSeconds = (performance.now() - captureStartedAt) / 1000;
  await action();
  const endSeconds = (performance.now() - captureStartedAt) / 1000;
  chapters.push({ name, startSeconds, endSeconds });
}
```

Before the usable walkthrough, navigate to `/settings`, click the unique
`Load sample library` button, wait for `Sample ideas added` or
`Sample ideas are already loaded`, then navigate directly to `/ideas`.

Capture these chapters with concrete state checks after each action:

1. `ideas-cards`: hold the card library for four seconds.
2. `ideas-compact`: click the unique `Compact` button, verify
   `aria-pressed="true"`, and hold for five seconds.
3. `ideas-cards-return`: click `Cards`, verify `aria-pressed="true"`, and hold
   for three seconds.
4. `idea-detail`: click the unique sample tool-library link, hold the summary,
   then perform two deliberate 360-pixel downward scrolls with two-second holds
   so `Why it matters`, `What's in the way`, and `Next actions` are readable.
5. `actions`: navigate to `/actions`, hold the source-linked action list, toggle
   one open action once, and hold the resulting state.
6. `settings`: navigate to `/settings`, scroll the `About` heading into view,
   hold until the transcription and organization health rows contain
   `available`.
7. `close`: navigate to `/`, hold the Capture screen for five seconds.

Close the context, save the Playwright video to
`browser-walkthrough.webm`, write the chapter JSON, then close the browser.

- [ ] **Step 3: Syntax-check the capture script**

Run:

```powershell
node --check docs/hackathon/demo-video-hybrid/capture-walkthrough.mjs
```

Expected: exit code 0 with no syntax error.

- [ ] **Step 4: Start the verified local app and record the walkthrough**

Run the app in a hidden process, record its process ID, and wait until the home
route returns HTTP 200. Then run:

```powershell
$env:NUGGET_DEMO_BASE_URL = 'http://127.0.0.1:3000'
node docs/hackathon/demo-video-hybrid/capture-walkthrough.mjs
Remove-Item Env:NUGGET_DEMO_BASE_URL
```

Expected: both generated browser files exist, the JSON contains all seven
chapter names, and the WebM is longer than 45 seconds.

- [ ] **Step 5: Inspect the generated capture**

Run:

```powershell
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate -show_entries format=duration -of json docs/hackathon/demo-video-hybrid/browser-walkthrough.webm
```

Expected: a 430 x 932 video stream at 30 fps with a duration long enough to
cover every JSON chapter.

- [ ] **Step 6: Commit the reusable capture harness**

```powershell
git add docs/hackathon/demo-video-hybrid/capture-walkthrough.mjs
git commit -m "chore: add hybrid demo capture harness"
```

Do not stage the generated WebM or timeline yet.

---

### Task 2: Build the parameterized hybrid picture edit

**Files:**
- Create: `docs/hackathon/demo-video-hybrid/build-hybrid-demo.ps1`
- Create: `docs/hackathon/demo-video-final/nugget-demo-hybrid-silent.mp4`

**Interfaces:**
- Consumes: `-RecordingSource`, `-RecordingStart`, `-RecordingDuration`,
  `-BrowserSource`, `-BrowserTimeline`, and the existing approved phone sources.
- Produces: a 2:51.5 or shorter silent H.264 master with the recording insert at
  final time 0:16-0:29.

- [ ] **Step 1: Create a parameterized render script**

The script begins with these parameters and validates every input before FFmpeg
runs:

```powershell
param(
    [string]$RecordingSource = (Join-Path $env:USERPROFILE 'Downloads\ScreenRecording_07-18-2026 02-35-48_1.MP4'),
    [double]$RecordingStart = 38,
    [double]$RecordingDuration = 13,
    [string]$BrowserSource = (Join-Path $PSScriptRoot 'browser-walkthrough.webm'),
    [string]$BrowserTimeline = (Join-Path $PSScriptRoot 'browser-walkthrough-timeline.json'),
    [string]$FfmpegDirectory = 'C:\Users\Steven Pennington\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin'
)
```

Read the timeline JSON by chapter name instead of hard-coding browser offsets.
Use the approved phone footage for Capture, recording, save/process, and review;
use the new browser chapters for Ideas, idea detail, Actions, Settings, and the
closing Capture screen.

Each portrait source is placed on a 1920 x 1080 warm canvas with the existing
phone shadow and border. Use `zoompan` only on the recording, library toggle,
and idea-detail sections, capped at 1.08 scale. Concat the chapter videos in the
exact approved order and trim the picture to 2:51.5.

- [ ] **Step 2: Parse-check the PowerShell renderer**

Run:

```powershell
$errors = $null
[System.Management.Automation.Language.Parser]::ParseFile(
  (Resolve-Path 'docs/hackathon/demo-video-hybrid/build-hybrid-demo.ps1'),
  [ref]$null,
  [ref]$errors
) | Out-Null
if ($errors.Count) { $errors | Format-List; exit 1 }
```

Expected: exit code 0 and no parser errors.

- [ ] **Step 3: Render the silent master**

Run:

```powershell
& docs/hackathon/demo-video-hybrid/build-hybrid-demo.ps1
```

Expected: `nugget-demo-hybrid-silent.mp4` is created, FFmpeg exits 0, and no
source segment is stretched or cropped beyond the phone viewport.

- [ ] **Step 4: Verify the replaceable recording contract**

Run a second render to a temporary output using a fifteen-second portion of the
same recording source. The renderer must accept the changed start and duration
without editing its filter graph. Delete only the temporary output after the
probe succeeds.

- [ ] **Step 5: Commit the reusable renderer**

```powershell
git add docs/hackathon/demo-video-hybrid/build-hybrid-demo.ps1
git commit -m "chore: add hybrid demo renderer"
```

Do not stage video outputs until the final visual review.

---

### Task 3: Create narrated output and verification evidence

**Files:**
- Create: `docs/hackathon/demo-video-final/nugget-demo-hybrid-narrated.mp4`
- Create: `docs/hackathon/demo-video-final/nugget-demo-hybrid-contact-sheet.png`
- Create: `docs/hackathon/demo-video-hybrid/README.md`
- Modify: `docs/hackathon/demo-video-final/README.md`

**Interfaces:**
- Consumes: the silent master, `nugget-demo-final-with-openai-narration.mp4`,
  and `nugget-demo-voiceover.srt`.
- Produces: the final review copy, contact sheet, and a complete evidence record.

- [ ] **Step 1: Mux narration and captions without re-encoding video**

Map the silent master's video, the existing narrated source's audio, and the
existing English subtitle stream. Use `-shortest`, `-c:v copy`, `-c:a copy`,
`-c:s mov_text`, and `-movflags +faststart`.

Expected: the narrated output has one H.264 video stream, one AAC audio stream,
and one `mov_text` English subtitle stream.

- [ ] **Step 2: Generate a chapter contact sheet**

Use FFmpeg to sample frames at final times 0:06, 0:22, 0:38, 0:56, 1:10,
1:24, 1:33, 1:46, 2:08, 2:28, and 2:47. Scale each frame to 480 x 270 and tile
them in a labeled 4 x 3 sheet.

Expected: every story chapter is visible and no tile contains a blank frame,
error state, private notification, hidden sample label, or clipped control.

- [ ] **Step 3: Probe both masters**

Run FFprobe JSON output for format duration and every stream's codec, width,
height, frame rate, sample rate, and channel count.

Expected:

- both picture durations differ by no more than 0.1 seconds;
- both durations are at most 179 seconds;
- both videos are 1920 x 1080 H.264 at 30 fps and `yuv420p`;
- the silent master has no audio stream;
- the narrated copy has AAC audio and English `mov_text` captions.

- [ ] **Step 4: Perform complete manual playback review**

Watch the narrated file from start to finish at normal speed. Record pass/fail
for: responsive real waveform, local-save continuity, truthful safe-capture and
sample disclosure, readable review fields, Cards/Compact flow, bold idea-detail
sections, source-linked Actions, actual provider health, attribution, and clean
ending.

- [ ] **Step 5: Write the evidence README**

Document exact source files and ranges, browser commit, output checksums,
FFprobe results, runtime, manual review result, known limitations, and this
replacement command:

```powershell
& docs/hackathon/demo-video-hybrid/build-hybrid-demo.ps1 `
  -RecordingSource 'C:\path\to\replacement.MP4' `
  -RecordingStart 0 `
  -RecordingDuration 13
```

- [ ] **Step 6: Commit approved documentation and media**

Only after Steven approves the narrated review copy:

```powershell
git add docs/hackathon/demo-video-hybrid/README.md `
  docs/hackathon/demo-video-final/README.md `
  docs/hackathon/demo-video-final/nugget-demo-hybrid-silent.mp4 `
  docs/hackathon/demo-video-final/nugget-demo-hybrid-narrated.mp4 `
  docs/hackathon/demo-video-final/nugget-demo-hybrid-contact-sheet.png
git commit -m "docs: add hybrid Nugget demo video"
```

---

### Task 4: Final handoff

**Files:**
- Verify only; no new files required.

**Interfaces:**
- Consumes: approved media and evidence from Tasks 1-3.
- Produces: direct local and downloadable links plus exact replacement guidance.

- [ ] **Step 1: Re-run media probes and checksums**

Expected: results match the committed README and both committed files exist at
the documented paths.

- [ ] **Step 2: Confirm repository scope**

Run `git status --short` and verify the previously rejected rough-cut artifacts
remain untracked and were not accidentally included.

- [ ] **Step 3: Push the verified commits**

Push `codex/mvp-completion-2026-07-17` without force and confirm PR #5 updates.

- [ ] **Step 4: Deliver review links**

Provide clickable links to the narrated MP4, silent master, contact sheet, edit
README, and PR. State explicitly that no Devpost or YouTube submission was made.
