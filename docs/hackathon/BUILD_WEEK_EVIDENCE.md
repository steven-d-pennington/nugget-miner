# Build Week Evidence Ledger

| Sprint | Date | Commit(s) | Codex task/session | Working proof | Screenshot/video asset | Notes |
|---|---|---|---|---|---|---|
| 0 | 2026-07-15 | `187e738`, `c3b7273`, `dbdf33c`, `afc37b3`, and `a56d0b5` | Continuous overnight Codex goal: implement and verify the Nugget MVP sprint-by-sprint through Terra | `npm run check` — typecheck and lint passed; 23 test files / 49 tests passed; Next.js production build passed | Not required for the CI baseline | CI runs `npm ci` and `npm run check` for pull requests and pushes to `main` or `codex/mvp-overnight-2026-07-15` |
| 1 | 2026-07-15 | `4b78565`, `f562432`, `198e1c2`, and `3bf30c3` | Continuous overnight Codex goal implemented through the project-scoped Terra worker; no session ID invented | Migration: the real v2 fixture preserves the recording Blob, transcript, raw extraction JSON, accepted action, and seeds five categories. Local save: CaptureService tests prove atomic audio/text persistence, rollback on storage failure, and no provider work before commit. Queue: ProcessingService tests prove persisted resume and duplicate in-tab prevention. Task 7 gate: 4 affected files / 12 tests passed after accessibility and duplicate-save hardening. Full `npm run check`: typecheck and lint passed; 30 files / 95 tests passed; Next.js production build passed. Primary-agent browser QA at a 430px viewport confirmed the recorder precedes typed capture, the expanded form retains entered text and character count, the primary control is 50px tall, and the cloud-processing disclosure is visible. | [Expanded typed-capture form](evidence/sprint-1-text-capture.png) (SHA-256 `395A3C702EA27D9D4EF729F053F48FF9317941DF545D54F3FA0F82CD6232D9CA`) | Accepted foundation `f562432` passed hosted CI: https://github.com/steven-d-pennington/nugget-miner/actions/runs/29461544424. Independent review approved Task 7 after `3bf30c3`; no code findings remained. |
| 2 |  |  |  |  |  |  |
| 3 |  |  |  |  |  |  |
| 4 |  |  |  |  |  |  |
| 5 |  |  |  |  |  |  |
| 6 |  |  |  |  |  |  |

Blank evidence cells are intentional collection fields. Fill each sprint row at its exit gate.

## Primary Codex Session

- Session ID from `/feedback`: Not captured yet; record it before submission.
- Why this was the primary implementation task: This continuous overnight Codex goal coordinates sprint-by-sprint MVP implementation and verification through the planned exit gates.
