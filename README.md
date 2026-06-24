# Nugget Miner

Nugget is a privacy-first, local-first voice idea capture PWA. The current branch contains the first vertical slice: browse to the app, record audio in the browser, save it locally, and view a deterministic mock transcript.

## Quick start

```bash
npm install
npm run dev -- -H 0.0.0.0 -p 3110
```

Open: <http://127.0.0.1:3110/>

> Port `3100` was the goal default, but this machine already had another service bound there during verification, so `3110` is the verified local port.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Current slice

- Next.js App Router + TypeScript strict + Tailwind.
- Dexie/IndexedDB persistence for `Idea`, `Recording`, and `Transcript`.
- MediaRecorder-based local recording UI with timer and level meter.
- `Save & Mock Transcribe` creates a local recording and deterministic transcript.
- Idea detail page shows playback metadata and editable transcript text.
- No cloud routes, no auth, no analytics, no provider keys.

## Docs

- Product PRD: [`Nugget_PRD.md`](./Nugget_PRD.md)
- Product docs: [`docs/product/`](./docs/product/)
- Task docs: [`docs/tasks/`](./docs/tasks/README.md)
- Current goal: [`docs/goals/2026-06-24-browse-record-transcript-goal.md`](./docs/goals/2026-06-24-browse-record-transcript-goal.md)
