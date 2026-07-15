# Nugget MVP Sprint 3 Mobile Capture and Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the primary mobile experience from one-tap recording through durable processing and confirmation of multiple rich ideas.

**Architecture:** Mount a client-side queue runner once in the app shell, make the recorder's stop action persist audio immediately, and route saved captures to a status/detail screen. When processing reaches `ready_for_review`, load editable idea drafts into a sequential mobile review flow backed by the repositories and ReviewService from Sprints 1–2.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS, MediaRecorder, Dexie repositories, Testing Library, Vitest.

## Global Constraints

- Read the newest user design-system document under `docs/design/` before editing UI.
- If no newer file exists, use `docs/design/NUGGET_MVP_DESIGN_AGENT_BRIEF.md` and its reference images.
- The active recording screen must not show a transcript or extracted ideas.
- **Stop & save** must commit locally before navigation or processing.
- Recording remains the dominant landing action; pasted text remains secondary.
- The user can leave after save; copy must say processing resumes when the app is open and connected.
- Do not claim background execution while the browser is fully closed.
- Consent to cloud processing is one-time and editable in Settings; never send content when consent is unknown or denied.
- Review is mandatory; do not add automatic filing.
- Every generated field remains editable.
- Use 48-pixel primary touch targets, safe areas, visible focus, screen-reader state text, and reduced-motion behavior.
- Use focused component tests and manual mobile verification, not snapshot tests or full TDD.

---

### Task 1: Implement the visual tokens and application shell

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `src/app/ideas/page.tsx`
- Create: `src/app/actions/page.tsx`
- Create: `src/app/settings/page.tsx`
- Create: `src/components/AppShell.tsx`
- Create: `src/components/BottomNav.tsx`
- Create: `src/components/NuggetMark.tsx`
- Create: `src/components/ProcessingQueueRunner.tsx`
- Create: `src/components/AppShell.test.tsx`

**Interfaces:**
- Consumes: production `ProcessingService.resumePending()` from Sprint 2
- Produces: consistent header, three-tab navigation, status runner, and visual tokens for all later screens

- [ ] **Step 1: Apply the final design tokens or the approved fallback**

If the user design system specifies different tokens, use it exactly and record the filename in the commit. Otherwise define:

```css
:root {
  color-scheme: light;
  --canvas: #fbf8f2;
  --surface: #ffffff;
  --surface-warm: #fff2d4;
  --ink: #101d36;
  --muted: #6e6b67;
  --accent: #e5a11a;
  --accent-strong: #b97700;
  --line: #e8ddce;
  --success: #247a55;
  --danger: #b73535;
  --focus: #315cff;
  --radius-sm: 12px;
  --radius-md: 18px;
  --shadow-card: 0 12px 30px rgb(16 29 54 / 0.08);
}
```

Use `env(safe-area-inset-*)`, `min-height: 100dvh`, and a reduced-motion media query. Remove the existing dark radial gradient and light/dark auto-switch unless the user's final system explicitly retains them.

- [ ] **Step 2: Configure typography**

If the final design system has no font decision, import `Fraunces`, `Manrope`, and `IBM_Plex_Mono` through `next/font/google`. Apply serif only to the wordmark, Manrope to UI, and mono to timers/metadata. Keep system fallbacks in CSS variables.

- [ ] **Step 3: Build the brand mark and shell**

`NuggetMark` renders an accessible inline SVG faceted amber mark with `aria-hidden="true"`; visible product text remains actual text. `AppShell` accepts:

```ts
interface AppShellProps {
  title?: string;
  backHref?: string;
  children: React.ReactNode;
  showNavigation?: boolean;
}
```

It renders a sticky header, main content, `BottomNav`, and the queue runner. Do not make every content block a floating card.

- [ ] **Step 4: Implement three-tab navigation**

Tabs and routes:

```ts
const tabs = [
  { href: '/', label: 'Capture' },
  { href: '/ideas', label: 'Ideas' },
  { href: '/actions', label: 'Actions' },
] as const;
```

Use `usePathname()` for `aria-current="page"`. Link the header gear to `/settings`. Create minimal route pages for `/ideas`, `/actions`, and `/settings` if Sprint 4 has not yet created them; each minimal page must use `AppShell` and plain truthful copy, not a 404.

- [ ] **Step 5: Resume processing while the app is active**

`ProcessingQueueRunner` calls `ProcessingService.resumePending()`:

- once on mount;
- on `window.online`;
- when `document.visibilityState` changes to `visible`.

Use an internal ref to avoid overlapping resumes. It renders no visible UI and catches errors because capture state already stores them.

- [ ] **Step 6: Test accessibility and resume triggers**

Assert the navigation labels, active state, 3-tab count, settings link, and one resume call on mount. Dispatch `online` and visible events and assert additional non-overlapping calls.

- [ ] **Step 7: Run and commit**

```powershell
npx vitest run src/components/AppShell.test.tsx
npm run typecheck
git add src/app/globals.css src/app/layout.tsx src/components src/app/ideas src/app/actions src/app/settings
git commit -m "feat: add Nugget mobile application shell"
```

### Task 2: Replace draft/save controls with one-tap mobile capture

**Files:**
- Rewrite: `src/features/recorder/HomeScreen.tsx`
- Rewrite: `src/features/recorder/RecorderPanel.tsx`
- Modify: `src/hooks/useRecorder.ts`
- Create: `src/hooks/useWakeLock.ts`
- Rewrite: `src/features/recorder/HomeScreen.test.tsx`
- Rewrite: `src/features/recorder/RecorderPanel.test.tsx`
- Modify: `src/features/recorder/TextCaptureForm.tsx`

**Interfaces:**
- Consumes: `CaptureService.saveRecording()`, `settingsRepository.get()`, `ProcessingService.process()`
- Produces: capture ID routed to `/capture/{captureId}` after local commit

- [ ] **Step 1: Preserve stopped drafts until persistence succeeds**

`useRecorder.stop()` already returns a draft. Ensure a failed save does not call `discard()` and leaves the draft available for `retrySave`. Add:

```ts
const clearSavedDraft = useCallback(() => {
  setDraft(null);
  setElapsedMs(0);
  setLevel(0);
}, []);
```

Return it from the hook. Do not expose the raw service outside the hook.

- [ ] **Step 2: Add progressive wake lock**

`useWakeLock(active)` requests `navigator.wakeLock?.request('screen')` when recording starts, releases on stop/unmount, and silently falls back when unsupported. It must never block recording.

- [ ] **Step 3: Make Stop perform save**

Use one handler:

```ts
async function stopAndSave() {
  setSaving(true);
  setSaveError(null);
  const draft = await recorder.stop();
  if (!draft) {
    setSaving(false);
    return;
  }
  try {
    const settings = await settingsRepository.get();
    const saved = await CaptureService.saveRecording({
      draft,
      processingPreference: settings.automaticProcessing ? 'automatic' : 'manual',
    });
    recorder.clearSavedDraft();
    router.push(`/capture/${saved.capture.id}`);
    if (settings.automaticProcessing && settings.cloudProcessingConsent === 'granted') {
      void ProcessingService.process(saved.capture.id);
    }
  } catch (error) {
    setSaveError(storageMessage(error));
  } finally {
    setSaving(false);
  }
}
```

The same stored draft can be retried after a quota error.

- [ ] **Step 4: Build capture and recording states from the design contract**

Idle state contains:

- Nugget mark and **What’s on your mind?**
- one large Record button;
- review-ready count;
- recent captures and statuses;
- collapsed **Paste a ramble**.

Recording state contains only:

- **Listening…**;
- large elapsed timer;
- accessible waveform/level visualization;
- large **Stop & save**;
- **Saved on this device when you stop**.

Add `beforeunload` protection only while actively recording or while a stopped draft remains unsaved.

- [ ] **Step 5: Implement truthful consent invitation without blocking recording**

When cloud consent is `unknown`, show a small post-capture preference card on the home screen:

```text
Organize captures automatically
When enabled, audio and transcript text are sent securely to OpenAI for transcription and GPT-5.6 organization. Saved recordings and ideas remain in this browser.
```

Buttons: **Enable automatic organization** and **Not now**. Enable sets consent `granted` and automatic processing `true`; Not now sets automatic processing `false` but leaves consent `unknown` so **Process now** can ask later.

- [ ] **Step 6: Update pasted-text routing**

`TextCaptureForm` uses the same settings and routes to `/capture/{id}`. If automatic+granted, start processing without awaiting it.

- [ ] **Step 7: Test the primary interaction**

Required assertions:

- idle screen contains exactly one primary Record control;
- active screen contains timer and Stop & save but no transcript or idea text;
- stop awaits local service before `router.push`;
- provider/processing is not called before local save resolves;
- failed local save preserves the draft and exposes **Retry save**;
- successful auto-enabled save calls processing after navigation data is available;
- cloud consent copy names OpenAI and local browser storage accurately.

- [ ] **Step 8: Run and commit**

```powershell
npx vitest run src/features/recorder/HomeScreen.test.tsx src/features/recorder/RecorderPanel.test.tsx src/features/recorder/TextCaptureForm.test.tsx
git add src/features/recorder src/hooks
git commit -m "feat: make mobile recording save in one action"
```

### Task 3: Build capture detail, processing status, and recovery

**Files:**
- Create: `src/app/capture/[captureId]/page.tsx`
- Create: `src/features/capture/CaptureDetailScreen.tsx`
- Create: `src/features/capture/ProcessingTimeline.tsx`
- Create: `src/features/capture/ProcessCaptureButton.tsx`
- Create: `src/features/capture/CaptureDetailScreen.test.tsx`
- Modify: `src/app/idea/[ideaId]/page.tsx`
- Modify: `src/components/AudioPlayer.tsx`

**Interfaces:**
- Consumes: capture, recording, transcript repositories and ProcessingService
- Produces: user-visible processing lifecycle and consent/retry controls

- [ ] **Step 1: Create the route and legacy redirect**

`/capture/[captureId]` renders `CaptureDetailScreen`. Replace the old `/idea/[ideaId]` page with:

```ts
import { redirect } from 'next/navigation';

export default async function LegacyIdeaPage({ params }: { params: Promise<{ ideaId: string }> }) {
  const { ideaId } = await params;
  redirect(`/capture/${ideaId}`);
}
```

Sprint 4 uses `/ideas/[ideaId]` for actual idea detail.

- [ ] **Step 2: Render the durable source first**

Load capture, recording, and current transcript. Render:

- **Recording saved** for every persisted capture;
- date, duration, and audio playback when audio exists;
- typed-source label when no audio exists;
- the processing timeline;
- editable transcript only after it exists;
- a truthful cloud-processing disclosure near Process/Retry.

If capture is missing, show **Capture not found** and a link to Capture.

- [ ] **Step 3: Map detailed states to the four-step timeline**

```ts
const visibleStages = [
  { label: 'Saved', states: ['saved', 'queued'] },
  { label: 'Transcribing', states: ['transcribing'] },
  { label: 'Organizing', states: ['transcript_ready', 'segmenting', 'organizing'] },
  { label: 'Ready for review', states: ['ready_for_review', 'partially_confirmed', 'confirmed'] },
] as const;
```

Use text/icon/current-state semantics, not color alone. Reduced motion renders static progress; default motion may use the approved waveform-to-faceted-node transformation.

- [ ] **Step 4: Implement Process, Retry, and consent**

`ProcessCaptureButton` behavior:

- consent `unknown` or `denied`: open `ConsentSheet` naming audio/transcript, OpenAI, and organization purpose;
- confirm: set consent `granted`, optionally set automatic preference, enqueue and call `ProcessingService.process`;
- consent granted: call process directly;
- failed retryable: label **Retry**;
- processing: disabled with current stage label;
- offline: label **Waiting for connection** and remain queued.

- [ ] **Step 5: Poll only while active and redirect on first ready open**

While state is processing, refresh repository state every 1000 ms and on visibility change. Clear timers on unmount. When state becomes `ready_for_review`, call:

```ts
router.replace(`/review/${capture.id}`);
```

If the URL contains `?stay=1`, show **Review ideas** instead of redirecting; this supports returning to the source later.

- [ ] **Step 6: Save transcript edits as new versions**

**Save transcript edit** calls `transcriptRepository.updateText`, sets capture to `transcript_ready`, and marks existing drafts stale through `ReviewService.reprocess` only after the user selects **Save and reprocess**. Do not silently replace confirmed ideas.

- [ ] **Step 7: Test state and recovery copy**

Cover saved/manual, queued/offline, transcribing, organizing, ready redirect, retryable failure, consent-required failure, transcript edit, and missing capture. Assert every error says the recording/transcript remains saved when true.

- [ ] **Step 8: Run and commit**

```powershell
npx vitest run src/features/capture/CaptureDetailScreen.test.tsx
git add src/app/capture src/app/idea src/features/capture src/components/AudioPlayer.tsx
git commit -m "feat: show resumable capture processing"
```

### Task 4: Build reusable grounded-field review components

**Files:**
- Create: `src/features/review/GroundedFieldEditor.tsx`
- Create: `src/features/review/ProvenanceBadge.tsx`
- Create: `src/features/review/SourceExcerpt.tsx`
- Create: `src/features/review/TagEditor.tsx`
- Create: `src/features/review/IdeaCandidateForm.tsx`
- Create: `src/features/review/IdeaCandidateForm.test.tsx`
- Remove: `src/features/review/PresetSelector.tsx`

**Interfaces:**
- Produces: controlled `IdeaDraftFormValue` used by ReviewScreen

- [ ] **Step 1: Define the controlled form value**

```ts
export interface IdeaDraftFormValue {
  title: string;
  summary: GroundedText;
  purpose?: GroundedText;
  goals: GroundedText[];
  problem?: Idea['problem'];
  blockers: GroundedText[];
  questions: GroundedText[];
  suggestedActions: GroundedText[];
  acceptedActionSuggestionIds: string[];
  research: Idea['research'];
  categoryId: string;
  tagNames: string[];
}
```

`IdeaCandidateForm` receives `idea`, `categories`, `tags`, `value`, `onChange`, `onConfirm`, `onDiscard`, `busy`.

- [ ] **Step 2: Render provenance consistently**

`ProvenanceBadge` displays **Explicit**, **Inferred**, or **Suggested** plus screen-reader explanation. Never allow basis editing in the MVP; users edit or delete content instead.

- [ ] **Step 3: Build source excerpts**

`SourceExcerpt` takes `GroundedText` and `idea.sourceSpans`, resolves IDs, and renders exact quotes in an expandable `<details>` element. When basis is explicit and no source resolves, render a blocking validation error rather than hiding it.

- [ ] **Step 4: Build rich sections with progressive disclosure**

Always show title, summary, category, and tags. Render Goal, Problem, Blockers, Questions, Research needed, and Suggested actions as ruled sections. Empty optional sections show **Add** rather than a blank card. Suggested actions use checkboxes keyed by stable grounded IDs.

- [ ] **Step 5: Implement tag editing**

Support add on Enter/comma, remove, case-insensitive duplicate prevention, six-tag maximum, and suggestions from existing tags. Preserve unsaved text if confirm fails.

- [ ] **Step 6: Test editing and grounding**

Required cases:

- title, summary, category, and tags update controlled value;
- explicit source expands to exact quote;
- inferred field may have no quote;
- duplicate tag is ignored;
- action checkbox toggles stable suggestion ID;
- missing category blocks confirmation;
- Discard requires confirmation but does not delete on Cancel.

- [ ] **Step 7: Run and commit**

```powershell
npx vitest run src/features/review/IdeaCandidateForm.test.tsx
git add src/features/review
git commit -m "feat: add editable grounded idea form"
```

### Task 5: Replace legacy review with multi-idea confirmation

**Files:**
- Rewrite: `src/features/review/ReviewScreen.tsx`
- Create: `src/features/review/ReviewScreen.test.tsx`
- Modify: `src/app/review/[ideaId]/page.tsx`
- Create: `src/features/library/ConfirmedIdeasPreview.tsx`
- Modify: `src/app/ideas/page.tsx`

**Interfaces:**
- Consumes: `ReviewService.load`, `confirm`, `discard`, category/tag repositories
- Produces: sequential and confirm-all review of every draft from one capture

- [ ] **Step 1: Change the route parameter semantics**

The filesystem may remain `[ideaId]` to avoid a risky move, but immediately rename the local variable to `captureId` and pass it to `ReviewScreen`. Prefer renaming the directory to `[captureId]` in the same commit if no external imports rely on the route parameter name; the URL remains `/review/{captureId}`.

- [ ] **Step 2: Load the review snapshot**

Render:

- **N ideas found**;
- position **1 of N**;
- current candidate form;
- previous/next controls;
- **Confirm**, **Discard idea**, and **Confirm all ready ideas**;
- link to the source capture with `?stay=1`.

If zero ideas were found, render **No clear ideas found** with transcript edit/reprocess and back-to-capture actions.

- [ ] **Step 3: Keep independent draft state**

Initialize a `Map<ideaId, IdeaDraftFormValue>`. Switching candidates must not reset edits. Mark a candidate ready when title, summary, category, and tag constraints validate.

- [ ] **Step 4: Confirm one candidate transactionally**

On confirm:

1. resolve tag names with `tagRepository.findOrCreate`;
2. call `ReviewService.confirm` with edited fields and accepted action IDs;
3. remove the confirmed candidate from pending state;
4. announce **Idea added to your library**;
5. advance to the next draft.

If persistence fails, keep all local form edits and display a retry action.

- [ ] **Step 5: Confirm all ready candidates sequentially**

Use a simple `for...of`, not `Promise.all`, so a failure identifies the exact candidate and previously confirmed records remain truthful. Stop on first failure and announce how many succeeded.

- [ ] **Step 6: Provide a minimal Ideas destination**

Until Sprint 4 builds search/filter, `ConfirmedIdeasPreview` lists confirmed title, category name, summary, and source link. It must prove confirmation creates independent records and give Sprint 3 an honest destination.

- [ ] **Step 7: Test multiple ideas and duplicate-safe confirmation**

Required flow:

```ts
expect(screen.getByRole('heading', { name: '3 ideas found' })).toBeInTheDocument();
// edit first, move next/back, assert edit remains
// confirm first, assert one library record
// confirm remaining ready ideas, assert three independent records
// repeat confirm call, assert accepted action count is unchanged
```

Also cover discard, no-idea state, missing capture, and one failed confirmation preserving edits.

- [ ] **Step 8: Run and commit**

```powershell
npx vitest run src/features/review/ReviewScreen.test.tsx src/features/review/IdeaCandidateForm.test.tsx
git add src/features/review src/app/review src/features/library/ConfirmedIdeasPreview.tsx src/app/ideas/page.tsx
git commit -m "feat: confirm multiple ideas from one capture"
```

### Task 6: Verify the complete mobile capture-to-confirmation flow

**Files:**
- Modify: `docs/hackathon/BUILD_WEEK_EVIDENCE.md`
- Create: `docs/qa/sprint-3-mobile-checklist.md`

**Interfaces:**
- Produces: manual proof and documented defects before downstream library work

- [ ] **Step 1: Run the full automated gate**

```powershell
npm test
npm run typecheck
npm run lint
npm run build
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 2: Start the app on the LAN**

```powershell
npm run dev -- --hostname 0.0.0.0
```

Open the HTTPS-capable deployed preview on a phone for microphone testing; a plain LAN HTTP origin may not expose `getUserMedia`.

- [ ] **Step 3: Execute the mobile checklist**

Document pass/fail for:

- first-open recording without login;
- microphone denied recovery;
- 30-second recording, Stop & save, and immediate refresh;
- local playback after refresh;
- automatic processing with consent;
- manual Process now with consent;
- app hidden during processing and resumed when visible;
- multi-idea review and independent editing;
- source excerpt accuracy;
- discard one and confirm two;
- repeated confirm does not duplicate actions;
- keyboard focus and screen-reader labels;
- reduced-motion state.

- [ ] **Step 4: Capture evidence**

Save screenshots for Capture idle, active recording, processing, and three-idea confirmation under `docs/hackathon/evidence/sprint-3/`. Do not include real private transcripts or API keys.

- [ ] **Step 5: Fill evidence and commit**

Update Sprint 3's evidence row with commit hashes, automated results, phone/browser, checklist path, and screenshot paths.

```powershell
git add docs/qa/sprint-3-mobile-checklist.md docs/hackathon/BUILD_WEEK_EVIDENCE.md docs/hackathon/evidence/sprint-3
git commit -m "docs: verify mobile capture and review flow"
git status --short --branch
```

## Sprint 3 exit checklist

- [ ] Home prioritizes one-tap recording.
- [ ] Active recording contains no post-processing content.
- [ ] Stop & save is one action and persists before navigation.
- [ ] Saved capture survives refresh and processing failure.
- [ ] Automatic, manual, offline, and retry states are understandable.
- [ ] Ready capture opens multi-idea review on first visit.
- [ ] Every idea field, category, and tags are editable.
- [ ] Provenance and source excerpts are visible.
- [ ] Multiple ideas confirm independently; discards and failures preserve other work.
- [ ] A real phone completes capture through confirmation.
- [ ] Full `npm run check` passes.
- [ ] Sprint 3 evidence row is complete.
