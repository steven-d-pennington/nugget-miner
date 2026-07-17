# Sprint 3 Mobile Capture and Review Checklist

Date: 2026-07-16

Branch: `codex/mvp-overnight-2026-07-15`

Scope: Sprint 3 capture, processing, editable multi-idea review, and minimal confirmed-idea destination

## Status definitions

- **Pass**: The stated check completed with evidence.
- **Fail**: The check completed and exposed a defect.
- **Blocked**: The required device, permission, credential, HTTPS environment, or authority was unavailable overnight.
- **Not run**: The check remains executable, but no completed result has been supplied yet.

Automated evidence does not substitute for a real-phone result where the checklist explicitly requires physical microphone and mobile-browser behavior.

## Environment and limits

| Item | Status | Evidence or limitation |
|---|---|---|
| Desktop-sized automated gate | Pass | Sol reported `npm run check` passing typecheck, lint, 42 test files / 292 tests, and the Next.js production build. |
| Final Task 5 focused verification | Pass | `npx vitest run src/features/review/ReviewScreen.test.tsx src/features/review/IdeaCandidateForm.test.tsx src/features/library/ConfirmedIdeasPreview.test.tsx` passed 3 files / 22 tests after the final candidate isolation guard. The later modal recovery fix also passed the same 3 files / 22 tests plus typecheck, lint, and `git diff --check`. |
| Independent Task 5 review | Pass | Commits `af2c744`, `494d90e`, and `3b64ad9` were independently reviewed. The initial modal-retry finding was fixed in `3b64ad9`, and re-review approved the result. |
| In-app mobile viewport | Pass | Sol verified the local app at 430 x 932 using `http://127.0.0.1:3011`. The Capture home put one-tap Record first and showed the zero-review queue link, typed fallback, recent captures, and persistent bottom navigation. `/ideas` showed the honest empty-library state with persistent navigation. Final screenshots were then recaptured from the production build server using `next start` at `http://127.0.0.1:3012`, without development controls. |
| Synthetic typed save and reload | Pass | Sol saved a synthetic 369-character typed ramble. The app navigated to `/capture/47190cef-001c-46bf-835a-be162378c850`, displayed Transcript Version 1, the processing timeline, and the cloud disclosure. A full reload preserved the same capture and transcript, with no console errors observed. |
| Synthetic multi-idea browser flow | Pass | On the production build at 430 x 932, a temporary local-only seed harness created fixed QA-prefixed records without live provider use. Sol verified a true `organizing` state, three draft ideas, independent edit persistence across Next/Previous, an exact source quote, discard-one/confirm-two, the completed review state, and two independent confirmed records in Ideas. The harness was removed before the final build and is not committed. |
| Real phone and HTTPS preview | Blocked | No real phone connected to an HTTPS-capable deployed preview was available during the overnight run. Plain LAN HTTP is not sufficient evidence for mobile `getUserMedia`. |
| Microphone authority | Blocked | Microphone acceptance requires explicit permission confirmation and a supported secure browser context. That confirmation was unavailable for this documentation pass. |
| Live GPT/OpenAI processing | Pass | On the deployed HTTPS preview, the user recorded audio, received the transcript, and then confirmed the GPT organization flow worked after commit `4c064e7` changed the API model default to `gpt-5.6-terra`. Vercel reported deployment `dpl_5Py2H5H6wuQJEaC9p5MMrHA8j4nt` READY. Exact API usage was not captured and is not estimated here. |

### Owner-confirmed physical-device follow-up — July 17, 2026

Steven later ran the requested production durability/PWA flow on a physical
iPhone 14 Pro Max and reported that all requested checks looked good: record,
Stop & save, fully close/reopen, retained local playback, Add to Home Screen/
installed use, offline-to-online processing resume, and no duplicate. The
browser name, a microphone-denial run, and reusable screenshot/video evidence
were not supplied, so this addendum records only the owner-attested scenarios.

## Automated verification

| Check | Status | Evidence |
|---|---|---|
| TypeScript typecheck | Pass | Included in the reported full `npm run check`; rerun after the Task 5 modal fix and passed. |
| ESLint | Pass | Included in the reported full `npm run check`; rerun after the Task 5 modal fix and passed. |
| Unit/component/repository tests | Pass | Full gate: 42 files / 292 tests. Final Task 5 focused gate: 3 files / 22 tests. |
| Production build | Pass | Next.js 16.2.9 production build completed in the reported full `npm run check`. |
| Whitespace/error-marker check | Pass | `git diff --check` passed after the Task 5 modal fix. |
| Atomic multi-idea confirmation | Pass | Tests cover three candidates, independent edit persistence, one confirmation followed by confirm-all, ordered stop-on-failure/retry, and distinct idea IDs. |
| Duplicate-safe accepted actions | Pass | ReviewService tests cover repeated confirmation without duplicate action items and rollback when a later accepted-action write fails. |
| Transactional discard state | Pass | Tests cover discarding one of two drafts, confirming one then discarding the last, and rolling back an orphan draft deletion. |
| Accessible discard recovery | Pass | Failed discard feedback and retry remain inside the active native dialog, focus returns to Retry discard, and edits remain intact; independent re-review approved the fix. |

## Mobile interaction checklist

| Scenario | Status | Evidence, next action, or blocker |
|---|---|---|
| First-open recording without login | Pass | At 430 x 932, the local app opened directly to the Capture surface with one-tap Record first and no login gate. This is browser evidence, not the still-blocked real-phone microphone test. |
| Microphone-denied recovery | Blocked | Requires an explicit browser permission denial in a secure microphone-capable context. Automated RecorderPanel coverage exists, but the required real interaction was unavailable. |
| 30-second recording, Stop & save, then immediate refresh | Blocked | Requires a real microphone capture and browser refresh. Automated tests prove Stop & save awaits local persistence before navigation/processing, but do not replace this device test. |
| Local playback after refresh | Blocked | Depends on producing a real locally saved recording. Automated AudioPlayer/CaptureDetail tests cover Blob URL lifecycle and stable playback identity during polling. |
| Automatic processing after consent | Not run | The consent and ordering UI is covered automatically. The user completed a live OpenAI transcription-and-organization flow, but did not identify whether it began automatically or through **Process now**. |
| Manual Process now after consent | Not run | Sol verified that Process now opened the explicit **Send for cloud processing?** dialog and that Cancel closed it without sending content. The user later completed a live provider flow, but did not identify whether the successful run began through this manual control. |
| App hidden during processing and resumed when visible | Not run | Automated visibility/resume listeners pass. A completed browser lifecycle observation has not yet been supplied. |
| Multi-idea review and independent editing | Pass | The synthetic production-browser flow rendered **3 ideas found**; an edited first title remained intact after Next and Previous navigation. |
| Source excerpt accuracy | Pass | Expanding **View source excerpt** displayed the exact seeded transcript quote for the current explicit summary. |
| Discard one idea and confirm two | Pass | The real discard modal removed the first draft, review advanced to **1 of 2**, and **Confirm all ready ideas (2)** completed with **2 ideas added to your library**. Ideas then listed the two independent confirmed records with category, summary, and source links. |
| Repeated confirmation does not duplicate actions | Not run | Automated repository/service tests pass. Awaiting a manual visible Actions/library confirmation once the downstream surface is available. |
| Keyboard focus and screen-reader labels | Not run | Automated tests cover control names, modal focus, and retry focus. No manual screen-reader or keyboard-only audit has been supplied. |
| Reduced-motion state | Not run | The global reduced-motion CSS fallback exists. No browser emulation or physical-device observation has been supplied. |

## Sprint 3 exit checklist

| Exit criterion | Status | Evidence or remaining work |
|---|---|---|
| Home prioritizes one-tap recording | Pass | Sol's 430 x 932 browser check showed the one-tap Record entry first, followed by review queue, typed fallback, recent captures, and persistent navigation. |
| Active recording contains no post-processing content | Pass | RecorderPanel tests verify active recording shows Listening, timer, waveform, and Stop & save without transcript or idea content. |
| Stop & save is one action and persists before navigation | Pass | Recorder tests verify local save resolves before route navigation or provider processing. |
| Saved capture survives refresh and processing failure | Pass | The synthetic typed capture and Transcript Version 1 survived a full reload with no console errors. Automated recovery tests cover processing failure preservation; real audio refresh remains blocked by microphone access. |
| Automatic, manual, offline, and retry states are understandable | Not run | State behavior and copy have automated coverage; mobile UX observation remains pending. |
| Ready capture opens multi-idea review on first visit | Pass | CaptureDetailScreen tests verify redirect to `/review/{captureId}` and `?stay=1` behavior. |
| Every idea field, category, and tags are editable | Pass | IdeaCandidateForm tests cover all rich fields, category, tags, validation, provenance, and source evidence. |
| Provenance and source excerpts are visible | Pass | Focused tests cover Explicit/Inferred/Suggested labels and exact stored source quotes. |
| Multiple ideas confirm independently; discards and failures preserve other work | Pass | Task 5 focused tests and transactional service tests pass; independent review approved the final recovery behavior. |
| A real phone completes capture through confirmation | Blocked | No real phone on an HTTPS-capable preview was available overnight. This remains a Sprint 3 exit-gate blocker. |
| Full `npm run check` passes | Pass | Sol reported 42 test files / 292 tests, typecheck, lint, and production build passing. |
| Sprint 3 evidence row is complete | Pass | The ledger records verified automation, browser QA, three confirmed assets, one unavailable asset, and all remaining blockers without claiming the Sprint exit gate is fully satisfied. |

## Screenshot evidence

| Path | Evidence | Status |
|---|---|---|
| `docs/hackathon/evidence/sprint-3/capture-idle.png` | Capture home at 430 x 932 from the production build server; 34,904 bytes; SHA-256 `136897526830656452505A90B81BE567B68405F1A5FC1C8D45B5A55D201CFDFD` | Pass |
| `docs/hackathon/evidence/sprint-3/processing.png` | Active synthetic `organizing` state from the production build, with the organizing control disabled; no live provider result is claimed. 33,098 bytes; SHA-256 `2F791561AD25BEA3CD90EE5242ED976CF1D16788D6B329ECAA0B38237605AE1B` | Pass |
| `docs/hackathon/evidence/sprint-3/capture-recording.png` | Not produced. Active microphone recording requires explicit permission acceptance and a real phone/HTTPS-capable preview. | Blocked |
| `docs/hackathon/evidence/sprint-3/three-idea-confirmation.png` | Three editable synthetic drafts in the production review UI. This proves the local UI flow, not live GPT output. 37,233 bytes; SHA-256 `7877475EB1CD467C411FAFDC1DAED1824548121023B5639CCF7ACE962956A81C` | Pass |

## Open verification work

1. Run the microphone-denied and 30-second Stop & save/refresh/playback flow on a real phone using an HTTPS-capable preview, then produce `capture-recording.png`.
2. Capture non-private evidence from a successful live transcription and GPT-5.6 Terra organization flow and record actual API usage separately. The user confirmed the deployed path works, but no reusable success screenshot or usage total was supplied.
3. Exercise visibility resume, reduced motion, keyboard-only navigation, and a screen reader in a real browser.
4. Re-run the full gate if additional code changes land after the evidence pass.
