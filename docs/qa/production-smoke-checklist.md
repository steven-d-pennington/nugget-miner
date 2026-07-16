# Sprint 5 production smoke checklist

**Evidence date:** 2026-07-16
**Branch:** `codex/mvp-overnight-2026-07-15`
**Verified HEAD:** `3c9fcbb182675a91f3ccfd32216770714787288d`

## Deployment record and access boundary

| Item | Verified result |
| --- | --- |
| Preview URL | `https://nugget-miner-ig8utfq43-steven-penningtons-projects.vercel.app` |
| Vercel deployment | `dpl_7wt1JTueTn4AH1thNuSWfKxSptqz` — preview, READY, 2026-07-16 15:05 PT |
| Anonymous access | Vercel-auth protected. This is not yet the public judging URL. |
| Production authority | A production deployment is not authorized. Task 6 and Sprint 5 remain incomplete. |

## Local automated proof

| Check | Result |
| --- | --- |
| `npm audit --omit=dev` | 0 vulnerabilities |
| `npm run check` | Typecheck, lint, 56 files / 386 tests, and production build pass |
| `npm run test:e2e` | Run twice; 3/3 passed on each run |
| Local production-mode Chromium E2E | Covers the critical flows with deterministic provider interception. It is browser automation proof, not physical-device proof. |

No new live OpenAI call was made and no estimated spend was recorded for this evidence pass.

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
| Authorized public judging URL | **Pending.** In the morning, obtain explicit owner authorization for the intended public judging deployment or public-production route. After that authorized change, verify anonymous access in a clean browser and with `curl.exe --head <public-url>`; it must not require Vercel authentication. Do not change Vercel settings as part of this checklist. |
| Real device/browser matrix | **Not performed.** No physical device, Edge/Safari, install/standalone/backgrounding matrix was performed. Run the Sprint 5 matrix on at least one physical phone plus the available desktop secondary browser. |
| Real microphone and offline flow | **Pending.** On the authorized public HTTPS URL, record, save, reload/play back, reconnect an offline capture, and briefly background/reopen the installed app. |
| PWA/manual privacy review | **Pending.** Confirm install, standalone launch, icon, privacy/error copy, and that no API response is served from service-worker cache on the actual device/browser matrix. |

## Retained prior-sprint gaps

- Sprint 2 remains incomplete: the cost-deferred live evaluation score and reusable live-result screenshot are still open.
- Sprint 4 remains incomplete: manual action removal, category reassignment/deletion, custom-category live-classification effect, and downloaded-payload inspection remain unproved.

These gaps are retained intentionally; this Sprint 5 evidence pass does not erase or supersede them.

## Task 6 status

The authenticated preview, environment-entry presence, local automated gate, headers, manifest, and service-worker policy are documented. Task 6 and Sprint 5 remain incomplete until an authorized public judging URL and the required real-device/browser matrix are verified.
