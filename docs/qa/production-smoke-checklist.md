# Sprint 5 production smoke checklist

**Evidence date:** 2026-07-16
**Branch:** `codex/mvp-overnight-2026-07-15`
**Verified HEAD:** `3c9fcbb182675a91f3ccfd32216770714787288d`

## Initial preview record and access boundary

| Item | Verified result |
| --- | --- |
| Preview URL | `https://nugget-miner-ig8utfq43-steven-penningtons-projects.vercel.app` |
| Vercel deployment | `dpl_7wt1JTueTn4AH1thNuSWfKxSptqz` — preview, READY, 2026-07-16 15:05 PT |
| Anonymous access | Vercel-auth protected. This is not yet the public judging URL. |
| Production authority | Historical pre-authorization state. The July 16 addendum below records the subsequently authorized public deployment; Task 6 and Sprint 5 remain incomplete for the listed physical-device and live-evaluation gates. |

### Authorized public-production addendum — July 16, 2026

| Item | Verified result |
| --- | --- |
| Canonical public URL | `https://nugget-miner-kappa.vercel.app` |
| Production deployment | `dpl_CZWcgTiGf3TaPyjfxDp59vg5zbqr` — production, READY |
| Anonymous access | HTTP 200 without Vercel CLI authentication or a protection bypass |
| Health | `status: ok`; transcription `whisper-1`; organization `gpt-5.6-terra` |
| Public infrastructure smoke | Root capture UI, required security headers, standalone/portrait manifest, and service-worker API/non-GET exclusions passed |

The initial production smoke correctly stopped on a production-only
`gpt-4o-mini` organization value. After replacing `NUGGET_LLM_MODEL` with the
exact `gpt-5.6-terra` value and rebuilding, the canonical public URL passed.

### Two-call production organization smoke — July 17, 2026

At `2026-07-17T17:11:13.3468501Z`, the public production URL completed one
live segmentation call and one live organization call. Both reported
`gpt-5.6-terra`. Segmentation response
`resp_0c2907a3d0bba45a016a5a621a86bc819c8bcdcddab754c988` used `segment-v1` /
`segmentation-v1` and returned two candidates. Organization response
`resp_0fd62ea84151a9ac016a5a622a1088819288f0b671c67a1c15` used `organize-v1` /
`organization-v1` and returned two ideas: the Personal **Neighborhood
tool-sharing library** (one blocker, research needed, one action) and the Work
**Automated weekly support handoff** (one blocker, no research needed, one
action). Structured metadata is retained in
[`../evals/production-smoke-2026-07-17.json`](../evals/production-smoke-2026-07-17.json).

This is a production two-call smoke only. It is not the canonical 12-fixture
live evaluation. The later canonical v2 report in `docs/evals/latest.json`
does close the Sprint 2 quality/evaluation gate; it remains distinct from this
two-call production smoke.

### Completion-branch production verification — July 17, 2026

| Item | Verified result |
| --- | --- |
| Reviewed commits | Sol reviewed canonical-evaluation evidence `00572b2` and E2E metadata-drift fix `9087ebf`. |
| Deployments | Preview `dpl_23u5wWwZPjUFjja3pkBY63Z2cjFm`, READY; exact artifact promoted under existing authorization to production `dpl_BH8LmRFvdRYF4rtdztZWTTUcH2tH`, READY. Canonical aliases include `https://nugget-miner-kappa.vercel.app`. |
| Local verification | Final `npm run check`: typecheck, lint, 57 files / 396 tests, Next 16.2.9 build / 13 pages; `npm audit --omit=dev`: 0 vulnerabilities; `git diff --check`: pass. |
| E2E regression handling | Independent initial E2E rerun failed 3/3 because mocks sent stale `segment-v1` / `organize-v1` values. The application correctly rejected invalid metadata. `9087ebf` imports the current source constants; Terra and Sol each reran `npm run test:e2e`, both passing 3/3. |
| Public runtime | Health returned `ok`, `whisper-1`, and `gpt-5.6-terra`; public Settings HTML contained `segment-v2` and `organize-v2`. Headers, standalone portrait manifest, and API-excluding/GET-only service-worker behavior were reverified. |
| Logged-out mobile Chromium | 430 x 932: HTTP 200, title **Nugget**, meaningful content, `h1` **What’s on your mind?**, visible **Record**, Capture/Ideas/Actions navigation, Settings navigation, **Load sample library**, manifest linked, service-worker supported, and zero framework overlays. |
| Console/network diagnostic | First browser pass saw one anonymous console 404. Immediate clean diagnostic rerun found no failed requests and no responses >=400. Vercel error-log query for the prior hour returned no logs. Both observations are retained. |

### Privacy-safe Vercel Web Analytics verification — July 17, 2026

| Item | Verified result |
| --- | --- |
| Package and project state | `@vercel/analytics` 2.0.1; Web Analytics enabled in the Vercel project; no custom events or user-content properties. |
| Privacy behavior | `beforeSend` strips query strings and fragments and replaces local identifiers on capture, idea, ideas-detail, and review routes with stable placeholders. Unsafe or malformed URLs are dropped. |
| Final preview | `dpl_58jTxo3fDfM3rh3Hi42PVtvK95j9`, READY; source `7675528`. |
| Preview intake proof | Non-bot Chromium sent a synthetic `/capture/<local-id>?secret=<marker>` pageview. The v2 randomized intake returned HTTP 200 and received only the preview origin plus `/capture/[capture]`; neither marker was present. |
| Production | The exact preview was promoted to `dpl_BbBjNkew9j7gstAT2prrHSak62Fc`, READY. Canonical URL: `https://nugget-miner-kappa.vercel.app`. |
| Production smoke | Root, Analytics script, Analytics pageview intake, and `/api/health` each returned HTTP 200. The captured pageview contained only `https://nugget-miner-kappa.vercel.app/capture/[capture]`; health reported `whisper-1` and `gpt-5.6-terra`; no failed requests occurred. |

## Local automated proof

| Check | Result |
| --- | --- |
| `npm audit --omit=dev` | July 17 completion verification: 0 vulnerabilities |
| `npm run check` | July 17 completion verification: typecheck, lint, 57 files / 396 tests, and Next 16.2.9 13-page production build passed |
| `npm run test:e2e` | The initial independent rerun correctly failed 3/3 on stale mock metadata. After `9087ebf`, Terra and Sol each reran successfully: 3/3 passed. |
| Local production-mode Chromium E2E | Covers the critical flows with deterministic provider interception. It is browser automation proof, not physical-device proof. |

The July 17 two-call production smoke above is the only new live organization evidence recorded here; it is intentionally not represented as a canonical live evaluation or score.

## Authenticated deployed smoke

The following results were verified with authorized access to the protected preview. They do not make the preview anonymously accessible.

| Check | Result |
| --- | --- |
| Health | `status: ok`; transcription available `whisper-1`; organization available `gpt-5.6-terra` |
| Root page | Authenticated root renders **Nugget Quick capture** |
| Security headers | CSP `frame-ancestors 'none'; base-uri 'self'; form-action 'self'`; Permissions-Policy `microphone=(self), camera=(), geolocation=()`; Referrer-Policy `strict-origin-when-cross-origin`; `X-Content-Type-Options: nosniff`; `X-Frame-Options: DENY` |
| Manifest | Deployed manifest is `standalone`, `portrait-primary`, and has the Nugget icon |
| Service worker | Excludes `/api/*` and non-GET requests |

### Safe reproducible authenticated Vercel CLI commands

Use the authenticated Vercel CLI path that verified this protected preview. `npx vercel curl` automatically handles deployment protection for the logged-in Vercel CLI account. These commands do not introduce or print protection-bypass secrets, tokens, or environment values.

```powershell
$previewUrl = 'https://nugget-miner-ig8utfq43-steven-penningtons-projects.vercel.app'
$health = npx vercel curl /api/health --deployment $previewUrl
$health

$root = npx vercel curl / --deployment $previewUrl
if ($root -notmatch 'Nugget') { throw 'Authenticated root did not contain Nugget.' }
if ($root -notmatch 'Quick capture') { throw 'Authenticated root did not contain Quick capture.' }

npx vercel curl / --deployment $previewUrl -- --head
$manifest = npx vercel curl /manifest.webmanifest --deployment $previewUrl
$manifest
$serviceWorker = npx vercel curl /sw.js --deployment $previewUrl
$serviceWorker
```

`vercel env ls` is the presence-only check for environment entries. Do not run `vercel env pull` as part of this smoke checklist and do not inspect, print, or commit environment values.

## Manual and public-validation work pending

| Required work | Status and next action |
| --- | --- |
| Authorized public judging URL | **PASS.** Steven authorized production; the canonical URL and health endpoint respond anonymously. |
| Real device/browser matrix | **PASS for the primary device.** Steven owner-confirmed the requested production flow in Chrome on a physical iPhone 14 Pro Max. A secondary desktop browser remains optional additional evidence. |
| Real microphone and offline flow | **PASS by owner attestation.** Record, Stop & save, full close/reopen, local playback, installed offline/reconnect resume, and no duplicate all looked good on the iPhone 14 Pro Max. |
| PWA/manual privacy review | **PASS for the requested primary phone path.** Add to Home Screen/installed use and lifecycle recovery were owner-confirmed. No independent device instrumentation or screenshot was supplied. |

## Retained prior-sprint gaps

- Sprint 2 quality/evaluation gate is complete: the canonical v2 live report
  records all 12 passing fixtures with zero invalid categories or unsupported
  explicit claims. A reusable user-facing live-result screenshot remains a
  separate demonstration asset, not an evaluation-gate requirement.
- Sprint 4 remains incomplete: manual action removal, category reassignment/deletion, custom-category live-classification effect, and downloaded-payload inspection remain unproved.

These gaps are retained intentionally; this Sprint 5 evidence pass does not erase or supersede them.

## Task 6 status

The authenticated preview, completion-branch public production, environment-entry presence, local automated gate, headers, manifest, service-worker policy, owner-confirmed iPhone 14 Pro Max Chrome durability/PWA path, and public fast judge rehearsal are documented. Task 6 remains incomplete for the video, Devpost submission, and confirmation evidence; a secondary-browser pass would be optional additional evidence.

## Controlled installed-app updates — July 18, 2026

### Engineering and local production proof

| Check | Verified result |
| --- | --- |
| Automated gate | `npm test -- --run`: 66 files / 430 tests passed. `npm run typecheck`, changed-file ESLint, `npm run build`, and `git diff --check` passed. |
| Worker response | Local production `/sw.js` returned HTTP 200, `application/javascript`, `Cache-Control: no-cache, no-store, must-revalidate`, and `Service-Worker-Allowed: /`. Release `local-mrq5dbi4` appeared in the worker body and cache identity. |
| Activation policy | Install does not call `skipWaiting()`. The worker waits for the explicit `SKIP_WAITING` message; provider tests prove capture-lock refusal, one-time `controllerchange` reload, and retry after activation timeout. |
| First install | A clean production-mode browser registered the worker without displaying **New version ready**. Settings manual check returned **Nugget is up to date.** |
| Mobile routes | At a 430 x 932 browser viewport, Capture, Ideas, Actions, and Settings rendered their expected headings with no horizontal overflow. The Capture viewport screenshot was visually reviewed. |
| Runtime diagnostics | No browser console errors or warnings occurred across the four primary routes. |
| Export contract | Settings and the update prompt use the same full JSON export operation. Success copy is **Export created. Your data remains in Nugget.** Export remains optional and no restore capability is claimed. |

### First-rollout and device handoff

The release immediately preceding this feature uses the legacy auto-activating
worker. After the controlled-update release reaches production, open the
installed app while online, fully close it, and reopen it once. That loads the
new update client. A later deployment should then produce **New version ready**
inside the installed app without requiring a browser refresh control.

The remaining manual acceptance check is the physical iPhone two-deployment
transition: confirm the prompt is suppressed throughout recording and local
save, optionally create an export, choose **Update now**, observe one reload,
and verify existing recordings, ideas, categories, and actions remain present.

### Preview and production publication

| Item | Verified result |
| --- | --- |
| Git source | Branch `codex/mvp-completion-2026-07-17`, commit `95092ffa8b34e603b5e0911a9167b412085fd2ed`. |
| Preview | `dpl_DJfmdSEQgTiENgjWyYPJkRwCLtvr`, READY at `https://nugget-miner-rk5aog2dr-steven-penningtons-projects.vercel.app`. Authenticated root, health, and worker smoke passed. |
| Production | Promoted under the existing authorization as `dpl_8e3ASxpfBaKWacCo3DeXVnoZM6S4`, READY at `https://nugget-miner-kappa.vercel.app`. |
| Public smoke | Root, `/api/health`, and `/sw.js` returned HTTP 200. Health reported `whisper-1` and `gpt-5.6-terra`; worker release matched the production deployment ID with the required explicit-activation and cache headers. |
| Deployed transition | A mobile production browser with the prior worker saw waiting-version controls, selected **Update now**, reloaded once, retained release `dpl_8e3ASxpf`, removed the waiting actions, and produced no console warnings or errors. This is deployed-browser evidence, not the remaining physical-iPhone attestation. |
