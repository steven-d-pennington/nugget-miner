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
| Real device/browser matrix | **Not performed.** No physical device, Edge/Safari, install/standalone/backgrounding matrix was performed. Run the Sprint 5 matrix on at least one physical phone plus the available desktop secondary browser. |
| Real microphone and offline flow | **Pending.** On the authorized public HTTPS URL, record, save, reload/play back, reconnect an offline capture, and briefly background/reopen the installed app. |
| PWA/manual privacy review | **Pending.** Confirm install, standalone launch, icon, privacy/error copy, and that no API response is served from service-worker cache on the actual device/browser matrix. |

## Retained prior-sprint gaps

- Sprint 2 quality/evaluation gate is complete: the canonical v2 live report
  records all 12 passing fixtures with zero invalid categories or unsupported
  explicit claims. A reusable user-facing live-result screenshot remains a
  separate demonstration asset, not an evaluation-gate requirement.
- Sprint 4 remains incomplete: manual action removal, category reassignment/deletion, custom-category live-classification effect, and downloaded-payload inspection remain unproved.

These gaps are retained intentionally; this Sprint 5 evidence pass does not erase or supersede them.

## Task 6 status

The authenticated preview, completion-branch public production, environment-entry presence, local automated gate, headers, manifest, and service-worker policy are documented. Task 6 and Sprint 5 remain incomplete until the required real-device/browser matrix and live judge path are verified.
