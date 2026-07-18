# Nugget demo edit package

## Deliverable boundary

This is the reproducible edit package for the owner-approved master now
published at [https://youtu.be/ct8tY_JwTPw](https://youtu.be/ct8tY_JwTPw).
The export remains constrained to **2:45 to 2:55**, never at or over three
minutes.

The visual sequence uses safe sample data and no personal recordings. The
opening capture sequence may be recorded live if convenient; the organization
and library portions below are deliberately disclosed fallback visuals.

## Project and edit settings

| Setting | Value |
| --- | --- |
| Canvas | 1920 x 1080, 16:9 |
| Screen treatment | Center the portrait app capture on a soft warm off-white background; no fake device frame is required. |
| Audio | Steven's spoken narration; no music needed. |
| Public origin shown at opening | `https://nugget-miner-kappa.vercel.app` |
| Final runtime target | 2:52 |
| Required visible labels | `Preprocessed safe capture` on review fallback; `Sample` on sample-library views. |
| Do not show | API keys, terminal output, browser history, personal tabs, real captures, customer data, fake evaluation results, or a Session ID in the recording. |

## Asset manifest

| ID | File | Use |
| --- | --- | --- |
| A1 | `submission-assets/01-capture-idle.png` | Opening capture introduction |
| A2 | `submission-assets/02-recording-saved-processing.png` | Saved and processing explanation |
| A3 | `submission-assets/03-three-ideas-review.png` | Preprocessed review fallback |
| A4 | `demo-capture-drafts/02-ideas-library-production.png` | Searchable confirmed-ideas library |
| A5 | `demo-capture-drafts/03-idea-detail-production.png` | Category, tags, goals, blockers, research, and provenance |
| A6 | `demo-capture-drafts/04-actions-production.png` | Accepted next steps with source ideas |
| A7 | `demo-capture-drafts/05-settings-production.png` | Privacy, local storage, and model health |

The `demo-capture-drafts` images were captured on the deployed production code
using a separate browser origin and only the local sample library. They contain
no user records.

## Edit timeline and narration

Use straightforward cuts. Add only two editor overlays: the fallback disclosure
on the review screen and a small `Local sample library` caption for the library
tour. Keep the in-app `Sample` chips visible whenever they appear.

| Time | Visual | Voiceover / spoken content | Edit notes |
| --- | --- | --- | --- |
| 0:00-0:12 | A1; briefly show the public URL, then the Record control. | "Good ideas often show up while you are moving, then disappear inside a long voice note. Nugget starts with one tap: capture first, organize later." | Make the public URL legible for two seconds. |
| 0:12-0:32 | Optional live Capture recording. If not recording live, use A2 and say the alternate line below. | **Live:** Read the safe ramble in [DEMO_SCRIPT.md](DEMO_SCRIPT.md#prepared-two-idea-ramble). **Alternate:** "This safe two-idea capture is saved locally before any organization begins." | If a live take runs about 30 seconds, cut from its first moments to the saved state; do not speed up the speech. |
| 0:32-0:50 | A2, emphasizing Saved through Ready for review. | "Once I choose Stop and save, the recording stays in this browser. When I start processing, audio goes for transcription and the resulting transcript goes to GPT-5.6 for organization." | Do not imply that processing runs after the browser is fully closed. |
| 0:50-1:17 | A3 with a persistent upper-left overlay: `Preprocessed safe capture`. | "For this interface tour, I am switching to a preprocessed safe capture. Nugget separates one ramble into editable ideas, with categories, tags, blockers, research needs, and source-aware confidence." | The overlay stays visible for the entire shot. Do not call this the live result. |
| 1:17-1:37 | A4. If animated recording is available, type `community`, select Personal, and open tool sharing; otherwise use a gentle zoom. | "After confirmation, ideas become a local library. I can search and filter by category and tags. This view is Nugget's clearly labeled local sample library, not a new GPT call." | Retain the visible `Sample` chip. Add a small `Local sample library` overlay. |
| 1:37-2:02 | A5. Pan slowly down from title and tags to blocker, research, and suggested action. | "The detail preserves the useful structure: the purpose, a concrete goal, the blocker, research needed, and a suggested next action. Explicit, inferred, and suggested labels make it clear what came directly from the source." | Keep the provenance badges and `Sample` text in frame. |
| 2:02-2:15 | A6. Briefly highlight the tool-sharing action and its source title. | "Actions collects the accepted next steps without losing the idea they came from, so an insight can become something practical." | Keep source title visible. |
| 2:15-2:35 | A7. Hold long enough to read the privacy text and About values. | "Nugget keeps recordings and saved ideas in the browser. Settings makes the cloud-processing boundary explicit and shows the non-secret model health: Whisper for transcription and GPT-5.6 Terra for organization." | Only narrate values actually visible in the final captured screen. |
| 2:35-2:49 | README, Git history, or an app close on A1/A4. | "Codex supported planning, implementation, focused tests, browser checks, debugging, and verification. I made the product and release decisions." | Use a real repo view if available; avoid terminal output and Session-ID claims. |
| 2:49-2:52 | A1 or app wordmark. | "Nugget makes moving thoughts useful." | End cleanly; no extended fade. |

## Exact disclosure overlays

Use these verbatim, in clear high-contrast text:

- `Preprocessed safe capture` -- persistent during 0:50-1:17.
- `Local sample library -- no GPT-5.6 call in this view` -- during 1:17-2:02.

## Fast assembly checklist

1. Create a 16:9 project and add the assets in timeline order.
2. Put portrait captures in the center; use a static soft warm background, not
   a moving or branded third-party template.
3. Record the narration in one pass, then trim silence rather than increasing
   playback speed.
4. Add the two required disclosure overlays and no music.
5. Add captions from the narration, then correct the words `GPT-5.6`,
   `GPT-5.6 Terra`, `Whisper`, and `Nugget`.
6. Export at 1080p and verify the encoded duration is below 3:00.
7. Watch the complete file with sound before any upload; check every disclosure,
   the public URL, the Sample chips, readability, and absence of private data.

## Publication outcome

- Steven approved the hybrid narrated master and public YouTube publication.
- YouTube processing, copyright, and Community Guidelines checks completed with
  no issues.
- The source SRT was published as a manual 14-cue English subtitle track and
  rendered timed text was verified in the public player.
- The verified public URL is recorded in the Devpost draft, README, and
  submission evidence documents.
- The verified Codex `/feedback` Session ID is already recorded in the README,
  Devpost draft, and evidence ledger; it does not need to appear on screen.
