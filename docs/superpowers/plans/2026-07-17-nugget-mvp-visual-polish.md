# Nugget MVP Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved Editorial Utility polish to Nugget’s demo-critical mobile flow without changing its local-first data model, GPT processing, grounding, privacy, or recovery behavior.

**Architecture:** Keep the current Next.js client screens and repository/service boundaries. Add one isolated continuous-waveform component, one isolated local library-view preference, and one read-only idea-summary component; integrate them through existing screens while keeping mutation logic in its current owners. Add scoped presentation classes to `globals.css` rather than introducing a second styling framework or broad component rewrite.

**Tech Stack:** Next.js 16.2.9 App Router, React 19.2.7, TypeScript 5.9.3, Tailwind CSS 3.4 plus scoped CSS, Vitest 4.0, Testing Library, Playwright 1.61, IndexedDB/Dexie local persistence.

## Global Constraints

- Read `AGENTS.md`, `docs/design/NUGGET_MVP_DESIGN_AGENT_BRIEF.md`, and `docs/superpowers/specs/2026-07-17-nugget-visual-polish-design.md` before editing.
- Load `frontend-design:frontend-design` before UI implementation and preserve the approved **Editorial Utility** direction.
- Use one write-enabled `terra-worker` at a time. Terra stages only assigned files and creates one verified commit per task.
- Sol inspects every Terra diff and reruns the task verification before accepting the commit.
- Use focused risk-based tests for behavioral changes. CSS-only changes require existing regression tests plus browser evidence; do not expand this into blanket TDD.
- Do not change API routes, GPT prompts, extraction schemas, database entities, consent rules, privacy-safe analytics, export payloads, or processing sequencing.
- Do not weaken transcript grounding, provenance, duplicate prevention, privacy language, destructive confirmations, or error-recovery copy.
- Treat transcripts, titles, tags, and all user-generated strings as untrusted text. Do not add `dangerouslySetInnerHTML`.
- Keep Manrope for the interface, Fraunces for the Nugget wordmark, and IBM Plex Mono for short metadata only.
- Keep only **Capture**, **Ideas**, and **Actions** in bottom navigation. Keep Settings in the header gear.
- Preserve 48-pixel touch targets, visible focus, WCAG AA contrast, safe-area padding, reduced-motion support, and non-color state labels.
- Preserve the user-owned untracked `docs/hackathon/demo-video-draft/` directory.
- Do not add a dependency unless Sol approves it after reviewing why the platform and existing packages cannot meet the requirement.
- Push after every two verified commits or at a completed sprint gate, whichever comes first.

---

## File structure and ownership map

### New focused files

- `src/features/recorder/ContinuousWaveform.tsx`: converts recent normalized microphone levels into one SVG line.
- `src/features/recorder/ContinuousWaveform.test.tsx`: verifies baseline, level history, clamping, and reset behavior.
- `src/features/library/libraryViewPreference.ts`: validates and persists the local `cards | compact` library preference.
- `src/features/library/libraryViewPreference.test.ts`: verifies default, invalid-value recovery, read, and write behavior.
- `src/features/library/LibraryViewToggle.tsx`: accessible Cards/Compact segmented control.
- `src/features/library/IdeaSummaryView.tsx`: read-only summary-first presentation for a confirmed idea.
- `src/features/library/IdeaSummaryView.test.tsx`: verifies organized sections, provenance, empty-field omission, and the Edit action.
- `docs/hackathon/evidence/visual-polish/`: final mobile and desktop verification screenshots only.

### Existing files changed by responsibility

- `src/features/recorder/RecorderPanel.tsx`: integrates the concave microphone control and continuous waveform without changing save/processing sequencing.
- `src/features/recorder/RecorderPanel.test.tsx`: protects the recording and local-save behavior while asserting the new semantics.
- `src/features/review/ReviewScreen.tsx`: makes the active organized idea primary and adds a collapsed source drawer.
- `src/features/review/ReviewScreen.test.tsx`: verifies source grounding remains visible and safe.
- `src/features/review/IdeaCandidateForm.tsx`: groups the existing editable fields into the approved scannable sections.
- `src/features/review/IdeaCandidateForm.test.tsx`: verifies new hierarchy without changing validation.
- `src/features/library/IdeaLibraryScreen.tsx`: owns the remembered presentation mode while preserving URL-backed filters.
- `src/features/library/IdeaLibraryRow.tsx`: renders card or compact presentation from the same `LibraryRow`.
- `src/features/library/IdeaLibraryScreen.test.tsx`: verifies mode persistence and filter continuity.
- `src/features/library/IdeaDetailScreen.tsx`: switches between summary-first reading and the existing full editor.
- `src/features/library/IdeaDetailScreen.test.tsx`: verifies read/edit/cancel/save transitions and existing utilities.
- `src/features/actions/ActionsScreen.tsx`, `src/features/actions/ActionRow.tsx`: presentation-only alignment.
- `src/features/settings/SettingsScreen.tsx`: presentation-only grouping with exact trust copy preserved.
- `src/app/globals.css`: scoped visual treatments, responsive rules, and reduced-motion behavior.
- `docs/hackathon/FINAL_VERIFICATION.md`: final check results and deployment evidence.

---

### Task 1: Concave capture control and continuous waveform

**Files:**

- Create: `src/features/recorder/ContinuousWaveform.tsx`
- Create: `src/features/recorder/ContinuousWaveform.test.tsx`
- Modify: `src/features/recorder/RecorderPanel.tsx`
- Modify: `src/features/recorder/RecorderPanel.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**

- Consumes: normalized live `level: number` already returned by `useRecorder()` and `active: boolean` from recorder state.
- Produces: `ContinuousWaveform({ level, active, sampleCount? }): React.ReactElement` with `data-testid="continuous-waveform"`; accessibility remains on the containing `role="meter"` in `RecorderPanel`.
- Does not change: `useRecorder`, `BrowserRecorderService`, `CaptureService.saveRecording`, or `ProcessingService.process` signatures.

- [ ] **Step 1: Add focused waveform tests**

Create `src/features/recorder/ContinuousWaveform.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ContinuousWaveform } from './ContinuousWaveform';

describe('ContinuousWaveform', () => {
  it('renders a flat baseline while inactive', () => {
    render(<ContinuousWaveform active={false} level={0.8} sampleCount={5} />);
    expect(screen.getByTestId('continuous-waveform-line')).toHaveAttribute(
      'points',
      '0,20 25,20 50,20 75,20 100,20',
    );
  });

  it('adds clamped live levels to one continuous line and resets when inactive', () => {
    const view = render(<ContinuousWaveform active level={0.25} sampleCount={5} />);
    const first = screen.getByTestId('continuous-waveform-line').getAttribute('points');
    view.rerender(<ContinuousWaveform active level={2} sampleCount={5} />);
    const second = screen.getByTestId('continuous-waveform-line').getAttribute('points');
    expect(second).not.toBe(first);
    expect(second).not.toContain('NaN');

    view.rerender(<ContinuousWaveform active={false} level={0} sampleCount={5} />);
    expect(screen.getByTestId('continuous-waveform-line')).toHaveAttribute(
      'points',
      '0,20 25,20 50,20 75,20 100,20',
    );
  });
});
```

- [ ] **Step 2: Run the new test and confirm the missing-component failure**

Run:

```powershell
npm test -- src/features/recorder/ContinuousWaveform.test.tsx
```

Expected: FAIL because `./ContinuousWaveform` does not exist.

- [ ] **Step 3: Implement the isolated waveform**

Create `src/features/recorder/ContinuousWaveform.tsx`:

```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

export interface ContinuousWaveformProps {
  level: number;
  active: boolean;
  sampleCount?: number;
}

const WIDTH = 100;
const HEIGHT = 40;
const CENTER = HEIGHT / 2;
const AMPLITUDE = 15;

function clampLevel(level: number) {
  return Number.isFinite(level) ? Math.min(1, Math.max(0, level)) : 0;
}

function emptySamples(sampleCount: number) {
  return Array.from({ length: sampleCount }, () => 0);
}

export function ContinuousWaveform({
  level,
  active,
  sampleCount = 48,
}: ContinuousWaveformProps) {
  const count = Math.max(2, Math.round(sampleCount));
  const [samples, setSamples] = useState<number[]>(() => emptySamples(count));

  useEffect(() => {
    if (!active) {
      setSamples(emptySamples(count));
      return;
    }
    setSamples((current) => {
      const normalized = current.length === count ? current : emptySamples(count);
      return [...normalized.slice(1), clampLevel(level)];
    });
  }, [active, count, level]);

  const points = useMemo(
    () => samples.map((sample, index) => {
      const x = (index / (samples.length - 1)) * WIDTH;
      const direction = index % 2 === 0 ? -1 : 1;
      const y = CENTER + direction * sample * AMPLITUDE;
      return `${Number(x.toFixed(2))},${Number(y.toFixed(2))}`;
    }).join(' '),
    [samples],
  );

  return (
    <svg
      aria-hidden="true"
      className="continuous-waveform"
      data-testid="continuous-waveform"
      preserveAspectRatio="none"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
    >
      <line className="continuous-waveform__baseline" x1="0" x2={WIDTH} y1={CENTER} y2={CENTER} />
      <polyline
        className="continuous-waveform__line"
        data-testid="continuous-waveform-line"
        points={points}
      />
    </svg>
  );
}
```

- [ ] **Step 4: Run the component test**

Run:

```powershell
npm test -- src/features/recorder/ContinuousWaveform.test.tsx
```

Expected: 2 tests PASS.

- [ ] **Step 5: Extend RecorderPanel tests for the approved presentation**

Add assertions to `src/features/recorder/RecorderPanel.test.tsx`:

```tsx
it('shows the sculpted microphone control and quiet idle waveform', () => {
  render(<RecorderPanel />);
  const record = screen.getByRole('button', { name: 'Record' });
  expect(record.querySelector('svg')).not.toBeNull();
  expect(screen.getByText('Ready when you are')).toBeInTheDocument();
  expect(screen.getByTestId('continuous-waveform')).toBeInTheDocument();
});
```

In the existing active-recording test, add:

```tsx
expect(screen.getByTestId('continuous-waveform')).toBeInTheDocument();
expect(screen.queryByTestId('waveform-bar')).not.toBeInTheDocument();
```

- [ ] **Step 6: Integrate the microphone glyph and waveform without touching persistence order**

In `src/features/recorder/RecorderPanel.tsx`:

1. Import `ContinuousWaveform`.
2. Replace the 13 generated bar `<span>` elements in the active `role="meter"` with:

```tsx
<ContinuousWaveform active level={recorder.level} />
```

3. Replace the idle dot icon with the following SVG inside the existing `aria-label="Record"` button:

```tsx
<svg aria-hidden="true" className="record-button__microphone" fill="none" viewBox="0 0 48 48">
  <rect height="23" rx="7" stroke="currentColor" strokeWidth="3" width="14" x="17" y="7" />
  <path d="M11 23c0 8 5 13 13 13s13-5 13-13M24 36v6M17 42h14" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
</svg>
```

4. Immediately below the idle record button, render:

```tsx
<div className="capture-audio-status" aria-label="Microphone ready">
  <div className="capture-audio-status__heading">
    <strong>Ready when you are</strong>
    <span>Saved locally first</span>
  </div>
  <ContinuousWaveform active={false} level={0} />
</div>
```

Do not move or rewrite `persistDraft`, `stopAndSave`, the router transition, the automatic-processing consent check, or the offline branch.

- [ ] **Step 7: Apply the approved concave and line treatments**

In `src/app/globals.css`, update the existing record/waveform selectors and add scoped status styles. The critical properties are:

```css
.record-button {
  background: radial-gradient(circle at 48% 58%, #e3a008 0%, #f4b622 46%, #ffd86d 76%, #f2b326 100%);
  border: 1px solid #d99308;
  box-shadow:
    inset 0 10px 18px rgb(255 255 255 / 0.72),
    inset 0 -14px 22px rgb(143 78 0 / 0.28),
    0 14px 30px rgb(174 105 0 / 0.2),
    0 0 0 8px rgb(229 161 26 / 0.08);
}

.record-button__microphone {
  width: 2.5rem;
  height: 2.5rem;
}

.continuous-waveform {
  display: block;
  width: 100%;
  height: 2.75rem;
  overflow: visible;
}

.continuous-waveform__baseline {
  stroke: var(--line);
  stroke-width: 1;
}

.continuous-waveform__line {
  fill: none;
  stroke: var(--accent-strong);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
  transition: points 120ms linear;
}

.capture-audio-status {
  width: min(100%, 30rem);
  margin-inline: auto;
  padding: 0.875rem 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: rgb(255 255 255 / 0.7);
}
```

Under `@media (prefers-reduced-motion: reduce)`, disable the line transition.

- [ ] **Step 8: Run focused capture verification**

Run:

```powershell
npm test -- src/features/recorder/ContinuousWaveform.test.tsx src/features/recorder/RecorderPanel.test.tsx src/features/recorder/HomeScreen.test.tsx
npm run typecheck
npm run lint
```

Expected: all named test files PASS; typecheck and lint exit 0.

- [ ] **Step 9: Commit Task 1**

```powershell
git add -- src/features/recorder/ContinuousWaveform.tsx src/features/recorder/ContinuousWaveform.test.tsx src/features/recorder/RecorderPanel.tsx src/features/recorder/RecorderPanel.test.tsx src/app/globals.css
git commit -m "feat: polish mobile capture feedback"
```

---

### Task 2: Nugget-first confirmation hierarchy

**Files:**

- Modify: `src/features/review/ReviewScreen.tsx`
- Modify: `src/features/review/ReviewScreen.test.tsx`
- Modify: `src/features/review/IdeaCandidateForm.tsx`
- Modify: `src/features/review/IdeaCandidateForm.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**

- Consumes: existing controlled `IdeaDraftFormValue`, validation, source spans, provenance, and review callbacks.
- Produces: visual groups named **Why it matters**, **What’s in the way**, and **Next actions**, plus a collapsed `Source transcript` drawer.
- Does not change: `confirmationInput`, `ReviewService.confirm`, accepted action IDs, discard semantics, or validation signatures.

- [ ] **Step 1: Add hierarchy and source-grounding assertions**

In `src/features/review/IdeaCandidateForm.test.tsx`, add:

```tsx
it('groups the editable organization into the approved nugget-first hierarchy', () => {
  render(<Harness />);
  expect(screen.getByRole('heading', { name: 'Why it matters' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: "What's in the way" })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Next actions' })).toBeInTheDocument();
  expect(screen.getByLabelText('Title')).toHaveValue('Create a neighborhood tool-sharing library');
  expect(screen.getByLabelText('Summary')).toHaveValue('Neighbors could share rarely used tools.');
});
```

In `src/features/review/ReviewScreen.test.tsx`, use its existing successful review fixture and add:

```tsx
it('keeps the full source transcript collapsed beneath the active organized idea', async () => {
  render(<ReviewScreen captureId="capture-1" />);
  const source = await screen.findByText('Source transcript');
  const drawer = source.closest('details');
  expect(drawer).not.toHaveAttribute('open');
  expect(within(drawer!).getByText('Three separate ideas in one untrusted transcript.')).toBeInTheDocument();
});
```

Import `within` from Testing Library if the test file does not already import it.

- [ ] **Step 2: Run the review tests and confirm the new assertions fail**

Run:

```powershell
npm test -- src/features/review/IdeaCandidateForm.test.tsx src/features/review/ReviewScreen.test.tsx
```

Expected: existing tests pass; the new group-heading and source-drawer assertions FAIL.

- [ ] **Step 3: Add a semantic group component**

In `src/features/review/IdeaCandidateForm.tsx`, change `RuledSection` to render an `h3`, then add:

```tsx
function IdeaSectionGroup({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="idea-form__group">
      <header className="idea-form__group-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      <div className="idea-form__group-content">{children}</div>
    </section>
  );
}
```

- [ ] **Step 4: Group the existing fields without rewriting their controls**

In `IdeaCandidateForm`:

1. Open this wrapper immediately before the existing `Purpose` `RuledSection`, and close it immediately after the existing `Problem` `RuledSection`:

```tsx
<IdeaSectionGroup
  description="The purpose, goals, and problem this idea is trying to address."
  title="Why it matters"
>
```

2. Open this wrapper immediately before the existing blockers/questions mapped sections, and close it immediately after the existing `Research needed` `RuledSection`:

```tsx
<IdeaSectionGroup
  description="Blockers, unanswered questions, and research that may shape the next move."
  title="What's in the way"
>
```

3. Wrap the existing `Suggested actions` `RuledSection` with:

```tsx
<IdeaSectionGroup
  description="Choose which proposed steps should become trackable actions when you confirm."
  title="Next actions"
>
```

Keep every existing input, `GroundedFieldEditor`, `TagEditor`, provenance badge, source excerpt, add/remove button, action-acceptance checkbox, validation message, and ID unchanged.

- [ ] **Step 5: Add the collapsed full-source drawer after the active form**

In `src/features/review/ReviewScreen.tsx`, immediately after `IdeaCandidateForm`, render:

```tsx
<details className="review-source-drawer">
  <summary>Source transcript</summary>
  <p className="review-source-drawer__meta metadata">
    Transcript version {snapshot.transcript.version}
  </p>
  <blockquote>{snapshot.transcript.text}</blockquote>
  <Link className="review-source-link" href={sourceHref}>Open source capture</Link>
</details>
```

Render `snapshot.transcript.text` as a React text node. Do not interpolate it into HTML or attributes.

- [ ] **Step 6: Apply the scannable section treatment**

Add scoped rules to `src/app/globals.css`:

```css
.idea-form__group {
  border-top: 1px solid var(--line);
  padding-block: 1.5rem;
}

.idea-form__group-heading {
  margin-bottom: 1rem;
}

.idea-form__group-heading h2 {
  margin: 0;
  color: var(--ink);
  font-size: 1.2rem;
  line-height: 1.25;
}

.idea-form__group-heading p {
  max-width: 42rem;
  margin: 0.35rem 0 0;
  color: var(--muted);
  line-height: 1.55;
}

.idea-form__group-content > .idea-form__section {
  border-top: 1px solid color-mix(in srgb, var(--line) 70%, transparent);
  padding-block: 1rem;
}

.review-source-drawer {
  margin-top: 1rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  padding: 0.25rem 1rem 1rem;
}

.review-source-drawer summary {
  min-height: 48px;
  display: flex;
  align-items: center;
  cursor: pointer;
  color: var(--ink);
  font-weight: 800;
}

.review-source-drawer blockquote {
  margin: 0.75rem 0;
  white-space: pre-wrap;
  color: var(--muted);
  line-height: 1.6;
}
```

- [ ] **Step 7: Run focused review verification**

Run:

```powershell
npm test -- src/features/review/IdeaCandidateForm.test.tsx src/features/review/ReviewScreen.test.tsx
npm run typecheck
npm run lint
```

Expected: both review test files PASS; typecheck and lint exit 0.

- [ ] **Step 8: Commit Task 2**

```powershell
git add -- src/features/review/ReviewScreen.tsx src/features/review/ReviewScreen.test.tsx src/features/review/IdeaCandidateForm.tsx src/features/review/IdeaCandidateForm.test.tsx src/app/globals.css
git commit -m "feat: foreground organized idea review"
```

---

### Task 3: Balanced Cards library with remembered Compact view

**Files:**

- Create: `src/features/library/libraryViewPreference.ts`
- Create: `src/features/library/libraryViewPreference.test.ts`
- Create: `src/features/library/LibraryViewToggle.tsx`
- Modify: `src/features/library/IdeaLibraryScreen.tsx`
- Modify: `src/features/library/IdeaLibraryRow.tsx`
- Modify: `src/features/library/IdeaLibraryScreen.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**

- Produces: `export type IdeaLibraryView = 'cards' | 'compact'`.
- Produces: `readLibraryView(storage?): IdeaLibraryView` and `writeLibraryView(view, storage?): void`.
- Produces: `LibraryViewToggle({ value, onChange, disabled? })` with two `aria-pressed` buttons.
- Changes: `IdeaLibraryRow({ row, view? })`, where `view` defaults to `'cards'`.
- Does not change: URL filter query generation, `LibraryService.search`, result ordering, or row links.

- [ ] **Step 1: Add preference tests**

Create `src/features/library/libraryViewPreference.test.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { readLibraryView, writeLibraryView } from './libraryViewPreference';

describe('library view preference', () => {
  beforeEach(() => localStorage.clear());

  it('defaults invalid or missing values to cards', () => {
    expect(readLibraryView(localStorage)).toBe('cards');
    localStorage.setItem('nugget:ideas:view', 'tiles');
    expect(readLibraryView(localStorage)).toBe('cards');
  });

  it('round-trips the compact preference locally', () => {
    writeLibraryView('compact', localStorage);
    expect(readLibraryView(localStorage)).toBe('compact');
    expect(localStorage.getItem('nugget:ideas:view')).toBe('compact');
  });
});
```

- [ ] **Step 2: Run the preference test and confirm the missing-module failure**

```powershell
npm test -- src/features/library/libraryViewPreference.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement validated local preference access**

Create `src/features/library/libraryViewPreference.ts`:

```ts
export type IdeaLibraryView = 'cards' | 'compact';

export const IDEA_LIBRARY_VIEW_KEY = 'nugget:ideas:view';

type StorageReader = Pick<Storage, 'getItem'>;
type StorageWriter = Pick<Storage, 'setItem'>;

export function readLibraryView(
  storage: StorageReader | undefined = typeof window === 'undefined' ? undefined : window.localStorage,
): IdeaLibraryView {
  try {
    return storage?.getItem(IDEA_LIBRARY_VIEW_KEY) === 'compact' ? 'compact' : 'cards';
  } catch {
    return 'cards';
  }
}

export function writeLibraryView(
  view: IdeaLibraryView,
  storage: StorageWriter | undefined = typeof window === 'undefined' ? undefined : window.localStorage,
) {
  try {
    storage?.setItem(IDEA_LIBRARY_VIEW_KEY, view);
  } catch {
    // Presentation preference failure must never make the local idea library unavailable.
  }
}
```

- [ ] **Step 4: Create the accessible segmented control**

Create `src/features/library/LibraryViewToggle.tsx`:

```tsx
import type { IdeaLibraryView } from './libraryViewPreference';

export function LibraryViewToggle({
  value,
  onChange,
  disabled = false,
}: {
  value: IdeaLibraryView;
  onChange(view: IdeaLibraryView): void;
  disabled?: boolean;
}) {
  return (
    <div aria-label="Idea display" className="library-view-toggle" role="group">
      <button aria-pressed={value === 'cards'} disabled={disabled} onClick={() => onChange('cards')} type="button">
        Cards
      </button>
      <button aria-pressed={value === 'compact'} disabled={disabled} onClick={() => onChange('compact')} type="button">
        Compact
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Add failing integration coverage to the library screen test**

In `src/features/library/IdeaLibraryScreen.test.tsx`, clear `localStorage` in `beforeEach`, then add:

```tsx
it('defaults to Cards and remembers Compact without changing the active filters', async () => {
  mocks.searchParams = new URLSearchParams('category=personal&tags=community');
  render(<IdeaLibraryScreen />);

  const cards = await screen.findByRole('button', { name: 'Cards' });
  const compact = screen.getByRole('button', { name: 'Compact' });
  expect(cards).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(compact);
  expect(compact).toHaveAttribute('aria-pressed', 'true');
  expect(localStorage.getItem('nugget:ideas:view')).toBe('compact');
  expect(mocks.replace).not.toHaveBeenCalledWith('/ideas', expect.anything());
  expect(mocks.search).toHaveBeenLastCalledWith(expect.objectContaining({
    categoryId: 'personal',
    tagIds: ['community'],
  }));
});

it('restores Compact from local storage', async () => {
  localStorage.setItem('nugget:ideas:view', 'compact');
  render(<IdeaLibraryScreen />);
  expect(await screen.findByRole('button', { name: 'Compact' })).toHaveAttribute('aria-pressed', 'true');
});
```

- [ ] **Step 6: Integrate view state without adding it to the URL**

In `IdeaLibraryScreen.tsx`:

```tsx
const [view, setView] = useState<IdeaLibraryView>('cards');

useEffect(() => {
  setView(readLibraryView());
}, []);

const changeView = useCallback((nextView: IdeaLibraryView) => {
  setView(nextView);
  writeLibraryView(nextView);
}, []);
```

Import `IdeaLibraryView`, `readLibraryView`, `writeLibraryView`, and `LibraryViewToggle`. Place the toggle in the library-results heading row, render it even for an empty library, and pass the selected view to every row:

```tsx
<LibraryViewToggle disabled={loading} onChange={changeView} value={view} />

<ul
  aria-label="Ideas"
  className={view === 'cards' ? 'idea-library idea-library--cards' : 'idea-library idea-library--compact'}
>
  {rows.map((row) => <IdeaLibraryRow key={row.idea.id} row={row} view={view} />)}
</ul>
```

Do not add `view` to `FilterState`, `canonicalFilterQuery`, `LibraryService.search`, or `router.replace`.

- [ ] **Step 7: Add the compact row variant**

Change `IdeaLibraryRow` to accept `view: IdeaLibraryView = 'cards'`. Before the existing card return, add this complete compact branch:

```tsx
if (view === 'compact') {
  return (
    <li>
      <Link
        className="idea-library-row idea-library-row--compact"
        href={`/ideas/${row.idea.id}`}
        style={{ borderLeftColor: edgeColor }}
      >
        <span className="idea-library-row__compact-main">
          <strong>{row.idea.title}</strong>
          <span>
            {row.category.name}
            {row.tags[0] ? ` · #${row.tags[0].name}` : ''}
            {` · ${dateFormatter.format(row.idea.updatedAt)}`}
          </span>
        </span>
        <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
          <path d="m9 5 7 7-7 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      </Link>
    </li>
  );
}
```

Keep the existing card branch’s title, summary, tags, blocker/research/action text indicators, sample label, date, and link unchanged.

- [ ] **Step 8: Add scoped view and responsive styles**

In `globals.css`:

```css
.library-view-toggle {
  display: inline-flex;
  gap: 0.2rem;
  padding: 0.2rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: #f3ece1;
}

.library-view-toggle button {
  min-height: 48px;
  border: 0;
  border-radius: 9px;
  padding-inline: 0.75rem;
  background: transparent;
  color: var(--muted);
  font-size: 0.8rem;
  font-weight: 800;
}

.library-view-toggle button[aria-pressed="true"] {
  background: var(--surface);
  color: var(--ink);
  box-shadow: 0 2px 8px rgb(16 29 54 / 0.1);
}

.idea-library {
  display: grid;
  gap: 1rem;
  padding: 0;
}

.idea-library-row--compact {
  min-height: 64px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid var(--line);
  border-left-width: 4px;
  padding: 0.75rem 1rem;
  background: var(--surface);
  color: var(--ink);
  text-decoration: none;
}

.idea-library-row__compact-main strong,
.idea-library-row__compact-main span {
  display: block;
}

.idea-library-row__compact-main span {
  margin-top: 0.25rem;
  color: var(--muted);
  font-size: 0.75rem;
}

@media (min-width: 56rem) {
  .idea-library--cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

At narrow widths, allow the heading row to wrap so the segmented control never compresses the result count below readability.

- [ ] **Step 9: Run focused library verification**

```powershell
npm test -- src/features/library/libraryViewPreference.test.ts src/features/library/IdeaLibraryScreen.test.tsx src/features/library/IdeaDetailScreen.route.test.tsx
npm run typecheck
npm run lint
```

Expected: all checks PASS and the existing URL/filter tests remain unchanged.

- [ ] **Step 10: Commit Task 3**

```powershell
git add -- src/features/library/libraryViewPreference.ts src/features/library/libraryViewPreference.test.ts src/features/library/LibraryViewToggle.tsx src/features/library/IdeaLibraryScreen.tsx src/features/library/IdeaLibraryRow.tsx src/features/library/IdeaLibraryScreen.test.tsx src/app/globals.css
git commit -m "feat: add compact idea library view"
```

---

### Task 4: Summary-first confirmed idea detail

**Files:**

- Create: `src/features/library/IdeaSummaryView.tsx`
- Create: `src/features/library/IdeaSummaryView.test.tsx`
- Modify: `src/features/library/IdeaDetailScreen.tsx`
- Modify: `src/features/library/IdeaDetailScreen.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**

- Produces: `IdeaSummaryView({ idea, category, tags, actions, onEdit, disabled })`.
- Consumes: canonical confirmed `Idea`, `Category`, `Tag[]`, and linked `ActionItem[]`; it does not accept a transcript or HTML.
- `IdeaDetailScreen` owns `editing: boolean`, resets the edit draft on cancel, and returns to reading mode only after a successful repository update.
- Does not change: `ideaRepository.update`, archive confirmation, copy/export payloads, source audio/transcript drawer, or route behavior.

- [ ] **Step 1: Add summary-view tests**

Create `src/features/library/IdeaSummaryView.test.tsx` using the existing idea fixture shape from `IdeaDetailScreen.test.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ActionItem, Category, Idea, Tag } from '@/types';
import { IdeaSummaryView } from './IdeaSummaryView';

describe('IdeaSummaryView', () => {
  it('renders organized sections, provenance, tags, actions, and Edit', () => {
    const onEdit = vi.fn();
    render(
      <IdeaSummaryView
        actions={[{ id: 'action-1', ideaId: 'idea-1', text: 'Draft a survey.', status: 'open', createdAt: 1, updatedAt: 1 } as ActionItem]}
        category={{ id: 'personal', name: 'Personal', normalizedName: 'personal' } as Category}
        disabled={false}
        idea={{
          id: 'idea-1',
          title: 'Create a neighborhood tool-sharing library',
          summary: { id: 'summary', text: 'Share rarely used tools.', basis: 'explicit', sourceSpanIds: ['span'] },
          purpose: { id: 'purpose', text: 'Reduce duplicate purchases.', basis: 'inferred', sourceSpanIds: [] },
          goals: [{ id: 'goal', text: 'Test with ten households.', basis: 'inferred', sourceSpanIds: [] }],
          blockers: [{ id: 'blocker', text: 'Need a host.', basis: 'inferred', sourceSpanIds: [] }],
          questions: [],
          suggestedActions: [],
          research: { needed: true, suggestedQueries: ['tool library software'], suggestedResourceTypes: ['Case studies'] },
          tagIds: ['community'],
        } as Idea}
        onEdit={onEdit}
        tags={[{ id: 'community', name: 'community', normalizedName: 'community', createdAt: 1 } as Tag]}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Why it matters' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: "What's in the way" })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Next actions' })).toBeInTheDocument();
    expect(screen.getByText('Explicit')).toBeInTheDocument();
    expect(screen.getByText('#community')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit idea' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the test and confirm the missing-component failure**

```powershell
npm test -- src/features/library/IdeaSummaryView.test.tsx
```

Expected: FAIL because `IdeaSummaryView` does not exist.

- [ ] **Step 3: Implement the summary-only component**

Create `src/features/library/IdeaSummaryView.tsx` with these exact responsibilities:

```tsx
import Link from 'next/link';
import { ProvenanceBadge } from '@/features/review/ProvenanceBadge';
import type { ActionItem, Category, GroundedText, Idea, Tag } from '@/types';

function GroundedLine({ value }: { value: GroundedText }) {
  return (
    <li className="idea-summary__line">
      <span>{value.text}</span>
      <ProvenanceBadge basis={value.basis} />
    </li>
  );
}

function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="idea-summary__section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function IdeaSummaryView({
  idea,
  category,
  tags,
  actions,
  onEdit,
  disabled,
}: {
  idea: Idea;
  category: Category;
  tags: Tag[];
  actions: ActionItem[];
  onEdit(): void;
  disabled: boolean;
}) {
  const why = [idea.purpose, ...idea.goals, idea.problem?.statement]
    .filter((value): value is GroundedText => Boolean(value));
  const obstacles = [...idea.blockers, ...idea.questions, idea.research.assessment]
    .filter((value): value is GroundedText => Boolean(value));

  return (
    <div className="idea-summary">
      <div className="idea-summary__heading">
        <div>
          <p className="idea-summary__category">{category.name}</p>
          <h1>{idea.title}</h1>
        </div>
        <button className="button-quiet" disabled={disabled} onClick={onEdit} type="button">Edit idea</button>
      </div>

      <div className="idea-summary__summary">
        <p>{idea.summary.text}</p>
        <ProvenanceBadge basis={idea.summary.basis} />
      </div>

      {tags.length ? <div aria-label="Tags" className="idea-summary__tags">{tags.map((tag) => <span key={tag.id}>#{tag.name}</span>)}</div> : null}

      {why.length ? (
        <SummarySection title="Why it matters">
          <ul>{why.map((value) => <GroundedLine key={value.id} value={value} />)}</ul>
        </SummarySection>
      ) : null}

      {obstacles.length || idea.research.needed ? (
        <SummarySection title="What's in the way">
          {obstacles.length ? <ul>{obstacles.map((value) => <GroundedLine key={value.id} value={value} />)}</ul> : null}
          {idea.research.suggestedQueries.length ? <p><strong>Suggested searches:</strong> {idea.research.suggestedQueries.join(' · ')}</p> : null}
          {idea.research.suggestedResourceTypes.length ? <p><strong>Resources:</strong> {idea.research.suggestedResourceTypes.join(' · ')}</p> : null}
        </SummarySection>
      ) : null}

      <SummarySection title="Next actions">
        {actions.length ? (
          <ul>{actions.map((action) => <li key={action.id}>{action.status === 'completed' ? '✓' : '○'} {action.text}</li>)}</ul>
        ) : <p>No linked actions yet.</p>}
        <Link href="/actions">Open Actions</Link>
      </SummarySection>
    </div>
  );
}
```

- [ ] **Step 4: Add read/edit transition assertions to IdeaDetailScreen**

Update the first two tests that currently search for form values so they first assert reading mode. Add:

```tsx
it('opens summary-first and supports edit, cancel, and successful save', async () => {
  render(<IdeaDetailScreen ideaId="idea-1" />);
  expect(await screen.findByRole('heading', { name: idea.title })).toBeInTheDocument();
  expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Edit idea' }));
  expect(screen.getByLabelText('Title')).toHaveValue(idea.title);
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Unsaved title' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cancel editing' }));
  expect(screen.getByRole('heading', { name: idea.title })).toBeInTheDocument();
  expect(screen.queryByDisplayValue('Unsaved title')).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Edit idea' }));
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Neighborhood lending pilot' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(await screen.findByRole('heading', { name: 'Neighborhood lending pilot' })).toBeInTheDocument();
  expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
});
```

Existing persistence, archive, copy, export, source, missing-idea, and sample tests must remain; enter edit mode at the start of tests that mutate fields.

- [ ] **Step 5: Integrate reading and editing modes in IdeaDetailScreen**

Add state and exact reset helpers:

```tsx
const [editing, setEditing] = useState(false);

function beginEditing() {
  if (!bundle || busy) return;
  setForm(initializeIdeaDraftFormValue(bundle.idea, bundle.allTags));
  setErrors({});
  setMutationError(null);
  setEditing(true);
}

function cancelEditing() {
  if (!bundle || busy) return;
  setForm(initializeIdeaDraftFormValue(bundle.idea, bundle.allTags));
  setErrors({});
  setMutationError(null);
  setEditing(false);
}
```

Set `editing` to `false` after a successful `load` and immediately after the successful `ideaRepository.update` branch in `saveChanges`.

Wrap the current editable header and form in an editing branch:

```tsx
{editing ? (
  <div className="idea-detail__editor">
```

Place the opening lines immediately before the current `<header className="pb-7">`. Place these closing lines immediately after the closing `</div>` for the current `className="idea-form"` editor:

```tsx
  </div>
) : (
  <IdeaSummaryView
    actions={bundle.actions}
    category={bundle.category}
    disabled={busy}
    idea={bundle.idea}
    onEdit={beginEditing}
    tags={bundle.tags}
  />
)}
```

The wrapped editor must retain the current title, summary, category, tags, purpose, goals, blockers, questions, problem, research, and suggested-action controls byte-for-byte except for indentation. Linked actions, source `<details>`, notices, errors, and utility actions stay after the conditional so they remain available in reading mode.

Keep the source `<details>` and utility actions outside the conditional. Render **Save changes** and **Cancel editing** only while editing:

```tsx
{editing ? (
  <>
    <button className="button-primary min-h-12" disabled={busy} onClick={() => void saveChanges()} type="button">
      {busy ? 'Saving…' : 'Save changes'}
    </button>
    <button className="button-quiet min-h-12" disabled={busy} onClick={cancelEditing} type="button">Cancel editing</button>
  </>
) : null}
```

Copy, Markdown export, JSON export, archive/restore, linked actions, and source controls remain accessible in reading mode.

- [ ] **Step 6: Apply summary-first presentation styles**

In `globals.css`, add:

```css
.idea-summary__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.idea-summary__heading h1 {
  max-width: 42rem;
  margin: 0.35rem 0 0;
  color: var(--ink);
  font-size: clamp(2rem, 8vw, 3rem);
  line-height: 1.05;
  letter-spacing: -0.045em;
}

.idea-summary__category {
  margin: 0;
  color: var(--success);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.idea-summary__summary {
  margin-top: 1rem;
  color: var(--muted);
  font-size: 1.05rem;
  line-height: 1.65;
}

.idea-summary__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.idea-summary__tags span {
  border-radius: 999px;
  padding: 0.35rem 0.65rem;
  background: #f6f0e6;
  color: #4f4c48;
  font-size: 0.75rem;
  font-weight: 700;
}

.idea-summary__section {
  margin-top: 1.5rem;
  border-top: 1px solid var(--line);
  padding-top: 1.25rem;
}

.idea-summary__section h2 {
  margin: 0 0 0.75rem;
  color: var(--ink);
  font-size: 1.2rem;
}

.idea-summary__line {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  border-top: 1px solid #efe6da;
  padding-block: 0.75rem;
  line-height: 1.5;
}
```

At mobile widths, allow `.idea-summary__heading` to wrap while keeping **Edit idea** at least 48 pixels high.

- [ ] **Step 7: Run focused detail verification**

```powershell
npm test -- src/features/library/IdeaSummaryView.test.tsx src/features/library/IdeaDetailScreen.test.tsx src/features/library/IdeaDetailScreen.route.test.tsx src/lib/export/ideaExport.test.ts
npm run typecheck
npm run lint
```

Expected: all checks PASS; export tests still prove the transcript is excluded.

- [ ] **Step 8: Commit Task 4**

```powershell
git add -- src/features/library/IdeaSummaryView.tsx src/features/library/IdeaSummaryView.test.tsx src/features/library/IdeaDetailScreen.tsx src/features/library/IdeaDetailScreen.test.tsx src/app/globals.css
git commit -m "feat: add summary-first idea detail"
```

---

### Task 5: Actions, Settings, and shared surface alignment

**Files:**

- Modify: `src/features/actions/ActionsScreen.tsx`
- Modify: `src/features/actions/ActionRow.tsx`
- Modify: `src/features/settings/SettingsScreen.tsx`
- Modify: `src/app/globals.css`
- Verify: `src/components/AppShell.tsx`
- Verify: `src/components/BottomNav.tsx`
- Test: `src/features/actions/ActionsScreen.test.tsx`
- Test: `src/features/settings/SettingsScreen.test.tsx`
- Test: `src/components/AppShell.test.tsx`

**Interfaces:**

- Presentation-only task. All repository calls, state transitions, confirmations, privacy copy, model evidence, and navigation targets remain unchanged.
- Produces shared classes `screen-heading`, `screen-heading__eyebrow`, `screen-heading__title`, `screen-heading__lede`, `utility-section`, and `danger-zone`.

- [ ] **Step 1: Establish a behavioral baseline before visual-only changes**

Run:

```powershell
npm test -- src/features/actions/ActionsScreen.test.tsx src/features/settings/SettingsScreen.test.tsx src/components/AppShell.test.tsx
```

Expected: all tests PASS before editing.

- [ ] **Step 2: Add shared heading and utility-section classes**

In `globals.css`:

```css
.screen-heading {
  max-width: 42rem;
}

.screen-heading__eyebrow {
  margin: 0;
  color: #8a5700;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.screen-heading__title {
  margin: 0.5rem 0 0;
  color: var(--ink);
  font-size: clamp(2.25rem, 10vw, 3.25rem);
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 1;
}

.screen-heading__lede {
  margin: 1rem 0 0;
  color: #5f5b56;
  line-height: 1.7;
}

.utility-section {
  border-top: 1px solid var(--line);
  padding-block: 1.5rem;
}

.danger-zone {
  margin-top: 0.5rem;
  border: 1px solid #e0b1a8;
  border-radius: var(--radius-sm);
  background: #fff5f3;
  padding: 1.25rem;
}
```

- [ ] **Step 3: Apply shared heading classes to Actions and Settings**

Replace only the header class strings in `ActionsScreen.tsx` and `SettingsScreen.tsx`:

```tsx
<header className="screen-heading">
  <p className="screen-heading__eyebrow">Next steps</p>
  <h1 className="screen-heading__title">Actions</h1>
  <p className="screen-heading__lede">Move useful ideas forward without losing where each next step came from.</p>
</header>
```

```tsx
<header className="screen-heading">
  <p className="screen-heading__eyebrow">Preferences and trust</p>
  <h1 className="screen-heading__title" id="settings-heading">Settings</h1>
  <p className="screen-heading__lede">Shape how Nugget organizes your thoughts and review how local data and cloud processing work.</p>
</header>
```

Keep the exact visible wording shown above, which matches the current screens.

- [ ] **Step 4: Align action and settings regions without moving behaviors**

- Add `utility-section` to the Open and Completed sections in `ActionsScreen`.
- Add `utility-section` to each existing Settings section.
- Add `danger-zone` only to **Erase all local data** and its confirmation region.
- In `ActionRow`, retain the category chip, source-idea link, checkbox label, inline editor, and remove confirmation. Reduce the card shadow to `var(--shadow-card)` and keep the five-pixel category edge.
- Do not change any handler body, repository call, button label, link target, `window.confirm` text, model/prompt/schema evidence, analytics disclosure, cloud-processing explanation, or ERASE flow.

- [ ] **Step 5: Verify three-tab navigation remains exact**

Inspect `BottomNav.tsx` and confirm the `tabs` constant remains exactly:

```ts
const tabs = [
  { href: '/', label: 'Capture', icon: 'capture' },
  { href: '/ideas', label: 'Ideas', icon: 'ideas' },
  { href: '/actions', label: 'Actions', icon: 'actions' },
] as const;
```

Confirm `AppShell.tsx` still renders `aria-label="Open settings"` linking to `/settings`. Do not modify either file if those conditions remain true.

- [ ] **Step 6: Run focused utility regression tests**

```powershell
npm test -- src/features/actions/ActionsScreen.test.tsx src/features/settings/SettingsScreen.test.tsx src/components/AppShell.test.tsx src/app/themeContrast.test.ts
npm run typecheck
npm run lint
```

Expected: all checks PASS; Settings tests still prove secret fields are not rendered and exact privacy copy remains.

- [ ] **Step 7: Commit Task 5**

```powershell
git add -- src/features/actions/ActionsScreen.tsx src/features/actions/ActionRow.tsx src/features/settings/SettingsScreen.tsx src/app/globals.css
git commit -m "style: align actions and settings surfaces"
```

---

### Task 6: Integrated verification, preview deployment, and visual evidence

**Files:**

- Create: `docs/hackathon/evidence/visual-polish/capture-idle-mobile.png`
- Create: `docs/hackathon/evidence/visual-polish/capture-recording-mobile.png`
- Create: `docs/hackathon/evidence/visual-polish/review-mobile.png`
- Create: `docs/hackathon/evidence/visual-polish/library-cards-mobile.png`
- Create: `docs/hackathon/evidence/visual-polish/library-compact-mobile.png`
- Create: `docs/hackathon/evidence/visual-polish/idea-detail-mobile.png`
- Create: `docs/hackathon/evidence/visual-polish/library-desktop.png`
- Modify: `docs/hackathon/FINAL_VERIFICATION.md`
- Verify: `docs/hackathon/DEMO_RECORDING_CHECKLIST.md`

**Interfaces:**

- Consumes all accepted task commits.
- Produces a reviewable preview deployment, deterministic judge-path evidence, and a clean final gate for the live walkthrough recording.
- Does not use live OpenAI calls for deterministic sample-library verification.

- [ ] **Step 1: Run the full local automated gate**

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
npm audit --audit-level=high
```

Expected:

- typecheck exits 0;
- lint exits 0;
- every non-live Vitest file passes;
- Next.js production build completes all routes;
- all Playwright E2E specs pass;
- audit reports 0 high or critical vulnerabilities.

Do not run `npm run eval:live`; visual polish does not require another paid model evaluation.

- [ ] **Step 2: Inspect the aggregate diff before publication**

```powershell
git status --short
git diff --check origin/codex/mvp-completion-2026-07-17...HEAD
git log --oneline --decorate -8
```

Expected: only assigned implementation/evidence files differ; `docs/hackathon/demo-video-draft/` remains untracked and untouched; diff check emits no errors.

- [ ] **Step 3: Push verified commits and obtain the Vercel preview URL**

```powershell
git push origin codex/mvp-completion-2026-07-17
```

Use the connected Vercel tooling or `vercel inspect` to identify the READY preview for the pushed commit. Record the deployment ID and full preview URL. Do not promote to production until Sol has accepted the preview smoke.

- [ ] **Step 4: Run mobile Chrome visual and functional smoke at 430 × 932**

Against the READY preview:

1. Open Capture and verify one dominant concave microphone control, one quiet flat audio line, three bottom tabs, and Settings gear.
2. Start a short test recording, verify one continuous changing line, timer, recording state, and **Stop & save**.
3. Stop and verify the recording is saved before any navigation or processing request.
4. Load the disclosed sample library from Settings for zero-provider organization checks.
5. Open Ideas in Cards mode; search `community`; filter Personal; switch to Compact; reload and verify Compact remains selected with filters unchanged.
6. Switch back to Cards, open **Create a neighborhood tool-sharing library**, and verify summary-first title, summary, category, tags, goal, blocker, research, action, and collapsed source.
7. Enter Edit, change no data, cancel, and verify reading mode returns without mutation.
8. Open Actions, complete and reopen the sample action, and verify the source idea remains linked.
9. Open Settings and verify exact processing/privacy/analytics copy and public model evidence.

Capture the six mobile screenshots listed under Files. Do not include secret-bearing browser panels, request headers, environment values, or user-private captures.

- [ ] **Step 5: Run desktop visual smoke at 1440 × 1000**

Verify:

- the shell remains centered and bounded;
- Cards uses two columns without changing DOM reading order;
- Compact remains a single readable list;
- Review and idea detail remain bounded reading columns rather than dashboards;
- keyboard focus is visible on record, view-toggle, review, source, edit, action, and settings controls.

Capture `library-desktop.png`.

- [ ] **Step 6: Verify reduced motion and failure preservation**

With reduced motion enabled in browser emulation:

- the waveform remains understandable without animated transitions;
- hover translations are disabled;
- processing status and category meaning remain available as text.

Use existing deterministic failure paths or tests to verify microphone denial, offline queued capture, processing retry, empty library, no search results, and erase confirmation still state what is preserved. Do not intentionally delete the user’s existing browser profile data.

- [ ] **Step 7: Record exact evidence in FINAL_VERIFICATION.md**

Append a dated **Visual polish gate** section containing:

- accepted commit hashes and messages;
- exact automated commands and pass counts;
- preview deployment ID and URL;
- 430 × 932 Chrome checks;
- 1440 × 1000 desktop checks;
- reduced-motion result;
- screenshot paths;
- confirmation that no live OpenAI call was used;
- confirmation that privacy, grounding, and persistence behavior were unchanged.

- [ ] **Step 8: Commit evidence and verification record**

```powershell
git add -- docs/hackathon/evidence/visual-polish docs/hackathon/FINAL_VERIFICATION.md
git commit -m "docs: record visual polish verification"
git push origin codex/mvp-completion-2026-07-17
```

- [ ] **Step 9: Stop at the preview exit gate for Sol review**

Sol must inspect all task commits, rerun the relevant focused tests, open the preview on mobile and desktop, and confirm the design spec acceptance criteria. After acceptance, Sol may promote the exact verified commit to production under the user’s existing deployment authorization, rerun the public judge path, and then begin the live walkthrough recording.

---

## Plan self-review

### Spec coverage

- Editorial Utility palette, typography, restrained surfaces: Tasks 1–5.
- Concave microphone and continuous waveform: Task 1.
- Nugget-first confirmation and transcript grounding: Task 2.
- Cards default plus remembered Compact mode: Task 3.
- Summary-first idea detail with complete editing and utilities: Task 4.
- Three tabs plus Settings gear: Task 5 verification.
- Actions/Settings alignment without behavior changes: Task 5.
- Mobile, desktop, reduced motion, focus, contrast, and evidence: Task 6.
- Local persistence, privacy, grounding, exports, and duplicate prevention: global constraints and regression gates in every affected task.

### Type consistency

- `IdeaLibraryView` is defined once in `libraryViewPreference.ts` and imported by the toggle, screen, and row.
- `ContinuousWaveform` consumes the existing normalized `recorder.level` and adds no recorder-service contract.
- `IdeaSummaryView` consumes canonical domain objects and emits only `onEdit`; `IdeaDetailScreen` retains all mutations.
- Review continues to use the current `IdeaDraftFormValue`, `validateIdeaDraftFormValue`, and `ReviewService` signatures.

### Scope discipline

- No dependency, schema, provider, prompt, API, database, analytics, export, or processing changes are planned.
- New behavior is limited to presentation mode, a local display preference, and transient waveform samples.
- The final gate uses deterministic sample data and avoids paid model calls.
