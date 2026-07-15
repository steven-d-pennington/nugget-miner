# Nugget MVP Sprint 6 Demo and Submission Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Submit a truthful, easy-to-judge Nugget entry whose deployed app, repository, README, GPT-5.6 evidence, Codex history, screenshots, and under-three-minute video all demonstrate the same working product.

**Architecture:** Freeze application behavior, add a clearly labeled local sample library for judges who cannot record immediately, and treat documentation/media as verified build artifacts. Derive every claim from the deployed application and evidence ledger; preserve the real record-to-GPT-to-library path as the main demonstration.

**Tech Stack:** Next.js/Dexie sample seeding, Markdown documentation, Git/GitHub, Vercel, YouTube, Devpost, Codex `/feedback`.

## Global Constraints

- No new product features after Sprint 5 freeze.
- Sample data must be clearly labeled and must not replace the real GPT-5.6 path.
- The public demo must require no payment, account, invitation, or private setup.
- The video must be public on YouTube, include audio/voiceover, and remain under three minutes.
- The repository must be public with a license or shared with both required judging addresses.
- The README must distinguish pre-event code from Build Week work.
- The README must describe Codex collaboration, GPT-5.6 usage, and key human decisions.
- Use the `/feedback` Session ID from the primary Terra implementation task, not a minor planning or cleanup task.
- Do not claim live research, self-learning, cloud sync, native background processing, or any deferred feature.
- Keep the deployed application free and unrestricted through August 5, 2026 at 5:00 PM Pacific.
- Internal submit target: July 21, 2026 at 2:00 PM Pacific.

---

### Task 1: Add a clearly labeled local sample library

**Files:**
- Create: `src/lib/demo/sampleData.ts`
- Create: `src/lib/demo/DemoDataService.ts`
- Create: `src/lib/demo/DemoDataService.test.ts`
- Modify: `src/features/settings/SettingsScreen.tsx`
- Modify: `src/features/library/IdeaLibraryScreen.tsx`
- Create: `docs/hackathon/JUDGING_TEST_PATH.md`

**Interfaces:**
- Produces: idempotent `DemoDataService.seed()` and a two-minute judge path

- [ ] **Step 1: Define deterministic non-private sample records**

Use IDs prefixed `demo-` and create:

- one audio-shaped capture with no real Blob, a clearly labeled sample transcript, and confirmed state;
- three confirmed ideas across Personal, Work, and School;
- tags `community`, `sharing`, `weekend project`, `handoff`, `automation`, `research`;
- one blocker, one research-needed idea, and two actions;
- source spans that exactly match the sample transcript.

Primary sample idea content:

```ts
{
  title: 'Create a neighborhood tool-sharing library',
  summary: 'A simple way for neighbors to lend rarely used tools, reduce duplicate purchases, and coordinate pickup.',
  goal: 'Test whether ten nearby households would participate.',
  blocker: 'Need a simple way to track availability and responsibility.',
  research: 'Compare lightweight inventory and lending tools.',
  action: 'Draft a one-page interest survey.',
  categoryId: 'category-personal',
  tags: ['community', 'sharing', 'weekend project'],
}
```

The Work sample is an automated weekly support handoff. The School sample compares evening data-science programs. Use complete realistic records rather than filler copy.

- [ ] **Step 2: Seed idempotently in one transaction**

```ts
export const DemoDataService = {
  async seed() {
    const existing = await db.captureSessions.get('demo-capture');
    if (existing) return { created: false, captureId: existing.id };
    await categoryRepository.ensureDefaults();
    await db.transaction('rw', [db.captureSessions, db.transcripts, db.ideas, db.tags, db.actionItems], async () => {
      await db.captureSessions.put(SAMPLE_CAPTURE);
      await db.transcripts.put(SAMPLE_TRANSCRIPT);
      await db.ideas.bulkPut(SAMPLE_IDEAS);
      await db.tags.bulkPut(SAMPLE_TAGS);
      await db.actionItems.bulkPut(SAMPLE_ACTIONS);
    });
    return { created: true, captureId: 'demo-capture' };
  },
};
```

Do not create an empty fake audio Blob. The sample capture renders **Sample transcript—no recording**.

- [ ] **Step 3: Add an explicit Settings action**

Button: **Load sample library**. Disclosure:

```text
Adds three clearly labeled sample ideas to this browser so you can explore search, categories, actions, and export. It does not call GPT-5.6 and does not replace the live capture demo.
```

After seeding, navigate to `/ideas` and announce **Sample ideas added**. Repeated use announces **Sample ideas are already loaded**.

- [ ] **Step 4: Mark sample rows**

Idea rows/details whose ID starts `demo-` show a small **Sample** label. Do not style them as real user captures or GPT evidence.

- [ ] **Step 5: Test idempotency and separation**

Assert two seed calls create exactly three ideas and two actions, no recording row, correct categories/tags, valid source spans, and visible Sample labels.

- [ ] **Step 6: Write the judging test path**

`JUDGING_TEST_PATH.md` contains:

```markdown
# Judge Test Path

## Fast exploration (about 2 minutes)

1. Open the deployed HTTPS URL.
2. In Settings, select **Load sample library**.
3. Open Ideas and search `community`.
4. Filter Personal and open **Create a neighborhood tool-sharing library**.
5. Inspect goal, blocker, research need, suggested action, and source transcript.
6. Open Actions, complete the survey action, and return to the idea.
7. Export the idea as Markdown.

## Live GPT-5.6 path

1. Return to Capture and record or paste a ramble containing at least two different ideas.
2. Select **Stop & save**.
3. Enable cloud processing when prompted.
4. Wait for transcription, separation, and organization.
5. Review the separate ideas, edit category/tags, and confirm them.
6. Find the confirmed ideas in the library.
```

- [ ] **Step 7: Run and commit**

```powershell
npx vitest run src/lib/demo/DemoDataService.test.ts
npm run typecheck
git add src/lib/demo src/features/settings/SettingsScreen.tsx src/features/library/IdeaLibraryScreen.tsx docs/hackathon/JUDGING_TEST_PATH.md
git commit -m "feat: add transparent judge sample library"
```

### Task 2: Complete the public README and license

**Files:**
- Rewrite: `README.md`
- Create: `LICENSE`
- Modify: `docs/README.md`

**Interfaces:**
- Consumes: final deployment URL, evidence ledger, eval report, test scripts
- Produces: complete repository landing page and authorized license

- [ ] **Step 1: Add MIT license**

Use the standard MIT License with:

```text
Copyright (c) 2026 Steven Pennington
```

- [ ] **Step 2: Rewrite README in this exact order**

1. Nugget title, one-sentence value, public demo link, and Apps for Your Life badge/text.
2. **The problem**: ideas lost in long, unstructured voice notes.
3. **What Nugget does**: capture, transcribe, separate, organize, confirm, retrieve.
4. **Try it**: fast sample path and live GPT path.
5. **Core features**: only shipped features.
6. **How GPT-5.6 is used**: Responses API, two stages, categories, provenance, structured output, evaluations.
7. **Architecture**: local IndexedDB, transient server routes, no accounts/sync, processing lifecycle diagram.
8. **Built with Codex**: primary task, how plans/reviews/implementation were handled.
9. **Human decisions**: mobile-first capture, mandatory confirmation, category descriptions, no self-learning/live research, focused tests.
10. **Before and after Build Week**: link baseline and list event additions.
11. **Local setup**.
12. **Environment variables**.
13. **Commands and verification**.
14. **Privacy and data handling**.
15. **Known MVP boundaries**.
16. **Repository map and documentation links**.
17. **License**.

- [ ] **Step 3: Use exact setup commands**

Run `git remote get-url origin`, copy its exact public GitHub HTTPS URL into the README's `git clone` command, and follow it with:

```powershell
Set-Location nugget-miner
Copy-Item .env.example .env.local
npm ci
npm run dev
```

State that real processing requires `OPENAI_API_KEY`, while browsing loaded sample data does not.

- [ ] **Step 4: Document every verification command**

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
npm run eval:live
```

Label `eval:live` as optional/cost-incurring and API-key-required. Link `docs/evals/latest.json` for the recorded event run.

- [ ] **Step 5: Describe Codex and human work accurately**

Codex section must include:

- repository audit and sprint specification;
- architecture/migration implementation support;
- test and evaluation generation;
- code review/debugging and deployment verification;
- primary implementation Session ID once available.

Human decisions must include the user's category/tags model, confirmation requirement, on-the-go priority, design system, scope cuts, and final product judgment. Do not imply Codex independently chose the product.

- [ ] **Step 6: Update documentation index**

`docs/README.md` links the approved spec, sprint index, design brief, baseline, evidence ledger, eval report, judge path, production QA, video script, and submission copy.

- [ ] **Step 7: Verify README commands and links**

Run each non-live command from a clean `npm ci`. Check every relative link exists. Search for stale claims:

```powershell
$unfinishedCopy = 'coming' + ' soon'
rg -n -i "local-only|fully on device|gpt-4o-mini|mock extraction|$unfinishedCopy" README.md docs/README.md
```

The only permitted `gpt-4o-mini` match is `gpt-4o-mini-transcribe`.

- [ ] **Step 8: Commit**

```powershell
git add README.md LICENSE docs/README.md
git commit -m "docs: publish Nugget MVP project guide"
```

### Task 3: Prepare Devpost copy and final screenshots

**Files:**
- Create: `docs/hackathon/DEVPOST_SUBMISSION.md`
- Create: `docs/hackathon/SCREENSHOT_PLAN.md`
- Add: `docs/hackathon/submission-assets/*.png`
- Modify: `docs/hackathon/BUILD_WEEK_EVIDENCE.md`

**Interfaces:**
- Produces: copy/paste-ready submission and truthful visual assets

- [ ] **Step 1: Write the short project description**

Use this base and edit only for final factual accuracy:

```text
Nugget is a mobile-first voice capture app that turns unstructured rambles into distinct, organized ideas. Record while you are moving, leave as soon as the audio is saved locally, then return to review GPT-5.6-generated idea records with editable titles, summaries, goals, blockers, research needs, categories, tags, and next actions.
```

- [ ] **Step 2: Write the full submission narrative**

Sections:

- Inspiration/problem;
- What it does;
- How we built it;
- Meaningful GPT-5.6 usage;
- How Codex was used;
- Human product/design decisions;
- Challenges: idea boundaries, grounding, local durability, mobile browser background limits;
- Accomplishments: two-stage pipeline, evals, multi-idea review, offline capture;
- What we learned;
- What's next: self-learning, conversational onboarding, live research, sync only as future work.

Every feature claim must be demonstrable on the deployed URL.

- [ ] **Step 3: Capture exactly five primary screenshots**

1. Mobile Capture idle with record control.
2. Recording saved with processing timeline.
3. **3 ideas found** confirmation with provenance/source.
4. Searchable Ideas library with categories and tags.
5. Complete Idea detail with goal, blocker, research need, and action.

Use the approved warm ivory/navy/amber design, sample-safe data, no browser secrets, and consistent phone framing. Record dimensions and final filenames in `SCREENSHOT_PLAN.md`.

- [ ] **Step 4: Add one architecture/evidence image only if Devpost allows it**

Optional sixth asset: simple capture→transcribe→segment→organize→confirm→library diagram with `gpt-5.6` explicitly labeled. Do not substitute it for working UI screenshots.

- [ ] **Step 5: Verify image/content consistency**

Open every screenshot and compare labels to the deployed app. Remove any asset showing old mock buttons, local-only claims, obsolete navigation, or features not shipped.

- [ ] **Step 6: Commit**

```powershell
git add docs/hackathon/DEVPOST_SUBMISSION.md docs/hackathon/SCREENSHOT_PLAN.md docs/hackathon/submission-assets docs/hackathon/BUILD_WEEK_EVIDENCE.md
git commit -m "docs: prepare Devpost submission assets"
```

### Task 4: Script and record the public three-minute demo

**Files:**
- Create: `docs/hackathon/DEMO_SCRIPT.md`
- Create: `docs/hackathon/DEMO_RECORDING_CHECKLIST.md`
- Modify: `docs/hackathon/DEVPOST_SUBMISSION.md`

**Interfaces:**
- Produces: public YouTube URL and script matching the deployed build

- [ ] **Step 1: Write the timed script**

Use this maximum timing:

| Time | Visual | Narration purpose |
|---|---|---|
| 0:00–0:18 | Capture screen | Problem: useful ideas disappear into long voice notes |
| 0:18–0:38 | Record a prepared two-idea ramble; Stop & save | On-the-go, one-action local durability |
| 0:38–0:57 | Processing timeline | OpenAI transcription then GPT-5.6 separation and organization |
| 0:57–1:38 | Two/three idea review | Distinct records, rich fields, category descriptions, tags, provenance/source |
| 1:38–2:06 | Confirm, library search/filter | Final organization and retrieval |
| 2:06–2:24 | Idea detail and Actions | Goal, blocker, research need, next action |
| 2:24–2:44 | Eval report/code/README | Structured output, tests, real GPT-5.6 evidence |
| 2:44–2:56 | Codex evidence/commit history | How Codex supported planning, implementation, and verification |
| 2:56–2:59 | Product close | Nugget keeps moving thoughts useful |

Target 2:45–2:55 total to preserve platform padding.

- [ ] **Step 2: Prepare a real two-idea ramble**

Use a 25–35 second ramble containing one Personal and one Work idea, with one explicit blocker and one research need. Practice it so idea boundaries are clear but natural. Do not use private company/customer information.

- [ ] **Step 3: Record from production**

Use the deployed HTTPS application, not localhost or a design prototype. Record voiceover or live narration with clear audio. Show the configured model in Settings/About or eval evidence. Do not edit around a failed feature in a way that implies it worked.

- [ ] **Step 4: Verify video requirements**

- duration under 3:00;
- public YouTube visibility;
- audio audible at normal volume;
- no unauthorized music or third-party trademarks;
- application and URL visible enough to establish it is working;
- GPT-5.6 use explained specifically;
- Codex workflow explained specifically;
- no API keys, private transcripts, email, notifications, or unrelated tabs.

- [ ] **Step 5: Upload and record the actual URL**

Add the public YouTube URL to `DEVPOST_SUBMISSION.md`, README demo section, and evidence ledger. Open it in a logged-out/private browser to verify public access.

- [ ] **Step 6: Commit documentation**

```powershell
git add docs/hackathon/DEMO_SCRIPT.md docs/hackathon/DEMO_RECORDING_CHECKLIST.md docs/hackathon/DEVPOST_SUBMISSION.md README.md docs/hackathon/BUILD_WEEK_EVIDENCE.md
git commit -m "docs: finalize Nugget demo video"
```

### Task 5: Capture Codex evidence and publish repository access

**Files:**
- Modify: `README.md`
- Modify: `docs/hackathon/BUILD_WEEK_EVIDENCE.md`
- Modify: `docs/hackathon/DEVPOST_SUBMISSION.md`
- Create: `docs/hackathon/CODEX_COLLABORATION.md`

**Interfaces:**
- Produces: primary Session ID, reviewable history, and judge-accessible repository

- [ ] **Step 1: Obtain the primary implementation Session ID**

In the Terra task where most core implementation occurred, run `/feedback`. Copy only the resulting Session ID into:

- `BUILD_WEEK_EVIDENCE.md` Primary Codex Session;
- README Built with Codex section;
- `DEVPOST_SUBMISSION.md` required field.

Do not use the design-only planning task if Terra's task contains the majority of core work.

- [ ] **Step 2: Write collaboration evidence**

`CODEX_COLLABORATION.md` includes:

- task/session ID;
- dated sprint/commit table;
- decisions made by the human;
- work performed with Codex;
- examples of Codex verification or defect discovery;
- links to spec, plans, eval report, evidence ledger, and commits.

Do not paste private chain-of-thought or secrets.

- [ ] **Step 3: Review commit history**

```powershell
git log --since="2026-07-13" --date=iso --pretty=format:"%h %ad %s"
git diff --stat 5394b9a..HEAD
```

Confirm the history visibly supports meaningful extension after July 13 and commit messages map to sprint outcomes.

- [ ] **Step 4: Make repository judge-accessible**

Preferred path: public GitHub repository with MIT license.

```powershell
git remote -v
git push -u origin codex/nugget-mvp
```

Merge through the user's normal reviewed workflow, then verify the public repository in a private browser. If the repository must remain private, share access with `testing@devpost.com` and `build-week-event@openai.com` and record verification in the evidence ledger.

- [ ] **Step 5: Verify no secrets or private artifacts were published**

```powershell
git ls-files | Select-String -Pattern "\.env|playwright-report|test-results"
rg -n "sk-[A-Za-z0-9_-]{20,}" . -g '!node_modules/**' -g '!.git/**'
```

Expected: `.env.example` only; no key match; no private audio/transcript in evidence.

- [ ] **Step 6: Commit evidence updates**

```powershell
git add README.md docs/hackathon/CODEX_COLLABORATION.md docs/hackathon/BUILD_WEEK_EVIDENCE.md docs/hackathon/DEVPOST_SUBMISSION.md
git commit -m "docs: record Codex Build Week collaboration"
```

### Task 6: Run the submission-day gate and submit

**Files:**
- Create: `docs/hackathon/SUBMISSION_CHECKLIST.md`
- Create: `docs/hackathon/FINAL_VERIFICATION.md`
- Modify: `docs/hackathon/BUILD_WEEK_EVIDENCE.md`

**Interfaces:**
- Produces: verified Devpost submission before internal deadline

- [ ] **Step 1: Create the checklist**

Required checkboxes:

- Apps for Your Life track selected;
- title and descriptions pasted from final file;
- production URL opens logged out;
- public/private repository access verified;
- MIT license present;
- README setup/sample/testing/GPT/Codex/human decisions complete;
- five screenshots uploaded and ordered;
- public YouTube URL opens logged out and video is under three minutes;
- primary `/feedback` Session ID entered;
- no unsupported claims;
- deployment remains available through August 5;
- submit button completed before 2:00 PM Pacific;
- confirmation page/email saved.

- [ ] **Step 2: Run clean engineering verification**

```powershell
git status --short --branch
npm ci
npm run check
npm run test:e2e
npm run eval:live
git diff --check
```

Expected: clean tree before `npm ci`; all commands pass; live report meets gates.

- [ ] **Step 3: Run logged-out external verification**

In a private browser:

- open production URL and `/api/health`;
- install/open PWA where possible;
- load sample library;
- complete judge fast path;
- complete a live pasted two-idea GPT run;
- open GitHub repo and README links;
- play YouTube video end to end;
- open all screenshot assets.

- [ ] **Step 4: Compare all surfaces**

Search README, Devpost copy, video script, and app for feature names and model names. Confirm:

- `gpt-5.6` organization;
- `gpt-4o-mini-transcribe` speech-to-text;
- mandatory review;
- local browser storage with cloud processing disclosure;
- no self-learning/live research/sync/background-close claim.

- [ ] **Step 5: Fill final verification record**

`FINAL_VERIFICATION.md` records timestamp, commit SHA, production deployment URL/ID, browser/device, check/test/eval results, video URL/duration, repository access mode, Session ID, and the person who clicked Submit.

- [ ] **Step 6: Submit by the internal deadline**

Complete Devpost Submit, then reopen the submission page and verify every asset persisted. Save confirmation screenshot under `docs/hackathon/submission-assets/submission-confirmed.png`.

- [ ] **Step 7: Commit the final evidence and tag**

```powershell
git add docs/hackathon/SUBMISSION_CHECKLIST.md docs/hackathon/FINAL_VERIFICATION.md docs/hackathon/BUILD_WEEK_EVIDENCE.md docs/hackathon/submission-assets/submission-confirmed.png
git commit -m "docs: record Nugget Build Week submission"
git tag -a build-week-2026-submission -m "Nugget OpenAI Build Week submission"
git push origin codex/nugget-mvp --follow-tags
git status --short --branch
```

Do not tag before the submitted commit and confirmation evidence exist.

## Sprint 6 exit checklist

- [ ] Sample library is useful, local, idempotent, and clearly labeled.
- [ ] README includes setup, testing, architecture, privacy, GPT-5.6, Codex, human decisions, and before/after evidence.
- [ ] MIT license and repository access are verified.
- [ ] Devpost copy contains only shipped behavior.
- [ ] Five final screenshots match production.
- [ ] Public YouTube video is under three minutes and works logged out.
- [ ] Primary Terra `/feedback` Session ID is submitted.
- [ ] Clean install, checks, E2E, live eval, and production smoke pass.
- [ ] Submission is completed and reverified before 2:00 PM Pacific.
- [ ] Confirmation evidence and annotated tag are pushed.
- [ ] Deployment retention through August 5 is recorded.
