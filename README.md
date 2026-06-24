# Nugget Miner

Nugget is a privacy-first, local-first voice idea capture PWA. The current app can browse, record audio in the browser, save it locally, generate deterministic mock transcripts, and — when server env is configured — send audio through a consent-gated real transcription route.

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
- Dexie/IndexedDB persistence for `Idea`, `Recording`, and `Transcript`.
- MediaRecorder-based local recording UI with timer and level meter.
- `Save & Mock Transcribe` creates a local deterministic transcript.
- `Save & Real Transcribe` appears when `/api/transcribe` reports server provider config is available.
- Real transcription requires explicit consent before audio leaves the browser.
- Server route `/api/transcribe` reads provider credentials only from server/Vercel env vars.
- Idea detail page shows playback metadata, editable transcript text, provider, and model metadata.
- No auth, analytics, sync, payments, or client-side provider keys.

## Real transcription env

See [`docs/deployment/vercel-env.md`](./docs/deployment/vercel-env.md).

Minimum preferred production key:

```bash
vercel env add NUGGET_TRANSCRIPTION_API_KEY production
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
