# Nugget demo recording checklist

## Current boundary and owner approval

- [x] **Public production is authorized and reachable.** The current MVP is on
  public default `main`; `https://nugget-miner-kappa.vercel.app` is the
  owner-authorized production URL. This checklist still grants no authority to
  change deployment settings or submit Devpost.
- [x] The owner explicitly approved uploading and publishing the final video on
  YouTube; publication completed on July 18, 2026.
- [x] No Devpost submission, deployment-setting change, or provider call was
  made while completing the YouTube gate.

## Public-production preflight

- [ ] Open the owner-approved production HTTPS origin in a clean logged-out or
  private browser. It must need no Vercel Authentication, account, payment,
  invite, or local setup.
- [ ] Record the verified public production URL and deployment identifier in
  the evidence table below. Do not substitute the protected preview URL.
- [ ] Show the public URL in browser chrome at the recording start, then keep
  application controls large enough to read.
- [ ] In **Settings** at `/settings`, open **About** and check non-secret
  `Transcription` and `Organization`. The protected preview reports `whisper-1`
  and `gpt-5.6-terra`; re-check the authorized production build instead of
  assuming it matches.
- [ ] Do not expose environment values, API keys, developer tools, headers,
  query tokens, or terminal output. Health/model metadata is sufficient.

## Browser, sample, and privacy setup

- [ ] Use a dedicated clean browser profile. Remove prior captures and IndexedDB
  data unless a disclosed prepared capture is required.
- [ ] Close mail, chat, password-manager, work, personal, and unrelated tabs.
  Disable notifications and hide bookmarks, history, account avatars, and
  downloads that could reveal private data.
- [ ] Use the approved mobile viewport for the UI recording; the screenshot plan
  uses `390 x 844` CSS pixels. Keep browser chrome in the opening URL shot.
- [ ] Check microphone permission: the real path must reach `Listening…`,
  show live level, and allow `Stop & save`.
- [ ] Remove samples from the primary live path. If the local fallback is needed,
  load it through **Settings** > **Sample library** > **Load sample library**;
  preserve every `Sample` label.
- [ ] Use only safe, non-private content. Treat transcript text as untrusted;
  do not include instructions, secrets, names, customer information, or keys.

## Practice the ramble

- [ ] Rehearse the exact 74-word ramble in
  [DEMO_SCRIPT.md](DEMO_SCRIPT.md#prepared-two-idea-ramble) naturally at about
  30-33 seconds.
- [ ] Confirm it includes one Personal idea, one Work idea, an explicit blocker,
  and an explicit research need.
- [ ] Record it in full. The 20-second plan window requires the script's
  disclosed jump cut; do not accelerate audio or pretend 30 seconds took 20.
- [ ] Before the final take, prove the live path can reach review within budget,
  or prepare the fully disclosed fallback.

## Record the script sequence

- [ ] 0:00-0:18: `/`, public URL, `Quick capture`, `What's on your mind?`, and
  `Record`.
- [ ] 0:18-0:38: prepared ramble, `Listening…`, level, final timer, and
  `Stop & save`.
- [ ] 0:38-0:57: `/capture/<captureId>`, `Recording saved`, `Process now` or
  active processing, disclosure, and Saved -> Transcribing -> Organizing ->
  Ready for review.
- [ ] 0:57-1:38: `/review/<captureId>`, truthful idea count, Personal/Work
  drafts, editable fields, provenance, source, and confirmation.
- [ ] 1:38-2:06: `/ideas`, `community`, `Personal`, then the tool-sharing idea
  at `/ideas/<ideaId>`; keep `Sample` visible for the local fallback.
- [ ] 2:06-2:24: `/ideas/<ideaId>` and `/actions`; show goal, blocker,
  `Research needed`, action, linked source, and completion.
- [x] 2:24-2:44: `/settings` **About**, truthful model health, then README,
  source, schema, focused-test, and retained live-evaluation evidence. The
  approved edit identifies the fixed evaluation suite without presenting it as
  proof of every possible transcript.
- [ ] 2:44-2:56: actual commit history and Codex/human-role explanation; do not
  invent a primary implementation Session ID.
- [ ] 2:56-2:59: clean Nugget close. Aim for 2:45-2:55; 2:59 is maximum only.

## Audio, visual, and content rules

- [ ] Capture audible voice or voiceover at normal listening volume; check on
  speakers and headphones before upload.
- [ ] Use no unauthorized music, stock audio, third-party trademarks, or
  external logos.
- [ ] Keep text, actions, processing state, and URL readable. Do not crop an
  important `Sample` label or error state.
- [ ] Explain GPT-5.6 specifically: it separates source-grounded candidates,
  then organizes reviewable fields, categories, tags, research suggestions, and
  next actions after cloud processing is enabled or initiated.
- [ ] Explain Codex specifically: it supported plans, implementation, focused
  tests, browser checks, debugging, and verification; the human owner made
  product and release decisions.
- [ ] Do not claim accounts, cloud sync, self-learning, live research
  execution/citations, fully on-device processing, or processing guaranteed
  after a mobile browser is fully closed.

## Latency and failure handling

- [ ] If the real run is still processing, show saved/processing and state:
  "This capture is still processing. For the remaining interface tour, I am
  switching to a preprocessed safe capture."
- [ ] Add a clearly visible, editor-added on-screen video caption or overlay
  reading `Preprocessed safe capture` on every fallback result screen. It is
  not an app-generated label. Never call it the just-recorded live result.
- [ ] If using the shipped sample library, say it is labeled local demo data,
  does not call GPT-5.6, and is not live-provider evidence; keep `Sample`.
- [ ] If provider, schema, or validation fails, show preserved state and `Retry`
  or other recovery; do not edit around it to imply success.
- [ ] If health is unavailable or the approved public path is inaccessible, stop
  and resolve the owner-authorized gate before retrying.

## Export, YouTube, and playback

- [x] Export at 2:45-2:55 and measure encoded runtime. Reject anything at or
  over 3:00.
- [x] Review the complete export for audible narration, visible URL, correct
  labels, truthful cuts, no notifications, no secrets, and no private content.
- [x] After owner approval, upload **Public** on YouTube with truthful title and
  description; add accurate captions or review generated captions.
- [x] Verify anonymous public reachability and review the public watch page.
  The owner accepted the published video; automated player inspection confirmed
  the title, description, duration, audio playback, and rendered timed captions.
- [x] Only after that verification, add the same public YouTube URL to
  [DEVPOST_SUBMISSION.md](DEVPOST_SUBMISSION.md), the README demo section at
  [README.md](../../README.md), and [BUILD_WEEK_EVIDENCE.md](BUILD_WEEK_EVIDENCE.md).

## Post-recording evidence record

Fill this only with observed values after authorized actions. Status labels are
intentional; they are not fake URLs, identifiers, scores, or placeholders.

| Evidence item | Current status | Verified value or next authorized action |
| --- | --- | --- |
| Public production URL | **Verified** | `https://nugget-miner-kappa.vercel.app` returned anonymously accessible root and health responses. |
| Production deployment identifier | **Verified July 18** | `dpl_Hgznv72apf9t5TkCRwzakd6p3Tou`, READY from `main` at `e50cd42`. |
| Model-health display | **Production health verified** | Health reports `whisper-1` transcription and `gpt-5.6-terra` organization; still capture the visible Settings > About display during recording without secrets. |
| Live capture shown | **Verified in approved master** | The hybrid candidate includes genuine iPhone capture and live waveform footage plus the deterministic walkthrough. |
| Fallback disclosure | **Verified in approved master** | Prepared review/sample sections are labeled and are not described as the just-recorded live provider result. |
| Live evaluation report | **Verified** | `docs/evals/latest.json`: 12/12 idea-count and category gates, zero invalid categories and unsupported explicit claims, all special requirements passed. |
| Primary Codex implementation Session ID | **Verified** | `019f66eb-7a90-7080-8667-b6ac77c45a23`, owner-confirmed from `/feedback`. |
| YouTube public URL | **Verified** | [https://youtu.be/ct8tY_JwTPw](https://youtu.be/ct8tY_JwTPw); Public visibility, anonymous oEmbed access, and the public watch page were verified. |
| YouTube duration | **Verified publicly** | YouTube displays 2:52 for the 171.5-second approved master, below the 3:00 limit. |
| Captions, title, description | **Verified publicly** | The approved title and description are live; YouTube Studio published the manual 14-cue English track, anonymous watch-page data exposed the English track, and timed caption text rendered in the public player. |
| Devpost/README/evidence links | **Recorded** | The same verified public URL is recorded in all three locations on the finalization branch. |

## Final owner sign-off

- [x] Owner authorized public production and anonymous accessibility; public root and health were verified.
- [x] Owner approved `nugget-demo-hybrid-narrated.mp4` and its fallback disclosures on July 18, 2026.
- [x] Owner approves public YouTube publication and Devpost use.
- [x] Owner confirms the verified public YouTube URL may be copied into the
  submission draft, README demo section, and Build Week evidence ledger.
