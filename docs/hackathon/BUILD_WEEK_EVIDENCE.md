# Build Week Evidence Ledger

| Sprint | Date | Commit(s) | Codex task/session | Working proof | Screenshot/video asset | Notes |
|---|---|---|---|---|---|---|
| 0 | 2026-07-15 | `187e738`, `c3b7273`, `dbdf33c`, `afc37b3`, and `a56d0b5` | Continuous overnight Codex goal: implement and verify the Nugget MVP sprint-by-sprint through Terra | `npm run check` — typecheck and lint passed; 23 test files / 49 tests passed; Next.js production build passed | Not required for the CI baseline | CI runs `npm ci` and `npm run check` for pull requests and pushes to `main` or `codex/mvp-overnight-2026-07-15` |
| 1 | 2026-07-15 | `4b78565`, `f562432`, `198e1c2`, and `3bf30c3` | Continuous overnight Codex goal implemented through the project-scoped Terra worker; no session ID invented | Migration: the real v2 fixture preserves the recording Blob, transcript, raw extraction JSON, accepted action, and seeds five categories. Local save: CaptureService tests prove atomic audio/text persistence, rollback on storage failure, and no provider work before commit. Queue: ProcessingService tests prove persisted resume and duplicate in-tab prevention. Task 7 gate: 4 affected files / 12 tests passed after accessibility and duplicate-save hardening. Full `npm run check`: typecheck and lint passed; 30 files / 95 tests passed; Next.js production build passed. Primary-agent browser QA at a 430px viewport confirmed the recorder precedes typed capture, the expanded form retains entered text and character count, the primary control is 50px tall, and the cloud-processing disclosure is visible. | [Expanded typed-capture form](evidence/sprint-1-text-capture.png) (SHA-256 `395A3C702EA27D9D4EF729F053F48FF9317941DF545D54F3FA0F82CD6232D9CA`) | Accepted foundation `f562432` passed hosted CI: https://github.com/steven-d-pennington/nugget-miner/actions/runs/29461544424. Independent review approved Task 7 after `3bf30c3`; no code findings remained. |
| 2 | 2026-07-16–17 | `f35c73c`, `a12e98e`, `f4650bd`, `a40c083`, `5be9d5c`, `40856ef`, `556b621`, `f3ba1d8`, `dca5a5d`, `be48e46`, and `8d5d380` | Continuous overnight Codex goal implemented through the project-scoped Terra worker; no session ID invented | Deterministic eval: `npx vitest run src/lib/evals/scoring.test.ts` passed 1 file / 10 tests. July 17 canonical live eval generated `docs/evals/latest.json` at `2026-07-17T18:23:10.007Z`: `gpt-5.6-terra`, medium reasoning, `segment-v2` / `organize-v2`, 12/12 correct idea counts and categories, zero invalid category IDs and unsupported explicit claims, all 12 special requirements passed, and both response IDs retained for every fixture. | The canonical v2 JSON report is committed; it is evaluation evidence, not a user-facing live-result screenshot. | The initial v1 report remains in Git history at `be48e46`; the v2 prompt fix is `8d5d380`. The Sprint 2 quality/evaluation gate is complete. This does not close Sprint 3 physical-device, Sprint 4 manual, Sprint 5 PWA/browser, or Sprint 6 submission gates. |
| 3 | 2026-07-16 | `e85d06a`, `ba2b320`, `91a3abe`, `ae1322e`, `274dc12`, `1054b6e`, `53bb4b7`, `54cb042`, `aa9045a`, `af2c744`, `494d90e`, `3b64ad9`, and `4c064e7` | Continuous overnight Codex goal implemented through the project-scoped Terra worker and verified by Sol; no session ID invented | Sol reported full `npm run check` passing typecheck, lint, 42 test files / 292 tests, and the Next.js production build. Final Task 5 focused verification passed 3 files / 22 tests; the modal recovery fix also passed typecheck, lint, and `git diff --check`. Independent review approved Task 5 after `3b64ad9`. At 430 x 932 on `http://127.0.0.1:3011`, Capture prioritized Record, a synthetic 369-character typed ramble saved locally, Transcript Version 1 survived a full reload, Process now opened the explicit cloud-consent dialog, Cancel sent nothing, `/ideas` showed its honest empty state, and no console errors were observed. Final evidence was captured without development controls from the production build server at `http://127.0.0.1:3012`. A temporary local-only seed harness then proved a true active `organizing` state plus three-draft edit persistence, exact source excerpts, discard-one/confirm-two, completed review, and two independent confirmed Ideas records; the harness was removed before the final build and is not committed. After the user supplied a new preview API key, Sol corrected the model default to `gpt-5.6-terra` in `4c064e7`; Vercel deployment `dpl_5Py2H5H6wuQJEaC9p5MMrHA8j4nt` became READY, and the user confirmed live transcription and organization were working well. See `docs/qa/sprint-3-mobile-checklist.md`. | [Capture idle](evidence/sprint-3/capture-idle.png) (34,904 bytes; SHA-256 `136897526830656452505A90B81BE567B68405F1A5FC1C8D45B5A55D201CFDFD`); [active synthetic organizing](evidence/sprint-3/processing.png) (33,098 bytes; SHA-256 `2F791561AD25BEA3CD90EE5242ED976CF1D16788D6B329ECAA0B38237605AE1B`); [three editable synthetic ideas](evidence/sprint-3/three-idea-confirmation.png) (37,233 bytes; SHA-256 `7877475EB1CD467C411FAFDC1DAED1824548121023B5639CCF7ACE962956A81C`). Not produced: `capture-recording.png` or a non-private live-success screenshot. | The committed screenshots remain synthetic and do not claim live provider output. The user-confirmed HTTPS preview live path is recorded separately without inventing a screenshot or usage total. Real-phone microphone permission, refresh/playback, and capture-through-confirmation remain unverified, so the physical-device Sprint exit gate is still open. |
| 4 | 2026-07-16 | `e5693ba`, `fcc0c21`, pending evidence follow-up | Sprint 4 Task 7 verification used pinned `gpt-5.6-terra`; Sol independently reviewed the commits and reran the gates | Full `npm run check` passed after the fix: typecheck, lint, 50 test files / 352 tests, and Next.js production build. The READY deployments completed non-private Work, School, and Personal organization; retrieval and action flows; and, after `fcc0c21`, real detail open/edit/archive/restore and individual export triggers. | [Library mobile](evidence/sprint-4/library-mobile.png); [Actions mobile](evidence/sprint-4/actions-mobile.png); [Detail mobile](evidence/sprint-4/detail-mobile.png); [Category description mobile](evidence/sprint-4/category-description-mobile.png). Hashes and exact manual evidence: `docs/qa/sprint-4-organization-checklist.md`. | **Exit gate incomplete.** Manual action removal, category reassignment/deletion, custom-category live-classification effect, and downloaded-payload inspection remain unproved. No extra live GPT call was made without a trustworthy remaining-cost estimate. |
| 5 | 2026-07-16 | `10c3892`, `63229b8`, `b5d110a`, `bf35b38`, `1cbeb5a`, `bb14ce3`, `5eddd54`, and `3c9fcbb` | Sprint 5 Task 6 evidence documentation; no session ID invented | At HEAD `3c9fcbb182675a91f3ccfd32216770714787288d`, `npm audit --omit=dev` reported 0 vulnerabilities; `npm run check` passed typecheck, lint, 56 files / 386 tests, and the production build; `npm run test:e2e` passed 3/3 twice. `vercel env ls` confirmed encrypted entry presence only: `OPENAI_API_KEY` in Production/Preview; `NUGGET_LLM_MODEL`, `NUGGET_TRANSCRIPTION_MODEL`, and `NUGGET_TRANSCRIPTION_API_KEY` in Development/Preview/Production. Authenticated smoke of `https://nugget-miner-ig8utfq43-steven-penningtons-projects.vercel.app` verified deployment `dpl_7wt1JTueTn4AH1thNuSWfKxSptqz` as preview, READY, 2026-07-16 15:05 PT; health `status: ok` with transcription `whisper-1` and organization `gpt-5.6-terra`; root **Nugget Quick capture**; the required CSP, Permissions-Policy, Referrer-Policy, nosniff, and DENY headers; standalone portrait-primary manifest with Nugget icon; and a service worker that excludes `/api/*` and non-GET requests. See `docs/qa/production-smoke-checklist.md`. | No new screenshot: authenticated deployment smoke only. | **Historical exit status, superseded for public access.** The July 16 preview was Vercel-auth protected. Public production was authorized later that day; Sprint 5 remains incomplete only for the physical-device, Edge/Safari, install/standalone/backgrounding matrix and the retained Sprint 2/Sprint 4 evidence gaps. |
| 6 | 2026-07-16 | `29f2bf0`, `05410ae`, `a2107ec`, `af860df`, `f9bb639`, `89987b3`, `e3a0753` (pushed pre-Task-5 baseline), and Task 5 documentation commit `6ffe664` | Sprint 6 Tasks 3 and 5 prepared truthful Devpost/demo/collaboration evidence; no primary Session ID invented | Ignored local capture suite passed 3/3 using deterministic safe data. It recaptured exactly five PNGs and the full-page detail asset asserts populated goal, blocker, research assessment, and suggested action before capture. No provider call was made. Task 5 verified the public repository remote and refs at the public MVP [branch](https://github.com/steven-d-pennington/nugget-miner/tree/codex/mvp-overnight-2026-07-15): pushed pre-Task-5 baseline `e3a0753`; default `main` at older `a668857`. Task 5 documentation follows with no application-source change. | [Screenshot plan](SCREENSHOT_PLAN.md) records the five filenames, dimensions, byte sizes, hashes, capture states, and visual-review notes. [Codex collaboration record](CODEX_COLLABORATION.md) records Sprint 0-6 history, roles, human decisions, and verification examples. | **Exit gates remain open.** This is a historical Task 5 record: public production is now authorized, public default `main` now contains the current MVP and MIT `LICENSE`, and the later canonical live-evaluation report is complete. The still-open gates are the public video, physical-device/PWA verification, Devpost submission/confirmation, and retention evidence. |

Blank evidence cells are intentional collection fields. Fill each sprint row at its exit gate.

## Primary Codex Session

- Session ID from `/feedback`: **Verified by the owner on July 17, 2026:** `019f66eb-7a90-7080-8667-b6ac77c45a23`.
- The verified value is recorded in the README and Devpost draft. It is not inferred from a worker, wrapper, planning, or coordination thread ID.
- Why this was the primary implementation task: This continuous overnight Codex goal coordinates sprint-by-sprint MVP implementation and verification through the planned exit gates.

## Sprint 6 Task 6 pre-submission engineering gate

Pre-submission evidence only; it does not authorize additional provider use,
publication, Devpost submission, tagging, or pushing. Production release is
authorized separately below. Sol's July
16, 2026 verification window began clean and synchronized at `5f7cf46`.
`npm ci` exited 0 (313 packages added; 314 audited; 0 vulnerabilities) with a
non-blocking `sharp@0.34.5` allow-scripts warning retained. The first
`npm run check` exposed an ignored temporary Task 3 Playwright capture spec
that Vitest discovered as an extra failing suite; Sol removed only that ignored
helper and its ignored config, with no Git diff. The clean rerun passed
typecheck, lint, 57 normal test files / 394 tests, and the 13-page Next.js
production build. `npm run test:e2e` passed 3/3 in 36.7 seconds and
`npm audit --omit=dev` found 0 vulnerabilities. Authenticated smoke of
`dpl_BRjPt1wGKEsxp6b1qbFF1KxgbDJu` (source `f9bb639`) found health `ok`,
`whisper-1`, `gpt-5.6-terra`, **Quick capture**, **Record**, and **Load sample
library**; it remains Vercel-auth protected, not a public judge path.

`npm run eval:live` stopped before provider-client use because
`OPENAI_KEY_NONEMPTY=False` and `OPENAI_API_KEY` was required; one eval file
failed and 13 tests skipped. That July 16 preflight made zero provider calls
with zero spend. The later successful canonical v2 report is now
`docs/evals/latest.json`; public production, logged-out
PWA/live-GPT judge-path, real-device/browser matrix, public YouTube video,
Devpost submission/confirmation, August 5 retention, and submission tag remain
open. The primary `/feedback` Session ID was subsequently verified in the
Primary Codex Session record above. See
[SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md) and
[FINAL_VERIFICATION.md](FINAL_VERIFICATION.md).

## Authorized production release

On July 16, 2026, Steven explicitly authorized production. The canonical
[public app](https://nugget-miner-kappa.vercel.app) is deployment
`dpl_CZWcgTiGf3TaPyjfxDp59vg5zbqr`, READY. Anonymous verification returned HTTP
200 for the root; `/api/health` reported `whisper-1` transcription and
`gpt-5.6-terra` organization; the root capture UI, required security headers,
standalone/portrait manifest, and service-worker API/non-GET exclusions passed.
The first production check exposed a stale `gpt-4o-mini` production model and a
subsequent stdin update exposed a trailing CRLF; both were rejected by the gate.
The final value was set exactly with Vercel CLI `--value` before the passing
redeploy. No live organization or transcription request was made during this
infrastructure verification.

## July 17 production two-call smoke

At `2026-07-17T17:11:13.3468501Z`, the public production app completed one
live GPT-5.6 Terra segmentation call and one live GPT-5.6 Terra organization
call. Segmentation response
`resp_0c2907a3d0bba45a016a5a621a86bc819c8bcdcddab754c988` used `segment-v1` /
`segmentation-v1` and returned two candidates. Organization response
`resp_0fd62ea84151a9ac016a5a622a1088819288f0b671c67a1c15` used `organize-v1` /
`organization-v1` and returned two ideas: Personal **Neighborhood tool-sharing
library** (one blocker, research needed, one action) and Work **Automated weekly
support handoff** (one blocker, no research needed, one action). The structured
metadata is in
[`../evals/production-smoke-2026-07-17.json`](../evals/production-smoke-2026-07-17.json).

This is a two-call production smoke, distinct from the later 12-fixture
canonical live evaluation in `docs/evals/latest.json`: it does not itself
report a canonical score. Coordinator verification on
July 17 also reported `npm run check` passing with 57 files / 394 tests and a
production build, `npm run test:e2e` passing 3/3, `npm audit --omit=dev`
reporting 0 vulnerabilities, and the public root/health/security smoke passing
with HTTP 200, `whisper-1`, and `gpt-5.6-terra`.

## Main-branch publication

On July 17, 2026, Steven authorized merging the verified MVP branch into public
default `main`. Merge commit `136cc47` contains the current MVP and MIT
`LICENSE`. Before the push, `npm run check` passed typecheck, lint, 57 test
files / 394 tests, and the Next.js production build. Historical Task 5 and
Sprint 6 entries above retain the then-accurate `a668857` baseline reference.

## July 17 completion-branch verification and promotion

Sol reviewed canonical-evaluation evidence commit `00572b2` and E2E metadata
drift fix `9087ebf`. Final `npm run check` passed typecheck, lint, 57 files /
396 tests, and the Next.js 16.2.9 13-page build; `npm audit --omit=dev` reported
0 vulnerabilities and `git diff --check` passed. An independent initial E2E
rerun failed 3/3 because `e2e/helpers/providerMocks.ts` still hard-coded
`segment-v1` / `organize-v1`; the app correctly rejected that invalid metadata.
`9087ebf` imports source prompt-version constants, after which Terra and Sol
each reran `npm run test:e2e` successfully (3/3).

Preview `dpl_23u5wWwZPjUFjja3pkBY63Z2cjFm` was READY. The exact artifact was
promoted under existing authorization to production
`dpl_BH8LmRFvdRYF4rtdztZWTTUcH2tH`, READY, with canonical aliases including
<https://nugget-miner-kappa.vercel.app>. Public health returned `ok`,
`whisper-1`, and `gpt-5.6-terra`; Settings HTML contained `segment-v2` and
`organize-v2`. Logged-out Chromium at 430 x 932 confirmed HTTP 200, Nugget,
the Capture/Ideas/Actions navigation, Settings, **Load sample library**, linked
manifest, service-worker support, and no framework overlays. The initial pass
saw one anonymous console 404; an immediate clean diagnostic rerun found no
failed requests or responses >=400, and the Vercel error-log query for the prior
hour returned no logs. This preserves the observed caveat without treating it as
a confirmed current failure.

The completion deployment does not close physical phone/install/offline/
backgrounding, Safari/Edge, Sprint 4 manual, video, Devpost, retention, tag, or
full-submission gates.

## July 17 privacy-safe Vercel Web Analytics

Terra added Vercel Web Analytics in `2b745e4`, then implemented privacy
redaction in `520ff31` and corrected the absolute event URL contract in
`7675528`. Sol reviewed both privacy commits and independently verified the
final behavior. The application uses the documented `beforeSend` boundary to
strip query strings and fragments and replace browser-local identifiers on
capture, idea, ideas-detail, and review routes. No recordings, transcripts,
idea content, local record identifiers, or custom event properties are sent.

The final focused run passed 2 files / 15 tests; typecheck, lint, the Next.js
16.2.9 13-page build, and diff checks passed. The preceding complete gate also
passed 58 files / 402 tests, all 3 E2E flows, and a zero-vulnerability
production dependency audit. Preview `dpl_58jTxo3fDfM3rh3Hi42PVtvK95j9`
accepted a sanitized synthetic dynamic-route pageview with HTTP 200 and no
local ID or query marker. Its exact artifact was promoted under existing
authority to production `dpl_BbBjNkew9j7gstAT2prrHSak62Fc`, READY. Public
verification at <https://nugget-miner-kappa.vercel.app> returned HTTP 200 for
the root, Analytics v2 script, Analytics pageview intake, and health endpoint;
the captured pageview contained only the canonical origin plus
`/capture/[capture]`, and no requests failed.

## July 17 owner-confirmed iPhone durability/PWA check

Steven reported completing the requested public-production device flow on an
iPhone 14 Pro Max: record, Stop & save, fully close/reopen, retained playback,
Add to Home Screen/installed use, offline-to-online processing resume, and no
duplicate. He reported that all requested checks looked good. This closes the
primary physical-phone/PWA durability check as owner-attested evidence. The
specific iPhone browser, a secondary desktop-browser run, microphone-denial,
screen-reader, and keyboard-only checks were not reported and are not inferred.
At `2026-07-17T12:39:48-07:00`, Sol correlated the report with a fresh public
smoke: root HTTP 200/title **Nugget** and health `ok`, `whisper-1`, and
`gpt-5.6-terra`.
