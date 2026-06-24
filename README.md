# Nugget Miner

Nugget is a privacy-first, local-first voice idea capture PWA. The current app can record audio in the browser, save it locally, generate mock or real transcripts, and turn transcripts into reviewable suggested nuggets/actions/questions using either deterministic local mock extraction or a consent-gated server-side LLM route.

## Quick start

```bash
npm install
npm run dev -- -H 0.0.0.0 -p 3110
```

Open: <http://127.0.0.1:3110/>

> Port `3100` was the first goal default, but this machine already had another service bound there during verification, so `3110` is the verified local port.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm audit --audit-level=moderate --omit=dev
```

## Current slice

- Next.js App Router + TypeScript strict + Tailwind.
- Dexie/IndexedDB persistence for `Idea`, `Recording`, `Transcript`, `ExtractionRun`, `Nugget`, `Question`, and `ActionItem`.
- MediaRecorder-based local recording UI with timer and level meter.
- `Save & Mock Transcribe` creates a local deterministic transcript.
- `Save & Real Transcribe` uses `/api/transcribe` when server provider env is configured.
- Idea detail page shows playback metadata, editable transcript text, provider, and model metadata.
- `Extract Nuggets` runs deterministic local mock extraction.
- `Extract with LLM` asks consent, calls `/api/extract`, validates structured JSON, and lands in the review UI.
- Review UI supports summary, suggested nuggets/actions/questions, source snippets, and accept/reject controls.
- No auth, analytics, sync, payments, or client-side provider keys.

## Provider env

See [`docs/deployment/vercel-env.md`](./docs/deployment/vercel-env.md).

Minimum preferred production keys:

```bash
vercel env add NUGGET_TRANSCRIPTION_API_KEY production
vercel env add NUGGET_LLM_API_KEY production
```

Fallback key name also supported:

```bash
vercel env add OPENAI_API_KEY production
```

Never commit `.env.local` or paste provider key values into logs/chat.

## Docs

- Product PRD: [`Nugget_PRD.md`](./Nugget_PRD.md)
- Product docs: [`docs/product/`](./docs/product/)
- Task docs: [`docs/tasks/`](./docs/tasks/README.md)
- Browse/record goal: [`docs/goals/2026-06-24-browse-record-transcript-goal.md`](./docs/goals/2026-06-24-browse-record-transcript-goal.md)
- Real transcription goal: [`docs/goals/2026-06-24-real-transcription-test-goal.md`](./docs/goals/2026-06-24-real-transcription-test-goal.md)
- Mock extraction review goal: [`docs/goals/2026-06-24-mock-extraction-review-goal.md`](./docs/goals/2026-06-24-mock-extraction-review-goal.md)
- Real LLM extraction goal: [`docs/goals/2026-06-24-real-llm-extraction-goal.md`](./docs/goals/2026-06-24-real-llm-extraction-goal.md)
