# Nugget MVP Sprint 4 Organization and Usefulness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make confirmed ideas easy to find, understand, edit, act on, configure, export, and delete.

**Architecture:** Keep search local and deterministic by loading confirmed idea records and their small category/tag joins from Dexie, then filtering normalized text in memory. Build separate Ideas, Idea Detail, Actions, and Settings screens around repository services. Keep generated provenance in the record while allowing user edits, and export plain Markdown/JSON without a cloud dependency.

**Tech Stack:** React 19, Next.js App Router, Dexie, TypeScript, Tailwind CSS, Vitest, Testing Library.

## Global Constraints

- Library content consists of confirmed ideas, not capture sessions or raw nuggets.
- Search is local keyword search across title, summary, and tag names; semantic/vector search is out of scope.
- Category filtering uses exactly one idea category; tag filtering may use multiple tags.
- Idea edits never alter the source transcript or extraction run.
- User-edited content remains editable and may preserve original provenance metadata.
- Generated action acceptance remains duplicate-safe.
- `Misc` cannot be deleted.
- Deleting another category must reassign affected ideas in one transaction.
- Export must work offline and must not send content to a server.
- Full-data deletion requires explicit destructive confirmation and reseeds only the default categories/settings shell.
- Follow the current user design system; do not invent an analytics dashboard.
- Use focused repository/component/export tests and manual retrieval checks, not full TDD.

---

### Task 1: Add library query and editing services

**Files:**
- Modify: `src/lib/repositories/ideaRepository.ts`
- Modify: `src/lib/repositories/actionItemRepository.ts`
- Create: `src/lib/services/LibraryService.ts`
- Create: `src/lib/services/LibraryService.test.ts`

**Interfaces:**
- Produces: `LibraryService.search()`, enriched idea rows, and canonical update operations

- [ ] **Step 1: Add idea update and archive operations**

Expose:

```ts
export interface UpdateIdeaInput extends ConfirmIdeaInput {
  status?: 'confirmed' | 'archived';
}

ideaRepository.update(id: string, input: UpdateIdeaInput): Promise<Idea>
ideaRepository.setArchived(id: string, archived: boolean): Promise<void>
ideaRepository.listConfirmed(includeArchived?: boolean): Promise<Idea[]>
```

`update()` validates category and grounding with the same function as confirmation, preserves `captureSessionId`, `extractionRunId`, `sourceSpans`, `createdAt`, and `confirmedAt`, and updates only editable fields plus `updatedAt`.

- [ ] **Step 2: Finish action queries**

Expose:

```ts
actionItemRepository.getById(id: string): Promise<ActionItem | undefined>
actionItemRepository.listByIdea(ideaId: string): Promise<ActionItem[]>
actionItemRepository.listByStatus(status: 'open' | 'completed'): Promise<ActionItem[]>
actionItemRepository.setStatus(id: string, status: 'open' | 'completed'): Promise<void>
actionItemRepository.remove(id: string): Promise<void>
```

`setStatus()` sets `completedAt` only for completed and removes it when reopened.

- [ ] **Step 3: Define enriched library rows**

```ts
export interface IdeaLibraryRow {
  idea: Idea;
  category: Category;
  tags: Tag[];
  openActionCount: number;
  hasBlockers: boolean;
  needsResearch: boolean;
}

export interface SearchIdeasInput {
  query?: string;
  categoryId?: string;
  tagIds?: string[];
  includeArchived?: boolean;
}
```

- [ ] **Step 4: Implement local normalized search**

```ts
function normalizeSearch(value: string) {
  return value.normalize('NFKD').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
}

function matchesQuery(row: IdeaLibraryRow, query: string) {
  const haystack = normalizeSearch([
    row.idea.title,
    row.idea.summary.text,
    ...row.tags.map((tag) => tag.name),
  ].join(' '));
  return query.split(' ').every((term) => haystack.includes(term));
}
```

`LibraryService.search()` loads confirmed ideas, categories, tags, and open actions once, builds rows, applies category and all-selected-tag filters, then query terms, and sorts by `updatedAt` descending.

- [ ] **Step 5: Test search and indicators**

Cover:

- title, summary, and tag matches;
- case/extra-space normalization;
- AND behavior for two query terms;
- category filter;
- multi-tag filter requires every selected tag;
- archived excluded by default;
- blocker, research, and open-action indicators;
- most recently updated first.

- [ ] **Step 6: Run and commit**

```powershell
npx vitest run src/lib/services/LibraryService.test.ts
git add src/lib/repositories/ideaRepository.ts src/lib/repositories/actionItemRepository.ts src/lib/services/LibraryService.ts src/lib/services/LibraryService.test.ts
git commit -m "feat: query and edit organized ideas"
```

### Task 2: Build the searchable Ideas library

**Files:**
- Rewrite: `src/app/ideas/page.tsx`
- Create: `src/features/library/IdeaLibraryScreen.tsx`
- Create: `src/features/library/IdeaLibraryRow.tsx`
- Create: `src/features/library/IdeaFilters.tsx`
- Create: `src/features/library/IdeaLibraryScreen.test.tsx`
- Remove: `src/features/library/ConfirmedIdeasPreview.tsx`

**Interfaces:**
- Consumes: `LibraryService.search()`, category/tag repositories
- Produces: `/ideas` retrieval experience

- [ ] **Step 1: Implement controlled filter state**

`IdeaLibraryScreen` keeps:

```ts
const [query, setQuery] = useState('');
const [categoryId, setCategoryId] = useState<string | undefined>();
const [tagIds, setTagIds] = useState<string[]>([]);
const [includeArchived, setIncludeArchived] = useState(false);
```

Debounce query by 150 ms, cancel stale load results with an `active` flag, and refresh on window focus.

- [ ] **Step 2: Build the library hierarchy**

Render:

- heading **Ideas**;
- review-required callout linked to the oldest ready capture;
- search labeled **Search ideas**;
- horizontal category controls: All plus configured categories;
- optional tag filter disclosure;
- result count;
- idea rows;
- empty and no-results states;
- mobile bottom navigation.

The empty state action is **Record your first idea**. The no-results action is **Clear filters**.

- [ ] **Step 3: Render useful idea rows**

Each row links to `/ideas/{idea.id}` and contains title, category, two-line summary, up to three tag chips, updated date, and text/icon indicators for Blocked, Research, and N open actions. Use a narrow category edge, not a saturated category card.

- [ ] **Step 4: Preserve filters in the URL**

Use `router.replace()` with `q`, `category`, `tags`, and `archived=1`. Initialize state from `useSearchParams()` so a filtered library is shareable within the local app without exporting data.

- [ ] **Step 5: Test retrieval states**

Required cases:

- confirmed ideas render and drafts do not;
- query changes results after debounce;
- category and tag filters combine;
- clear filters restores all;
- empty library points to Capture;
- review callout links to `/review/{captureId}`;
- indicator text is accessible without color.

- [ ] **Step 6: Run and commit**

```powershell
npx vitest run src/features/library/IdeaLibraryScreen.test.tsx
git add src/app/ideas src/features/library
git commit -m "feat: add searchable idea library"
```

### Task 3: Build complete idea detail, editing, and single-idea export

**Files:**
- Create: `src/app/ideas/[ideaId]/page.tsx`
- Rewrite: `src/features/library/IdeaDetailScreen.tsx`
- Rewrite: `src/features/library/IdeaDetailScreen.test.tsx`
- Create: `src/lib/export/ideaExport.ts`
- Create: `src/lib/export/download.ts`
- Create: `src/lib/export/ideaExport.test.ts`

**Interfaces:**
- Consumes: canonical idea, source capture/transcript, categories/tags/actions
- Produces: editable `/ideas/{ideaId}` and offline Markdown/JSON downloads

- [ ] **Step 1: Define deterministic Markdown export**

`ideaToMarkdown(bundle)` returns:

```markdown
# Create a neighborhood tool-sharing library

Category: Personal
Tags: community, sharing, weekend project

## Summary

A simple way for neighbors to lend rarely used tools.

## Purpose

...

## Goals

- ...

## Problem

...

## Blockers

- ...

## Questions

- ...

## Research needed

...

Suggested searches:
- ...

Suggested resource types:
- ...

## Actions

- [ ] ...

## Source

Capture: <local capture id>
Created: <ISO timestamp>
```

Omit empty optional sections. Do not include the full transcript unless `includeTranscript: true` is explicitly passed.

- [ ] **Step 2: Implement browser download helper**

```ts
export function downloadText(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
```

Slugify filename from title, falling back to `nugget-idea-{id}`.

- [ ] **Step 3: Load the complete idea bundle**

Idea detail loads idea, category, tags, actions, source capture, recording, and current transcript. Render the idea as primary content; source audio/transcript stays in a collapsed **Source recording** section.

- [ ] **Step 4: Implement edit mode using the review form primitives**

Reuse `GroundedFieldEditor`, provenance badges, source excerpts, and TagEditor. Save through `ideaRepository.update`. User edits retain basis but update text; deleting a field removes it. Do not generate new provenance automatically.

- [ ] **Step 5: Add archive, copy, and export actions**

Actions:

- **Save changes**;
- **Copy summary** using Clipboard API with textarea fallback;
- **Export Markdown**;
- **Export JSON** using a stable object with `schemaVersion: 'nugget-idea-export-v1'`;
- **Archive idea** / **Restore idea**.

Archive requires confirmation only when open actions exist.

- [ ] **Step 6: Test rendering, edit persistence, and export**

Assert all rich fields, source disclosure, linked actions, category/tag edits, archive, exact Markdown section omission, JSON schema version, and no automatic full-transcript inclusion.

- [ ] **Step 7: Run and commit**

```powershell
npx vitest run src/features/library/IdeaDetailScreen.test.tsx src/lib/export/ideaExport.test.ts
git add src/app/ideas/[ideaId] src/features/library/IdeaDetailScreen.tsx src/features/library/IdeaDetailScreen.test.tsx src/lib/export
git commit -m "feat: edit and export complete ideas"
```

### Task 4: Build the cross-idea Actions screen

**Files:**
- Rewrite: `src/app/actions/page.tsx`
- Create: `src/features/actions/ActionsScreen.tsx`
- Create: `src/features/actions/ActionRow.tsx`
- Create: `src/features/actions/ActionsScreen.test.tsx`

**Interfaces:**
- Consumes: action and idea/category repositories
- Produces: open/completed task view with source context

- [ ] **Step 1: Load enriched action rows**

```ts
interface EnrichedAction {
  action: ActionItem;
  idea: Idea;
  category: Category;
}
```

Sort open actions newest first and completed actions by `completedAt` descending.

- [ ] **Step 2: Build open and completed sections**

Each row has a real checkbox, action text, source idea title, category label, and link to `/ideas/{ideaId}`. Toggling waits for repository success and restores checkbox state on failure.

- [ ] **Step 3: Add action editing/removal**

Provide inline text edit and **Remove action** with confirmation. Add repository method:

```ts
actionItemRepository.updateText(id: string, text: string): Promise<void>
```

Reject blank text.

- [ ] **Step 4: Implement truthful empty state**

Copy:

```text
No actions yet
Accept a suggested next step while reviewing an idea, and it will appear here.
```

Link to Ideas, not Capture.

- [ ] **Step 5: Test lifecycle and source links**

Cover open→completed, completed→open, edit, remove, failure rollback, empty state, and source idea link.

- [ ] **Step 6: Run and commit**

```powershell
npx vitest run src/features/actions/ActionsScreen.test.tsx
git add src/app/actions src/features/actions src/lib/repositories/actionItemRepository.ts
git commit -m "feat: manage actions across ideas"
```

### Task 5: Build category management with classifier descriptions

**Files:**
- Create: `src/app/settings/categories/page.tsx`
- Create: `src/features/settings/CategorySettingsScreen.tsx`
- Create: `src/features/settings/CategoryEditor.tsx`
- Create: `src/features/settings/CategorySettingsScreen.test.tsx`
- Modify: `src/app/settings/page.tsx`

**Interfaces:**
- Consumes: category repository safety rules
- Produces: editable classifier meaning and safe deletion/reassignment

- [ ] **Step 1: Render every category's classifier contract**

List name, description, Default/Fallback labels, and count of ideas using the category. Add **Edit category** and **Add category**. Misc shows **Fallback—cannot be deleted**.

- [ ] **Step 2: Build the editor**

Fields:

- Name, max 40 characters;
- Description, minimum 20 and max 800 characters;
- helper copy: **Include examples that belong here and boundaries that distinguish this category from the others. Nugget sends this description to GPT-5.6 during classification.**

Show live character count and repository validation errors.

- [ ] **Step 3: Implement safe deletion**

Delete opens a dialog showing affected idea count and required replacement category. Default replacement is Misc. Confirm calls `removeAndReassign` and announces both reassignment count and deletion.

- [ ] **Step 4: Link Categories from Settings**

The Settings landing screen now contains Category organization, Processing and privacy, Data export, and About sections. Category organization links to `/settings/categories`.

- [ ] **Step 5: Test descriptions and reassignment**

Cover create, duplicate normalized name, short description, edit, Misc non-delete, delete with required replacement, and ideas moved atomically.

- [ ] **Step 6: Run and commit**

```powershell
npx vitest run src/features/settings/CategorySettingsScreen.test.tsx src/lib/repositories/organizationRepositories.test.ts
git add src/app/settings src/features/settings
git commit -m "feat: teach Nugget custom categories"
```

### Task 6: Finish processing, privacy, full export, and deletion settings

**Files:**
- Rewrite: `src/app/settings/page.tsx`
- Create: `src/features/settings/SettingsScreen.tsx`
- Create: `src/features/settings/SettingsScreen.test.tsx`
- Create: `src/lib/export/fullExport.ts`
- Create: `src/lib/export/fullExport.test.ts`
- Create: `src/lib/services/DataManagementService.ts`
- Create: `src/lib/services/DataManagementService.test.ts`

**Interfaces:**
- Produces: transparent processing preference, model display, full local export, and destructive reset

- [ ] **Step 1: Implement stable full-data export**

`buildFullExport()` returns:

```ts
interface NuggetFullExport {
  schemaVersion: 'nugget-full-export-v1';
  exportedAt: string;
  captures: Array<Omit<CaptureSession, 'lastError'> & { lastError?: ProcessingError }>;
  recordings: Array<Omit<Recording, 'blob'> & { base64: string }>;
  transcripts: Transcript[];
  extractionRuns: ExtractionRun[];
  ideas: Idea[];
  categories: Category[];
  tags: Tag[];
  actions: ActionItem[];
  settings: Pick<AppSettings, 'automaticProcessing' | 'cloudProcessingConsent'>;
}
```

Convert Blob bytes to base64 locally. Do not export `clientId`, API keys, object URLs, or browser paths.

- [ ] **Step 2: Implement reset transaction**

`DataManagementService.deleteAll()` uses one transaction to clear recordings, transcripts, extraction runs, ideas, legacy suggestion tables if still present, actions, tags, captures, categories, and settings. After commit, call `categoryRepository.ensureDefaults()` and `settingsRepository.get()` to create a fresh local shell with consent `unknown` and automatic processing `false`.

- [ ] **Step 3: Build processing settings**

Render:

- Automatic organization toggle;
- cloud-processing consent state;
- **Revoke cloud processing consent**;
- truthful disclosure of audio/transcript transfer;
- GET `/api/health` provider availability and model names;
- audio retention copy: **Recordings remain in this browser until you delete the capture or erase all local data.**

Turning automatic processing on while consent is not granted opens consent; turning off never deletes data.

- [ ] **Step 4: Build export and destructive deletion controls**

- **Export all local data** downloads JSON.
- **Erase all local data** requires typing `ERASE` exactly and then a second destructive button.
- On success, navigate to Capture and announce **All local Nugget data was erased.**
- On failure, remain in Settings and state that data may still be present.

- [ ] **Step 5: Add About/hackathon evidence metadata**

Display application version if available, current configured transcription and organization models, prompt/schema versions from constants, and **Built with GPT-5.6 and Codex**. Expose no secret or internal server path.

- [ ] **Step 6: Test export and reset safety**

Verify Blob round-trip base64, client ID exclusion, all tables cleared, default categories reseeded, settings reset, wrong ERASE text rejected, model metadata sanitized, and export works with no network mock.

- [ ] **Step 7: Run and commit**

```powershell
npx vitest run src/lib/export/fullExport.test.ts src/lib/services/DataManagementService.test.ts src/features/settings/SettingsScreen.test.tsx
git add src/app/settings src/features/settings/SettingsScreen.tsx src/features/settings/SettingsScreen.test.tsx src/lib/export/fullExport.ts src/lib/export/fullExport.test.ts src/lib/services/DataManagementService.ts src/lib/services/DataManagementService.test.ts
git commit -m "feat: add privacy and local data controls"
```

### Task 7: Verify organization usefulness and close Sprint 4

**Files:**
- Create: `docs/qa/sprint-4-organization-checklist.md`
- Modify: `docs/hackathon/BUILD_WEEK_EVIDENCE.md`

**Interfaces:**
- Produces: proof that organization, retrieval, and action features work with realistic data

- [ ] **Step 1: Run the complete gate**

```powershell
npm test
npm run typecheck
npm run lint
npm run build
git diff --check
```

- [ ] **Step 2: Seed three realistic captures through the real UI**

Use Work, School, and Personal ideas with overlapping words and distinct tags. Confirm at least one blocker, research need, and action. Do not insert directly into IndexedDB for this manual proof.

- [ ] **Step 3: Execute retrieval checks**

Document:

- title search;
- summary-only search;
- tag-only search;
- two-term AND query;
- category+tag combined filter;
- no-results reset;
- archive hidden/restored;
- edit survives refresh;
- source audio/transcript accessible but collapsed;
- action complete/reopen;
- custom category description affects the next real GPT classification;
- Markdown/JSON export opens and contains expected fields;
- full export includes audio but excludes client ID;
- erase flow is blocked without `ERASE`.

- [ ] **Step 4: Capture evidence**

Save library, idea detail, Actions, and category-description screenshots under `docs/hackathon/evidence/sprint-4/` using non-private sample data.

- [ ] **Step 5: Update evidence and commit**

```powershell
git add docs/qa/sprint-4-organization-checklist.md docs/hackathon/BUILD_WEEK_EVIDENCE.md docs/hackathon/evidence/sprint-4
git commit -m "docs: verify idea organization workflow"
git status --short --branch
```

## Sprint 4 exit checklist

- [ ] Confirmed ideas are searchable by title, summary, and tag.
- [ ] Category and multi-tag filters work together.
- [ ] Idea detail exposes and edits every approved rich field.
- [ ] Source recording/transcript remains linked and secondary.
- [ ] Actions can be completed, reopened, edited, removed, and traced to ideas.
- [ ] Custom category descriptions are validated and sent to classification.
- [ ] Category deletion reassigns safely; Misc cannot be deleted.
- [ ] Single-idea and full-data exports work offline.
- [ ] Full erase is strongly confirmed and resets consent.
- [ ] Privacy/model copy is accurate.
- [ ] Full `npm run check` passes.
- [ ] Sprint 4 evidence row is complete.
