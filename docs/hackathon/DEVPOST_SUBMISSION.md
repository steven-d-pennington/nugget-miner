# Nugget Devpost submission draft

## Submission fields

- **Project name:** Nugget
- **Track:** Apps for Your Life
- **Repository:** [steven-d-pennington/nugget-miner](https://github.com/steven-d-pennington/nugget-miner) is public. The current MVP is directly available on the [public `codex/mvp-overnight-2026-07-15` branch](https://github.com/steven-d-pennington/nugget-miner/tree/codex/mvp-overnight-2026-07-15); the public default `main` branch remains older and is not the current MVP.
- **Short description:** Nugget is a mobile-first voice capture app that turns unstructured rambles into distinct, organized ideas. Record while you are moving, leave as soon as the audio is saved locally, then return to review GPT-5.6-generated idea records with editable titles, summaries, goals, blockers, research needs, categories, tags, and next actions.

### Required fields that remain open

- **Public working URL:** Not available yet. The verified preview is [nugget-miner-9idan4vrm-steven-penningtons-projects.vercel.app](https://nugget-miner-9idan4vrm-steven-penningtons-projects.vercel.app), deployment `dpl_48tEvWYrqU3MGKsSctxX94coF72A`, but Vercel Authentication protects it. It is not a public or account-free judging path. Production is an older `main` deployment and is not the current MVP.
- **Public video URL:** Not recorded yet. The recording-ready [demo script](DEMO_SCRIPT.md) and [demo recording checklist](DEMO_RECORDING_CHECKLIST.md) prepare this work, but no YouTube URL may be added until the owner authorizes publication and logged-out public playback is verified.
- **Primary Codex implementation Session ID:** Not captured yet.
- **Live evaluation report:** Not recorded yet. A live run was authorized within an approximately four-dollar ceiling, but a safe nonempty key injection was unavailable. This work made zero provider calls and incurred zero provider spend.

Do not submit the protected preview as the public Devpost testing URL. See the [judge test path](JUDGING_TEST_PATH.md), [screenshot plan](SCREENSHOT_PLAN.md), [demo script](DEMO_SCRIPT.md), and [demo recording checklist](DEMO_RECORDING_CHECKLIST.md) for the current, truthful demonstration material and pending public-video gate.

## Inspiration

Useful thoughts often arrive while walking, commuting, or moving between tasks. A long voice note can preserve the words but still hide the separate projects, decisions, blockers, and next steps inside it. Nugget is designed to make the first step effortless—capture the ramble—and make the return visit useful by separating it into records a person can inspect and correct.

## What it does

Nugget records audio or accepts pasted text, saves the capture in the browser, and only sends content for cloud processing after the person enables or initiates it. Audio is transcribed when needed; transcript text is then separated and organized into zero or more draft ideas. Each draft can expose an editable title, summary, category, tags, goals, blockers, research assessment, suggested searches, and suggested actions, with provenance and source excerpts where available. A person reviews and confirms the proposed records before they enter the searchable Ideas library and linked Actions list.

The MVP stores captures, recordings, transcripts, ideas, categories, tags, and actions in browser IndexedDB. It has no accounts, cloud sync, or server-side user-content database. It can save capture data before cloud processing begins, but it does not promise that a fully closed mobile browser will continue processing.

## How we built it

Nugget is a mobile-first web app and installable PWA with browser-local durable state. Its source defaults are `gpt-4o-mini-transcribe` for transcription and `gpt-5.6-terra` for organization. The verified protected preview currently reports the deployed overrides `whisper-1` for transcription and `gpt-5.6-terra` for organization.

The organization flow is deliberately split into stages: identify source-grounded candidate ideas from the transcript, then organize each candidate against the allowed category descriptions. Structured responses, source spans, and category IDs are validated before draft records are written for review. The submission screenshots use deterministic safe fixtures or the clearly labeled local sample library; they do not represent a live provider result.

The current screenshot run used the clean application source at `05410ae`. Task 3 began from documentation-only HEAD `8eb8a1f480bc600bac15892d3b13d5eff9058b13`; it changes no product implementation.

## Meaningful GPT-5.6 usage

GPT-5.6 is the core organization step, not an ornamental chat feature. It separates one transcript into distinct candidate ideas, enriches each one with editable structure, recommends categories and tags, flags research needs, and proposes next actions. The app keeps the resulting records reviewable with source and provenance information, so a person—not the model—decides what becomes a confirmed idea.

A deterministic evaluation harness covers structured-output, grounding, category, research, and duplicate-action behavior. It is not a substitute for the outstanding live evaluation report.

## How Codex was used

Codex supported the Build Week work through planning, implementation, focused tests and browser checks, debugging, documentation, and verification. The [Codex collaboration record](CODEX_COLLABORATION.md) links dated sprint history, roles, human decisions, and verification examples. The primary implementation Session ID must still be obtained through `/feedback`; this submission does not invent or substitute one.

## Human product and design decisions

The human owner chose an on-the-go, mobile-first capture flow; local save before cloud processing; mandatory review of model proposals; one category plus multiple tags; the warm ivory, navy, and amber visual system; and the release boundaries. The human also deferred self-learning, conversational onboarding, live research execution, accounts, and sync for this MVP, and retains authority over a public production release.

## Challenges

The difficult parts were preserving idea boundaries in a ramble, grounding structured fields in source text, making local capture durable before network work, and being precise about mobile-browser background limits. The project also had to separate verified deterministic behavior from cost-incurring live evaluation evidence and keep the submission honest while the only current preview remains Vercel-auth protected.

## Accomplishments

- Built a two-stage transcription and GPT-5.6 organization pipeline with structured validation.
- Made one capture capable of producing multiple independently editable review records.
- Added durable browser-local capture and recovery behavior, including offline-safe capture storage before cloud processing.
- Added a searchable library, categories, tags, linked actions, individual export, and a clearly labeled local sample path.
- Prepared deterministic fixtures, evaluation coverage, focused browser verification, and five safe current-UI submission screenshots.

## What we learned

A useful AI organization experience needs clear boundaries and correction points more than an opaque automatic filing step. Source context, provenance, and mandatory confirmation make suggested structure easier to trust. We also learned that a reliable capture promise has to be narrowly stated: browser-local saving is demonstrable; processing after a mobile browser is fully closed is not.

## What's next

Potential future work includes self-learning from corrections, conversational onboarding, live research execution, and optional sync. None of those are shipped in this MVP. Before submission, the remaining delivery gates are a public account-free production URL, a public video URL, the primary Codex Session ID, and a recorded live evaluation report.

## Claim boundary checklist

Use only claims supported by the current build and evidence:

- Do not call the Vercel-auth-protected preview public or account-free.
- Do not claim self-learning, live research execution, citations, sync, accounts, or cloud user-data persistence.
- Do not claim all processing is local or fully on device; cloud processing is opt-in/initiated and transient.
- Do not present the deterministic screenshots as a live GPT provider result.
- Do not supply a final public URL, video URL, Session ID, or live evaluation score until each exists and has been verified.
