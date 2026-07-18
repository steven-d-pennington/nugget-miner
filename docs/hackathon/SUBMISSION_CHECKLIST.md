# Nugget pre-submission owner checklist

> **Status:** Incomplete pre-submission gate. This record reflects Sol's July 16,
> 2026 engineering evidence window and this documentation claim-surface review.
>
> **Authority boundary:** This checklist does not authorize a Vercel setting
> change, additional provider call, YouTube publication, Devpost submission,
> tag, push, or any external publication. Checked boxes mean evidence was
> verified in this gate; unchecked boxes require the named owner action and
> fresh evidence.

Use this alongside the [final verification record](FINAL_VERIFICATION.md),
[Devpost submission draft](DEVPOST_SUBMISSION.md), [demo recording
checklist](DEMO_RECORDING_CHECKLIST.md), [judge test path](JUDGING_TEST_PATH.md),
and [Build Week evidence ledger](BUILD_WEEK_EVIDENCE.md).

## Engineering verified

- [x] Starting branch state was clean and synchronized with
  `origin/codex/mvp-overnight-2026-07-15` at
  `5f7cf461d6351d65101dec65ad23f759eb1973f0`.
- [x] `npm ci` exited 0: 313 packages added, 314 audited, and 0 vulnerabilities.
  npm's `sharp@0.34.5` allow-scripts warning was non-blocking and is retained in
  the [final verification record](FINAL_VERIFICATION.md#clean-engineering-evidence).
- [x] Final completion-branch `npm run check` passed: typecheck, lint, 57 files /
  396 tests, and the Next.js 16.2.9 production build with 13 pages. Sol reviewed
  evidence commit `00572b2` and the E2E repair `9087ebf`.
- [x] After an independent first E2E rerun correctly failed on stale mock
  `segment-v1` / `organize-v1` metadata, `9087ebf` imported the source constants.
  Terra and Sol each reran `npm run test:e2e`; both passed 3/3 critical flows.
- [x] Final `npm audit --omit=dev` reported 0 vulnerabilities; `git diff --check`
  passed.
- [x] Completion artifact promoted to public production: preview
  `dpl_23u5wWwZPjUFjja3pkBY63Z2cjFm` and production
  `dpl_BH8LmRFvdRYF4rtdztZWTTUcH2tH` are READY. Public health is `ok` with
  `whisper-1` and `gpt-5.6-terra`; public Settings contains `segment-v2` and
  `organize-v2`. Logged-out mobile Chromium smoke is recorded in the
  [production checklist](../qa/production-smoke-checklist.md).
- [x] The authenticated preview smoke passed for deployment
  `dpl_BRjPt1wGKEsxp6b1qbFF1KxgbDJu` at the [verified preview](https://nugget-miner-782mixz1t-steven-penningtons-projects.vercel.app): health was `ok`,
  transcription was `whisper-1`, organization was `gpt-5.6-terra`, root exposed
  **Quick capture** and **Record**, and Settings exposed **Load sample library**.
  This is explicitly not a logged-out or public judge-path check.
- [x] README, Devpost, demo, and non-test app-source claim surfaces were searched
  and reviewed for models, review/confirmation, local/cloud wording, and deferred
  capabilities. The documented comparison is in the [final verification
  record](FINAL_VERIFICATION.md#claim-surface-comparison).
- [x] `npm run eval:live` passed and wrote `docs/evals/latest.json` at
  `2026-07-17T18:23:10.007Z`: `gpt-5.6-terra`, medium reasoning, `segment-v2`,
  and `organize-v2`; 12/12 correct idea counts and categories; zero invalid
  categories and unsupported explicit claims; all 12 special requirements and
  both response IDs per fixture present. The initial failed v1 report remains in
  Git history at `be48e46`; the v2 prompt fix is `8d5d380`.
- [x] A **two-call production smoke** at
  `2026-07-17T17:11:13.3468501Z` completed one live `segment-v1` /
  `segmentation-v1` request and one live `organize-v1` / `organization-v1`
  request with `gpt-5.6-terra`, returning two candidates and two structured
  ideas. See [`../evals/production-smoke-2026-07-17.json`](../evals/production-smoke-2026-07-17.json).
  This is not `npm run eval:live`, does not create `docs/evals/latest.json`,
  and does not replace the canonical 12-fixture evaluation gate recorded above.
- [x] The primary logged-out public production/PWA smoke passes. Anonymous root,
  health, headers, manifest, and service-worker checks pass at
  `https://nugget-miner-kappa.vercel.app`. Steven also owner-confirmed the
  requested capture/save/close/reopen/playback and installed offline/reconnect
  path in Chrome on an iPhone 14 Pro Max with resumed processing and no duplicate.

### Safe engineering commands

Run these from a clean checkout. The live-eval command is cost-incurring and
requires an authorized budget plus a safely injected nonempty key; it must not
be run merely to make this checklist green.

```powershell
git status --short --branch
npm ci
npm run check
npm run test:e2e
npm audit --omit=dev

# Only after the owner accepts provider cost and a safe key is available.
$hasOpenAiKey = -not [string]::IsNullOrWhiteSpace($env:OPENAI_API_KEY)
"OPENAI_KEY_NONEMPTY=$hasOpenAiKey"
npm run eval:live
Remove-Item Env:OPENAI_API_KEY -ErrorAction SilentlyContinue

git diff --check
```

## Repository and assets verified

- [x] The repository is public and default `main` now contains the current MVP
  after merge commit `e50cd428`; the implementation branch remains available for
  Build Week history.
- [x] An MIT `LICENSE` exists on public default `main`.
- [x] The [README](../../README.md) was reviewed for setup, sample path, testing,
  GPT-5.6, Codex, human decisions, architecture, privacy, boundaries, and
  before/after Build Week evidence. Its relative links were checked in this
  documentation gate.
- [x] The [Devpost draft](DEVPOST_SUBMISSION.md) was compared with the README,
  demo script, and app source. Its claims preserve required review, local
  browser storage with opt-in cloud processing, and the exclusions for
  self-learning, live research, sync, and fully-closed-browser processing.
- [x] The sample library's usefulness, local behavior, idempotency, and labels
  were re-executed against public production in a clean mobile Chrome context.
  The complete [judge test path](JUDGING_TEST_PATH.md) passed through Markdown
  export with zero provider calls, console errors, page errors, HTTP errors, or
  unexpected failed requests.
- [ ] Five final screenshots are uploaded to Devpost in the planned order. Five
  current-production assets are recorded in
  [SCREENSHOT_PLAN.md](SCREENSHOT_PLAN.md); Devpost upload has not occurred.
- [x] Final screenshots were recaptured from the owner-approved public
  production origin on July 18 at a 430 × 932 CSS viewport. The isolated run
  passed 1/1, all five assets were opened, and current UI, truthful labels,
  deterministic/sample boundaries, and absence of secrets were checked. See
  [SCREENSHOT_PLAN.md](SCREENSHOT_PLAN.md).

## Owner and external actions pending

- [x] Steven confirmed **Apps for Your Life** is selected in the existing
  Devpost submission draft.
- [ ] Paste the title and descriptions from the final approved
  [Devpost draft](DEVPOST_SUBMISSION.md), then visually re-read the rendered
  fields for truncation or stale wording.
- [x] Steven explicitly authorized the production release on July 16, 2026.
- [x] Verify the owner-approved production HTTPS URL without deployment
  authentication and at `/api/health`. `https://nugget-miner-kappa.vercel.app`
  returned HTTP 200; health reported `whisper-1` and `gpt-5.6-terra`.
- [x] On that public URL, install/open the PWA and complete the requested physical
  capture durability path. Steven confirmed success in Chrome on an iPhone 14 Pro Max,
  including save/playback after close/reopen and offline/reconnect processing
  resume without a duplicate.
- [x] Complete the fast sample-library judge rehearsal on public production.
  Search/filter, structured detail/source inspection, action completion, return
  navigation, and Markdown export all passed in clean mobile Chrome automation.
- [ ] Optionally run an available secondary desktop browser. The owner-confirmed
  phone result does not claim a microphone-denial, screen-reader, or keyboard-only audit.
- [x] Primary implementation `/feedback` Session ID verified and recorded in the
  README, Devpost draft, and evidence ledger: `019f66eb-7a90-7080-8667-b6ac77c45a23`.
- [x] Owner approved the local 171.5-second narrated master with genuine iPhone
  capture footage, deterministic/sample disclosure, AAC audio, and 14 embedded
  English captions.
- [ ] Upload that approved master to YouTube as Public, then verify public
  logged-out playback, audio, captions, title, description, and runtime. Follow
  the [demo recording checklist](DEMO_RECORDING_CHECKLIST.md).
- [ ] Confirm the public deployment will remain free and unrestricted through
  August 5, 2026 at 5:00 PM Pacific, and record the retention evidence.

### Safe logged-out checks after release approval

These commands only inspect a URL the owner has already authorized and made
public. They do not change deployment settings or disclose credentials.

```powershell
$productionUrl = Read-Host 'Paste the owner-approved public HTTPS URL'
if ([string]::IsNullOrWhiteSpace($productionUrl)) { throw 'A public URL is required.' }
curl.exe --head $productionUrl
curl.exe --fail "$productionUrl/api/health"
```

## Final submission and tag pending

- [ ] Compare the final public app, README, Devpost fields, video, screenshots,
  model metadata, privacy wording, and [judge path](JUDGING_TEST_PATH.md) one
  last time. Confirm there are no unsupported claims.
- [ ] Complete the Devpost **Submit** action before the July 21, 2026 internal
  deadline of 2:00 PM Pacific.
- [ ] Reopen the submitted entry and verify every field, URL, screenshot, video,
  track, repository link, and Session ID persisted.
- [ ] Save the observed confirmation page or email as
  `docs/hackathon/submission-assets/submission-confirmed.png` only after a real
  submission. Do not create a stand-in asset.
- [ ] Commit the actual confirmation evidence, create the annotated submission
  tag, and push them only after submission has been reverified and the owner
  authorizes those Git actions.

**Submission status:** Not submitted in this gate; no person has clicked
Devpost **Submit**. **Confirmation evidence:** Not captured. **Annotated tag:**
Not created. These are status statements, not placeholders.

## Recommended remaining owner sequence

1. Upload the approved narrated master to YouTube and verify playback while
   logged out.
2. Upload the five final screenshots and paste the final Devpost copy.
3. Perform the final app/README/Devpost/video/screenshot claim comparison.
4. Submit Devpost and immediately reopen it to reverify persistence.
5. Only then commit the real confirmation evidence and create/push the annotated
   submission tag.
