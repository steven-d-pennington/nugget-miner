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
| In-app mobile viewport | Pass | Sol verified the local app at 430 x 932 using `http://127.0.0.1:3011`. The Capture home put one-tap Record first and showed the zero-review queue link, typed fallback, recent captures, and persistent bottom navigation. `/ideas` showed the honest empty-library state with persistent navigation. |
| Synthetic typed save and reload | Pass | Sol saved a synthetic 369-character typed ramble. The app navigated to `/capture/47190cef-001c-46bf-835a-be162378c850`, displayed Transcript Version 1, the processing timeline, and the cloud disclosure. A full reload preserved the same capture and transcript, with no console errors observed. |
| Real phone and HTTPS preview | Blocked | No real phone connected to an HTTPS-capable deployed preview was available during the overnight run. Plain LAN HTTP is not sufficient evidence for mobile `getUserMedia`. |
| Microphone authority | Blocked | Microphone acceptance requires explicit permission confirmation and a supported secure browser context. That confirmation was unavailable for this documentation pass. |
| Live GPT/OpenAI processing | Blocked | No live provider run was performed for Sprint 3. Overnight API usage remains $0. Deterministic and mocked processing checks do not prove a live GPT-5.6 flow. |

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
| Automatic processing after consent | Blocked | The consent and ordering UI is covered automatically, but no live OpenAI call was made. API usage remains $0. |
| Manual Process now after consent | Blocked | Sol verified that Process now opened the explicit **Send for cloud processing?** dialog and that Cancel closed it without sending content. Sending after consent and completing a live provider run were not performed; API usage remains $0. |
| App hidden during processing and resumed when visible | Not run | Automated visibility/resume listeners pass. A completed browser lifecycle observation has not yet been supplied. |
| Multi-idea review and independent editing | Not run | Automated Task 5 tests pass for three candidates and edit persistence across next/back. Awaiting Sol's mobile browser observation. |
| Source excerpt accuracy | Not run | Automated form tests preserve exact stored quotes and render transcript content as text. Awaiting comparison against a visible sample capture. |
| Discard one idea and confirm two | Not run | Transactional discard and multi-confirmation paths pass automated tests. Awaiting the manual three-idea browser flow. |
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
| Sprint 3 evidence row is complete | Pass | The ledger records verified automation, browser QA, two confirmed assets, two unavailable assets, and all remaining blockers without claiming the Sprint exit gate is fully satisfied. |

## Screenshot evidence

| Path | Evidence | Status |
|---|---|---|
| `docs/hackathon/evidence/sprint-3/capture-idle.png` | Capture home at 430 x 932; 38,205 bytes; SHA-256 `7352C708DB4D96C3BFFF6B38EAC02847029A1B5CA96976989F8328EC0C047350` | Pass |
| `docs/hackathon/evidence/sprint-3/processing.png` | Saved synthetic typed capture with manual processing pending. This is not evidence of active provider processing; 32,106 bytes; SHA-256 `B80F0C09F2B91BE60454C2E52B120AC0F8153A5A00514144C20609F6AD2294B3` | Pass |
| `docs/hackathon/evidence/sprint-3/capture-recording.png` | Not produced. Active microphone recording requires explicit permission acceptance and a real phone/HTTPS-capable preview. | Blocked |
| `docs/hackathon/evidence/sprint-3/three-idea-confirmation.png` | Not produced. The live GPT/evaluation run was deferred under the overnight cost ceiling; API usage remains $0. | Blocked |

## Open verification work

1. Run the microphone-denied and 30-second Stop & save/refresh/playback flow on a real phone using an HTTPS-capable preview, then produce `capture-recording.png`.
2. Run one authorized live transcription and GPT-5.6 organization flow, recording actual API usage separately, then produce `three-idea-confirmation.png` from synthetic content.
3. Exercise visibility resume, reduced motion, keyboard-only navigation, and a screen reader in a real browser.
4. Re-run the full gate if additional code changes land after the evidence pass.
