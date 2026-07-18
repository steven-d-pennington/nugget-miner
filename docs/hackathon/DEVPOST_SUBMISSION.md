# Nugget Devpost submission draft

## Submission fields

- **Project name:** Nugget
- **Track:** Apps for Your Life
- **Repository:** [steven-d-pennington/nugget-miner](https://github.com/steven-d-pennington/nugget-miner) is public. The current MVP is on public `main` after merge commit `e50cd428`.
- **Short description:** Nugget is a mobile-first voice capture app that turns unstructured rambles into distinct, organized ideas. Record while you are moving, leave as soon as the audio is saved locally, then return to review GPT-5.6-generated idea records with editable titles, summaries, goals, blockers, research needs, categories, tags, and next actions.

### Required fields that remain open

- **Public working URL:** [https://nugget-miner-kappa.vercel.app](https://nugget-miner-kappa.vercel.app). Production deployment `dpl_Hgznv72apf9t5TkCRwzakd6p3Tou` is READY from `main` at `e50cd42` and passed anonymous root, `/api/health`, security-header, manifest, service-worker, and current-production screenshot checks. Health reports `whisper-1` transcription and `gpt-5.6-terra` organization.
- **Public video URL:** Pending authorized YouTube upload. The owner-approved local master is [`demo-video-final/nugget-demo-hybrid-narrated.mp4`](demo-video-final/nugget-demo-hybrid-narrated.mp4): 171.5 seconds, 1920 × 1080, H.264 video, AAC audio, and 14 embedded captions. Do not add a URL until public logged-out playback is verified.
- **Primary Codex implementation Session ID:** `019f66eb-7a90-7080-8667-b6ac77c45a23` (verified by the owner as the `/feedback` Session ID for the primary implementation task).
- **Live evaluation report:** [`docs/evals/latest.json`](../evals/latest.json), generated `2026-07-17T18:23:10.007Z` with `gpt-5.6-terra`, medium reasoning, `segment-v2`, and `organize-v2`. All 12 fixtures passed idea-count, category, and special-requirement gates; invalid category IDs and unsupported explicit claims were both zero; both provider response IDs are retained for every fixture.

Use the public production URL above as the Devpost testing URL. See the [judge test path](JUDGING_TEST_PATH.md), [screenshot plan](SCREENSHOT_PLAN.md), [demo script](DEMO_SCRIPT.md), and [demo recording checklist](DEMO_RECORDING_CHECKLIST.md) for the current, truthful demonstration material and pending public-video gate.

## Inspiration

Useful thoughts often arrive while walking, commuting, or moving between tasks. A long voice note can preserve the words but still hide the separate projects, decisions, blockers, and next steps inside it. Nugget is designed to make the first step effortless—capture the ramble—and make the return visit useful by separating it into records a person can inspect and correct.

## What it does

Nugget records audio or accepts pasted text, saves the capture in the browser, and only sends content for cloud processing after the person enables or initiates it. Audio is transcribed when needed; transcript text is then separated and organized into zero or more draft ideas. Each draft can expose an editable title, summary, category, tags, goals, blockers, research assessment, suggested searches, and suggested actions, with provenance and source excerpts where available. A person reviews and confirms the proposed records before they enter the searchable Ideas library and linked Actions list.

The MVP stores captures, recordings, transcripts, ideas, categories, tags, and actions in browser IndexedDB. It has no accounts, cloud sync, or server-side user-content database. It can save capture data before cloud processing begins, but it does not promise that a fully closed mobile browser will continue processing.

## How we built it

Nugget is a mobile-first web app and installable PWA with browser-local durable state. Its source defaults are `gpt-4o-mini-transcribe` for transcription and `gpt-5.6-terra` for organization. Verified public production reports the deployed overrides `whisper-1` for transcription and `gpt-5.6-terra` for organization.

The organization flow is deliberately split into stages: identify source-grounded candidate ideas from the transcript, then organize each candidate against the allowed category descriptions. Structured responses, source spans, and category IDs are validated before draft records are written for review. The submission screenshots use deterministic safe fixtures or the clearly labeled local sample library; they do not represent a live provider result.

The final screenshot run exercised the public account-free production origin backed by `main` at `e50cd42`. It used a clean 430 × 932 browser profile, fake microphone input for the saved-recording state, and the shipped clearly labeled sample data for library/detail/review evidence. It made no provider call and changed no product implementation.

## Meaningful GPT-5.6 usage

GPT-5.6 is the core organization step, not an ornamental chat feature. It separates one transcript into distinct candidate ideas, enriches each one with editable structure, recommends categories and tags, flags research needs, and proposes next actions. The app keeps the resulting records reviewable with source and provenance information, so a person—not the model—decides what becomes a confirmed idea.

A deterministic evaluation harness covers structured-output, grounding, category, research, and duplicate-action behavior. The retained live run applies the same gates to 12 canonical fixtures and records the real GPT-5.6 response IDs. That fixed evaluation suite is evidence of the tested cases, not a claim that every possible ramble will be classified perfectly.

## How Codex was used

Codex supported the Build Week work through planning, implementation, focused tests and browser checks, debugging, documentation, and verification. The [Codex collaboration record](CODEX_COLLABORATION.md) links dated sprint history, roles, human decisions, and verification examples. The verified primary implementation `/feedback` Session ID is `019f66eb-7a90-7080-8667-b6ac77c45a23`.

## Human product and design decisions

The human owner chose an on-the-go, mobile-first capture flow; local save before cloud processing; mandatory review of model proposals; one category plus multiple tags; the warm ivory, navy, and amber visual system; and the release boundaries. The human also deferred self-learning, conversational onboarding, live research execution, accounts, and sync for this MVP, and retains authority over a public production release.

## Challenges

The difficult parts were preserving idea boundaries in a ramble, grounding structured fields in source text, making local capture durable before network work, and being precise about mobile-browser background limits. The project also had to separate verified deterministic behavior from cost-incurring live evaluation evidence and catch a production-only model-variable mismatch before presenting the public judge path.

## Accomplishments

- Built a two-stage transcription and GPT-5.6 organization pipeline with structured validation.
- Made one capture capable of producing multiple independently editable review records.
- Added durable browser-local capture and recovery behavior, including offline-safe capture storage before cloud processing.
- Added a searchable library, categories, tags, linked actions, individual export, and a clearly labeled local sample path.
- Prepared deterministic fixtures, evaluation coverage, focused browser verification, and five safe current-UI submission screenshots.

## What we learned

A useful AI organization experience needs clear boundaries and correction points more than an opaque automatic filing step. Source context, provenance, and mandatory confirmation make suggested structure easier to trust. We also learned that a reliable capture promise has to be narrowly stated: browser-local saving is demonstrable; processing after a mobile browser is fully closed is not.

## What's next

Potential future work includes self-learning from corrections, conversational onboarding, live research execution, and optional sync. None of those are shipped in this MVP.

## YouTube upload copy

- **Title:** Nugget — Turn voice rambles into organized ideas with GPT-5.6
- **Description:** Nugget is a mobile-first PWA for capturing ideas on the go. It saves recordings in the browser first, then uses OpenAI transcription and a two-stage GPT-5.6 pipeline to separate one ramble into grounded, editable ideas with categories, tags, goals, blockers, research needs, and next actions. Built for OpenAI Build Week in the Apps for Your Life track with Codex. Try it: https://nugget-miner-kappa.vercel.app — Source: https://github.com/steven-d-pennington/nugget-miner
- **Visibility:** Public
- **Audience:** Not made for kids
- **Captions:** Upload or verify the embedded English captions before publication.

## Claim boundary checklist

Use only claims supported by the current build and evidence:

- Use only `https://nugget-miner-kappa.vercel.app` as the verified public judge URL; older preview URLs remain Vercel-auth protected.
- Do not claim self-learning, live research execution, citations, sync, accounts, or cloud user-data persistence.
- Do not claim all processing is local or fully on device; cloud processing is opt-in/initiated and transient.
- Do not present the deterministic screenshots as a live GPT provider result.
- Do not supply a final public URL, video URL, or live evaluation score until each exists and has been verified. Use the verified Session ID above exactly as recorded.
