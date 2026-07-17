# Nugget pre-submission owner checklist

> **Status:** Incomplete pre-submission gate. This record reflects Sol's July 16,
> 2026 engineering evidence window and this documentation claim-surface review.
>
> **Authority boundary:** This checklist does not authorize a production release,
> Vercel setting change, provider call, YouTube publication, Devpost submission,
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
- [x] The clean rerun of `npm run check` exited 0: typecheck, lint, 57 normal
  test files / 394 tests, and the Next.js 16.2.9 production build with 13 static
  pages all passed.
- [x] `npm run test:e2e` exited 0: 3/3 critical flows passed in 36.7 seconds.
- [x] `npm audit --omit=dev` reported 0 vulnerabilities.
- [x] The authenticated preview smoke passed for deployment
  `dpl_BRjPt1wGKEsxp6b1qbFF1KxgbDJu` at the [verified preview](https://nugget-miner-782mixz1t-steven-penningtons-projects.vercel.app): health was `ok`,
  transcription was `whisper-1`, organization was `gpt-5.6-terra`, root exposed
  **Quick capture** and **Record**, and Settings exposed **Load sample library**.
  This is explicitly not a logged-out or public judge-path check.
- [x] README, Devpost, demo, and non-test app-source claim surfaces were searched
  and reviewed for models, review/confirmation, local/cloud wording, and deferred
  capabilities. The documented comparison is in the [final verification
  record](FINAL_VERIFICATION.md#claim-surface-comparison).
- [ ] `npm run eval:live` passes and writes `docs/evals/latest.json`. It exited 1
  before provider-client use because `OPENAI_KEY_NONEMPTY=False` and
  `OPENAI_API_KEY is required for the live evaluation`; one eval file failed and
  13 tests were skipped. No provider call, report, or spend is claimed.
- [ ] The full logged-out public production/PWA smoke passes. Anonymous root,
  health, headers, manifest, and service-worker checks pass at
  `https://nugget-miner-kappa.vercel.app`; install/standalone and physical-device
  interaction remain open.

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
  after merge commit `136cc47`; the implementation branch remains available for
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
- [ ] The sample library's usefulness, local behavior, idempotency, and labels
  are re-executed for this final gate. This gate only reverified that Settings
  exposes **Load sample library**; see the earlier [judge test path](JUDGING_TEST_PATH.md)
  and evidence ledger for the prior focused evidence.
- [ ] Five final screenshots are uploaded to Devpost in the planned order. Five
  prepared assets are recorded in [SCREENSHOT_PLAN.md](SCREENSHOT_PLAN.md), but
  no Devpost upload or public-production image comparison occurred here.
- [ ] Final screenshots are recaptured or compared against the owner-approved
  public production build, with every asset opened and checked for current UI,
  truthful labels, and no secrets.

## Owner and external actions pending

- [ ] Select **Apps for Your Life** in Devpost.
- [ ] Paste the title and descriptions from the final approved
  [Devpost draft](DEVPOST_SUBMISSION.md), then visually re-read the rendered
  fields for truncation or stale wording.
- [x] Steven explicitly authorized the production release on July 16, 2026.
- [x] Verify the owner-approved production HTTPS URL without deployment
  authentication and at `/api/health`. `https://nugget-miner-kappa.vercel.app`
  returned HTTP 200; health reported `whisper-1` and `gpt-5.6-terra`.
- [ ] On that public URL, install/open the PWA where available; load the sample
  library; complete the [fast judge path](JUDGING_TEST_PATH.md#fast-exploration-about-2-minutes);
  and complete a real pasted two-idea GPT path without exposing private data.
- [ ] Complete the physical-device, Edge/Safari, install/standalone, microphone,
  offline/reopen, and background/reopen matrix described in the [production
  smoke checklist](../qa/production-smoke-checklist.md#manual-and-public-validation-work-pending).
- [x] Primary implementation `/feedback` Session ID verified and recorded in the
  README, Devpost draft, and evidence ledger: `019f66eb-7a90-7080-8667-b6ac77c45a23`.
- [ ] Record an owner-approved public YouTube demo under three minutes, then
  verify public logged-out playback, audio, captions, title, description, and
  runtime. Follow the [demo recording checklist](DEMO_RECORDING_CHECKLIST.md).
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

1. Run the remaining physical-device/browser/PWA checks on the verified public
   production path.
2. Complete the fast judge path on that exact
   URL; stop if the public judge path is not frictionless.
3. If a safe nonempty key and an accepted budget are available, run the live
   evaluation and retain its result; otherwise keep that gate visibly open.
4. Record and publish the truthful public YouTube demo, then verify playback
   while logged out.
5. Perform the final app/README/Devpost/video/screenshot claim comparison.
6. Submit Devpost and immediately reopen it to reverify persistence.
7. Only then commit the real confirmation evidence and create/push the annotated
   submission tag.
