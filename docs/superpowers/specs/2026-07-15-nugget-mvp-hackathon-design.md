# Nugget MVP Hackathon Design

**Date:** July 15, 2026

**Deadline:** July 21, 2026 at 5:00 PM Pacific

**Internal submission target:** July 21, 2026 at 2:00 PM Pacific

**Track:** Apps for Your Life

**Status:** Approved design; ready for implementation planning

## 1. Executive summary

Nugget is a mobile-first, voice-first application for capturing ideas while moving. Its first job is to let someone open the app, tap record, speak freely, save safely, and leave without filling out a form. Its second and differentiating job is to use GPT-5.6 to separate a ramble into distinct ideas and turn each one into an organized, editable, searchable record.

The MVP will be an intelligence-first, balanced product rather than an attempt to complete every task in the original backlog. It will preserve and stabilize the useful vertical slice already present in the repository, correct the one-recording/one-idea assumption, make GPT-5.6 central to the product, and finish the downstream organization experience that makes extraction useful.

The core flow is:

```text
Open → Record → Stop and save locally → Process when possible
     → Separate the ramble into ideas → Organize each idea
     → Confirm or correct → Search, act on, and export
```

## 2. Decisions already approved

- One recording may produce zero, one, or many independently editable ideas.
- A capture session remains the common source container for its recording, transcript, extraction runs, and ideas.
- Every confirmed idea has exactly one primary category and zero or more tags.
- Default categories are Work, School, Personal, Family, and Misc.
- Custom categories have a name and a detailed description containing examples and boundary guidance. The description is supplied to the classifier.
- Review and confirmation are required for the MVP. The system prefills fields, category, and tags; the user may edit, confirm, or discard.
- Self-learning from corrections is deferred.
- LLM-driven conversational onboarding is deferred. First-run setup remains brief and optional.
- Live web research is deferred. The MVP may flag research needs and suggest search questions or resource types.
- The product remains local-first, without accounts or cross-device sync.
- Recording is the primary input. Pasted text is a secondary fallback and evaluation aid.
- Processing starts automatically when possible, can be triggered on demand, and resumes safely when the app is reopened.
- The app will not promise reliable processing while a mobile browser is fully closed.
- Verification will be focused and risk-based. Full TDD and broad coverage goals are out of scope.
- Frontend visuals will follow the user's design system. Functional contracts in this document remain authoritative.

## 3. Hackathon requirements

The build and submission must comply with the [official rules](https://openai.devpost.com/rules) and [official FAQ](https://openai.devpost.com/details/faqs).

### 3.1 Product requirements

- Use both Codex and GPT-5.6 meaningfully.
- GPT-5.6 powers the product's core separation, enrichment, and classification behavior rather than an ornamental chat feature.
- The existing project must be meaningfully extended during the event period.
- The shipped project must run consistently and match the submitted text and video.
- The deployed judging path must be free and unrestricted through August 5, 2026 at 5:00 PM Pacific.

### 3.2 Evidence requirements

- Record the current pre-event baseline at commit `5394b9a`.
- Document which behavior existed before the event and which behavior was added during Build Week.
- Preserve dated commits and Codex task history for the event-period work.
- Conduct most core implementation in one primary Codex task and preserve its `/feedback` Session ID.
- Make GPT-5.6 use obvious in source code, environment documentation, model metadata, evaluation evidence, README, and demo narration.

### 3.3 Submission requirements

- Text description and correct Apps for Your Life track selection.
- Working application URL or an equally frictionless testing path.
- Public repository with a license, or private repository shared with the required judging accounts.
- README covering setup, sample data, testing, previous-versus-new work, Codex collaboration, human decisions, and GPT-5.6 integration.
- Public YouTube demonstration no longer than three minutes, with audio or voiceover.
- Screenshots and a truthful demonstration of the actual deployed product.
- Primary Codex Session ID obtained through `/feedback`.

### 3.4 Judging alignment

The judging categories are equally weighted. The product strategy therefore addresses all four:

- **Technological implementation:** non-trivial, versioned GPT-5.6 pipeline with structured output, grounding, retries, and evaluations.
- **Design:** coherent mobile capture-to-library experience, not a proof-of-concept prompt box.
- **Potential impact:** directly helps people retain and organize ideas that would otherwise be lost in rambling notes.
- **Quality of idea:** goes beyond transcription and summarization by separating, structuring, classifying, and making ideas actionable.

## 4. Audience and experience thesis

### 4.1 Primary audience

People who capture thoughts while walking, commuting, between meetings, doing chores, or otherwise away from a desk. They may be one-handed, outdoors, distracted, or on an unreliable connection.

### 4.2 Primary job

Start recording with one obvious action and no metadata entry. Saving must be trustworthy enough that the user can leave immediately.

### 4.3 Secondary job

Return later to useful organization: distinct ideas, meaningful fields, trustworthy source context, categories and tags, blockers, research needs, and next actions.

### 4.4 Experience principles

1. Capture before organization.
2. Saved means safely persisted locally.
3. Background effort stays visible and recoverable.
4. AI proposes; the person confirms.
5. Separate ideas stay separate.
6. Model-generated content remains editable and traceable.
7. Plain verbs and clear recovery guidance replace vague AI language.
8. Mobile daylight readability and one-handed controls take priority over desktop density.

## 5. MVP scope

### 5.1 Included

- One-tap microphone capture with elapsed time and level feedback.
- Safe local persistence before cloud processing begins.
- Pasted-text capture as a secondary input.
- Automatic and on-demand transcription and organization.
- Persisted processing queue, retry, resume, and duplicate prevention.
- Zero-to-many ideas from one transcript.
- GPT-5.6 separation, enrichment, category classification, and tag suggestion.
- Rich editable idea records.
- Required confirmation with source excerpts and provenance labels.
- One category and multiple tags per idea.
- Category settings with detailed classifier descriptions.
- Organized library, keyword search, and category/tag filters.
- Complete idea detail and edit view.
- Cross-idea action list.
- Individual Markdown and JSON export plus full local-data export.
- Accurate local/cloud privacy messaging and local-data deletion.
- Installable PWA shell and offline capture.
- Public deployed demo and hackathon submission assets.

### 5.2 Explicitly deferred

- Self-learning or automatic prompt adaptation from corrections.
- Conversational LLM onboarding.
- Live browsing, research execution, citations, or link verification.
- Accounts, authentication, cloud user database, sync, or collaboration.
- Native iOS or Android applications.
- Push notifications.
- Guaranteed processing while the app is fully closed.
- Automatic filing without confirmation.
- Semantic or vector search.
- Audio trimming or waveform editing.
- Calendar, task-manager, workplace, or knowledge-base integrations.
- Advanced tag administration beyond inline creation and filtering.
- Broad test coverage targets or strict test-first implementation.

## 6. Core user flows

### 6.1 Capture and leave

1. The app opens to Capture with a dominant record control.
2. Recording begins without an API call or login.
3. The interface shows recording state, elapsed time, and audio activity.
4. The user selects **Stop & save**.
5. Audio and capture metadata are committed to IndexedDB.
6. Only after the transaction succeeds does the interface show **Recording saved**.
7. Processing is enqueued.
8. The user may leave immediately.

### 6.2 Automatic processing

1. A persisted queue finds eligible saved or interrupted sessions.
2. When online and cloud processing is configured, transcription begins.
3. The transcript is saved before extraction begins.
4. GPT-5.6 separates the transcript into distinct candidates.
5. GPT-5.6 organizes and classifies each candidate.
6. Draft ideas and extraction metadata are saved transactionally.
7. The capture becomes **Ready for review**.
8. If the browser is suspended, the next app activation resumes from the last durable stage.

### 6.3 On-demand processing and recovery

- A queued, failed, or manually deferred capture exposes **Process now** or **Retry**.
- Retrying a completed stage does not create duplicate ideas or action items.
- The recording, transcript, and last successful stage remain available after failure.
- Error messages state what was preserved and what the user can do next.

### 6.4 Confirmation

1. Opening a ready capture goes directly to its extracted idea review.
2. The interface states how many ideas were found.
3. Each draft exposes all structured fields, category, tags, provenance, and supporting source text.
4. The user may edit, discard, save as draft, confirm individually, or confirm all valid candidates.
5. Confirmed ideas enter the library.
6. Accepted action suggestions become distinct action records exactly once.

### 6.5 Retrieval and action

- The library searches title, summary, and tags locally.
- Category and tag filters narrow the list.
- Idea detail provides every structured field plus source capture and transcript access.
- The Actions screen collects open and completed items while retaining a link to the source idea.
- Users may copy, archive, or export an idea.

## 7. System architecture

### 7.1 Runtime boundary

- Next.js application and responsive PWA frontend.
- Dexie/IndexedDB is the source of truth for recordings, transcripts, extraction state, ideas, categories, tags, and actions.
- Next.js server routes proxy transcription and GPT-5.6 requests.
- API credentials remain server-side.
- The server does not become a user-content database for this MVP.
- A service worker provides the installable/offline shell, but is not relied on for long-running model calls.

### 7.2 Entity relationship

```text
CaptureSession
  ├── Recording?                  one recorded-audio source
  ├── Transcript                 current editable transcript
  ├── ExtractionRun[]            immutable processing history
  └── Idea[]                     draft or confirmed independent ideas
        ├── Category             exactly one
        ├── Tag[]                zero or more
        └── ActionItem[]         accepted next steps
```

### 7.3 Processing states

The data layer may use detailed states while the interface groups them into simpler labels.

```text
saved
  → queued
  → transcribing
  → transcript_ready
  → segmenting
  → organizing
  → ready_for_review
  → partially_confirmed | confirmed
```

Any processing state may transition to `failed` with a recoverable stage marker. A retry continues from the last valid persisted artifact.

### 7.4 Reliability rules

- Never start network processing before local recording persistence succeeds.
- Queue entries are durable, not in-memory-only.
- A processing attempt has an idempotency key derived from capture, transcript version/hash, schema version, and stage.
- A retry may create a new immutable `ExtractionRun` but may not silently overwrite confirmed ideas.
- Editing a transcript creates a new transcript version and marks prior draft results stale.
- Reprocessing an edited transcript creates new drafts while preserving confirmed ideas until the user explicitly replaces or archives them.
- Generated suggestions have stable IDs. Action acceptance uses a unique idea-plus-suggestion key.

## 8. Data model

The implementation may adjust exact names to fit the existing repository, but it must preserve these semantics.

### 8.1 CaptureSession

```ts
type CaptureSource = 'audio' | 'text';

interface CaptureSession {
  id: string;
  source: CaptureSource;
  recordingId?: string;
  transcriptId?: string;
  activeExtractionRunId?: string;
  processingState: ProcessingState;
  recoverableStage?: ProcessingStage;
  processingPreference: 'automatic' | 'manual';
  lastError?: ProcessingError;
  createdAt: string;
  updatedAt: string;
}
```

### 8.2 Recording

```ts
interface Recording {
  id: string;
  captureSessionId: string;
  blob: Blob;
  mimeType: string;
  durationMs: number;
  sizeBytes: number;
  createdAt: string;
}
```

### 8.3 Transcript

```ts
interface Transcript {
  id: string;
  captureSessionId: string;
  version: number;
  text: string;
  source: 'transcription' | 'typed' | 'edited';
  segments?: TranscriptSegment[];
  contentHash: string;
  createdAt: string;
  updatedAt: string;
}
```

### 8.4 ExtractionRun

```ts
interface ExtractionRun {
  id: string;
  captureSessionId: string;
  transcriptId: string;
  transcriptHash: string;
  schemaVersion: string;
  segmentationPromptVersion: string;
  organizationPromptVersion: string;
  model: string;
  reasoningEffort: string;
  status: 'running' | 'succeeded' | 'failed' | 'superseded';
  stage: 'segmenting' | 'organizing';
  attempt: number;
  startedAt: string;
  completedAt?: string;
  latencyMs?: number;
  errorCode?: string;
}
```

### 8.5 Grounded content

```ts
type ContentBasis = 'explicit' | 'inferred' | 'suggested';

interface SourceSpan {
  id: string;
  startChar: number;
  endChar: number;
  quote: string;
}

interface GroundedText {
  id: string;
  text: string;
  basis: ContentBasis;
  sourceSpanIds: string[];
}
```

Anything labeled `explicit` must reference at least one valid source span. `Inferred` describes a reasonable interpretation. `Suggested` is a new model recommendation rather than a claim about what the user said.

### 8.6 Idea

```ts
interface Idea {
  id: string;
  captureSessionId: string;
  extractionRunId: string;
  status: 'draft' | 'confirmed' | 'archived';
  title: string;
  summary: GroundedText;
  purpose?: GroundedText;
  goals: GroundedText[];
  problem?: {
    statement: GroundedText;
    type?: string;
  };
  blockers: GroundedText[];
  questions: GroundedText[];
  suggestedActions: GroundedText[];
  research: {
    needed: boolean;
    assessment?: GroundedText;
    suggestedQueries: string[];
    suggestedResourceTypes: string[];
  };
  categoryId: string;
  categoryConfidence?: number;
  tagIds: string[];
  sourceSpans: SourceSpan[];
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
}
```

### 8.7 Category

```ts
interface Category {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  isFallback: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
```

- Names are unique after normalization.
- `Misc` is the fallback and cannot be deleted.
- Deleting any other category requires an explicit reassignment transaction, defaulting to Misc.
- Classification descriptions should contain positive examples, boundary examples, and distinguishing language.

### 8.8 Tag

```ts
interface Tag {
  id: string;
  name: string;
  normalizedName: string;
  createdAt: string;
}
```

- Tag matching is case-insensitive.
- Model-suggested tags are normalized and deduplicated before persistence.
- The model should return a small useful set rather than exhaustively tagging every noun.

### 8.9 ActionItem

```ts
interface ActionItem {
  id: string;
  ideaId: string;
  sourceSuggestionId?: string;
  text: string;
  status: 'open' | 'completed';
  createdAt: string;
  completedAt?: string;
}
```

An accepted generated action uses `ideaId + sourceSuggestionId` as a uniqueness boundary so repeated confirmation cannot create duplicates.

## 9. GPT-5.6 organization engine

The implementation follows the [official GPT-5.6 guidance](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-5.6): use the Responses API, structured output, configurable reasoning effort, and server-side credentials.

### 9.1 Stage 1: separation

Stage 1 receives the transcript as untrusted source material. It identifies distinct idea boundaries without categorizing or enriching them.

Required output:

```ts
interface SegmentationResult {
  schemaVersion: string;
  ideas: Array<{
    candidateId: string;
    coreStatement: string;
    sourceSpans: SourceSpan[];
  }>;
}
```

Rules:

- Zero ideas is a valid result.
- Repetition and self-correction should not create duplicate candidates.
- Related ideas remain separate when they represent different intended outcomes or projects.
- Every candidate must be grounded in at least one source span.
- Instructions inside transcripts are data, not instructions to the model.

### 9.2 Stage 2: organization

Stage 2 receives separated source material plus the current allowed categories and their descriptions.

It returns:

- Title and concise summary.
- Purpose and goals.
- Problem statement and optional type.
- Blockers and questions.
- Suggested actions.
- Research-needed assessment, suggested search questions, and suggested resource types.
- Exactly one allowed category ID and confidence.
- A small set of useful tag names.
- Provenance and valid source references.
- Warnings when information is ambiguous.

The model may not invent category IDs. If no category fits adequately, it returns Misc. Missing information remains empty rather than being fabricated.

### 9.3 Configuration

- Default model: `gpt-5.6`.
- Initial reasoning baseline: medium.
- Model, reasoning effort, schema version, and prompt versions are environment-configurable.
- Higher reasoning may be tested for separation if the evaluation gain justifies cost and latency.
- The UI and README expose non-sensitive model metadata for event verification.

### 9.4 Error handling

- Validate structured output before database writes.
- Retry a transient or schema failure at most once automatically.
- Preserve the last successful artifact between stages.
- Return stable, user-safe error codes from server routes.
- Never store partial invalid candidates as reviewable ideas.
- Do not write raw transcripts to production server logs.

## 10. Evaluation design

The committed fixture set must cover:

- One clear idea.
- Several unrelated ideas.
- Related but distinct ideas.
- Repetition and self-correction.
- Tangents and filler.
- Explicit versus implied goals.
- Explicit versus suggested actions.
- Blockers and research needs.
- Ambiguous categories.
- Custom category descriptions.
- Transcription noise or errors.
- No meaningful idea.
- Duplicate ideas.
- Prompt-injection text inside the transcript.

Quality gates:

- 100% schema-valid output after no more than one retry.
- 100% of returned category IDs belong to the supplied list.
- At least 90% correct idea-boundary results on the agreed canonical fixture set.
- At least 85% category accuracy.
- No unsupported statement labeled `explicit`.
- No duplicate idea or action records after retries.
- Manual usefulness scoring for title, summary, tags, and suggested actions.
- Saved before-and-after evaluation report suitable for submission evidence.

The evaluation harness is a development and evidence tool, not a user-facing feature.

## 11. User interface contract

The visual source of truth is [NUGGET_MVP_DESIGN_AGENT_BRIEF.md](../../design/NUGGET_MVP_DESIGN_AGENT_BRIEF.md) plus the user's forthcoming design system. The approved [initial direction](../../design/references/nugget-initial-design-direction.png) and [six-screen concept board](../../design/references/nugget-mvp-screen-board.png) use warm ivory, deep navy, and faceted amber branding. Final designs must retain truthful privacy copy and separate active recording from post-save results.

### 11.1 Navigation

Persistent mobile bottom navigation:

- Capture
- Ideas
- Actions

Settings is accessed from the header. A review-required badge appears where it is useful without becoming another primary tab.

### 11.2 Required areas

1. **Capture home:** record control, pasted-text fallback, review count, recent capture status.
2. **Active recording:** timer, audio feedback, stop/save, accidental-navigation protection.
3. **Capture detail/processing:** playback, transcript, state progression, retry, process now, edit/reprocess.
4. **Idea confirmation:** separate candidate views, rich editing, category and tags, provenance, sources, discard and confirm.
5. **Idea library:** local search, category/tag filters, organized idea rows, review callout.
6. **Idea detail:** complete record, editing, sources, related actions, archive/copy/export.
7. **Actions:** open/completed items linked to source ideas.
8. **Categories/settings:** category descriptions, processing preferences, privacy, export, and deletion.

### 11.3 Required states

- Microphone permission denied.
- Browser recording unsupported.
- Storage unavailable or full.
- Offline capture queued.
- Transcription failure.
- Organization/schema failure.
- Edited transcript awaiting reprocessing.
- No meaningful ideas found.
- Empty library.
- No search results.
- Category reassignment required.

Each failure state names what was preserved and provides the next valid action.

### 11.4 Accessibility

- WCAG AA contrast.
- Minimum 48-pixel primary touch targets.
- Screen-reader names for recording state, timer, progress, waveform, and icon-only controls.
- Keyboard-operable desktop layouts with visible focus.
- Reduced-motion alternative to the waveform-to-idea transformation.
- Status and category meaning never relies on color alone.
- iOS and Android safe-area support.

## 12. Privacy, security, and trust

### 12.1 Truthful data messaging

- Recordings, transcripts, ideas, categories, tags, and actions are stored in the user's local browser database.
- The MVP has no cloud sync or server-side user-content database.
- When real cloud processing is enabled, content is intentionally sent to transcription and GPT-5.6 endpoints.
- The interface must not claim `100% local processing`, `fully on device`, or `everything stays on your device` while cloud processing is active.
- Users can inspect the processing mode and delete or export their local data.

### 12.2 Server-route safeguards

- Keep all provider credentials server-side.
- Validate method, content type, payload size, audio duration/size, transcript length, and structured inputs.
- Normalize upstream failures into stable response codes.
- Apply practical anonymous rate and usage controls without introducing sign-in friction for judges.
- Send a privacy-preserving stable safety identifier when appropriate.
- Avoid logging raw audio, transcripts, or structured idea content.
- Set appropriate security headers and provide a minimal health/configuration status path that exposes no secrets.

### 12.3 Local controls

- Export all user data.
- Delete all local user data with strong confirmation.
- Surface quota failures before discarding an in-memory recording.
- Make audio retention behavior explicit.

## 13. Verification strategy

This project does not use full TDD. Tests are added where failure would damage user data, model trust, the primary demo, or the ability to deploy.

### 13.1 Focused automated verification

- Dexie schema migration and existing-data preservation.
- GPT response-schema validation.
- Canonical extraction evaluation fixtures.
- Processing state transitions and resume behavior.
- Idempotent extraction and action acceptance.
- Category integrity, fallback, normalization, and deletion/reassignment.
- API validation and stable error handling.
- Critical end-to-end flows:
  1. Record → process → confirm → find in library.
  2. Offline record → reopen/reconnect → process.
  3. Failed extraction → retry without duplicates.

### 13.2 Manual verification

- Real microphone on at least one phone and one desktop browser.
- Current mobile Safari and Chromium-based browser behavior where devices are available.
- Responsive layout and one-handed usability.
- PWA installability and offline capture.
- Keyboard and screen-reader basics.
- Accurate local/cloud disclosures.
- Deployed production behavior.
- Final demonstration path and script.

### 13.3 Required build checks

- Dependency installation succeeds from the committed lockfile.
- Typecheck passes.
- Lint passes.
- Focused tests pass.
- Evaluation gates pass or any approved exception is documented.
- Production build passes.
- Deployed smoke test passes.

There is no arbitrary coverage percentage, broad snapshot suite, or requirement that every implementation change begin with a failing test.

## 14. Sprint program

### Sprint 0 — Baseline and build readiness

- Document pre-event functionality at commit `5394b9a`.
- Restore dependencies and run all current checks.
- Fix only existing blockers that prevent a stable starting point.
- Establish environment, prompt-version, evidence, and deployment conventions.

**Exit:** The existing prototype runs and its baseline is documented.

### Sprint 1 — Mobile capture and durable processing foundation

- Separate capture sessions from ideas.
- Add categories, tags, rich idea fields, and safe migrations.
- Build persisted state, queue, retry, resume, and idempotency.
- Guarantee local save before processing.
- Add pasted-text capture.

**Exit:** Captures cannot be lost, and one capture may safely own multiple draft ideas.

### Sprint 2 — GPT-5.6 organization engine

- Migrate to Responses API and GPT-5.6.
- Implement separation and organization stages.
- Add strict validation, provenance, classification, and prompt versioning.
- Build and tune the evaluation suite.

**Exit:** Representative rambles produce grounded, distinct, structured candidates at the approved quality level.

### Sprint 3 — Capture, processing, and confirmation experience

- Implement the approved design system for Capture, Recording, Processing, and Review.
- Add all important recovery states.
- Make every generated field editable.
- Add discard, save-draft, confirm, and duplicate-safe action creation.

**Exit:** A mobile user can complete the full capture-to-confirmation flow.

### Sprint 4 — Organized library and usefulness layer

- Add search, filters, idea detail/editing, Actions, category settings, export, privacy, and local-data controls.

**Exit:** Confirmed ideas are organized, retrievable, editable, and actionable.

### Sprint 5 — PWA, security, and reliability

- Add installability and offline app shell.
- Harden routes, configuration, privacy messaging, storage recovery, and deployment.
- Run focused automated and real-device verification.

**Exit:** The public build is reliable and the critical flow works on a real phone.

### Sprint 6 — Demo and submission

- Complete sample data, README, license, evidence, screenshots, Devpost copy, video, Session ID, and production smoke test.

**Exit:** The application, repository, description, and video tell the same truthful story and are submitted by the internal deadline.

## 15. Terra handoff requirements

Each implementation plan produced from this design must include:

- Sprint objective and user-visible outcome.
- Dependencies and explicit prerequisites.
- Existing repository context and likely files affected.
- Ordered implementation tasks with concrete interfaces and data behavior.
- Scope exclusions to prevent expansion.
- Focused automated checks and manual verification.
- Acceptance criteria that can be demonstrated.
- A suggested commit checkpoint.
- Evidence or screenshot expectations.
- A clean handoff note for the next sprint.

The plans must be executable without requiring Terra to reinterpret the product. Visual tasks point to the design brief and the final user-provided design system rather than inventing an unrelated interface.

## 16. Definition of MVP complete

The MVP is complete only when all of the following are true:

- A user can record an idea on a phone without logging in or entering metadata.
- The recording is locally safe before the interface claims it is saved.
- A queued or interrupted capture can resume processing.
- A real transcript can be converted by GPT-5.6 into multiple distinct ideas.
- Structured results are schema-valid and grounded.
- Users can edit, categorize, tag, discard, and confirm ideas.
- Confirmed ideas are searchable, filterable, editable, and exportable.
- Suggested actions can be accepted and completed without duplicates.
- Offline capture works and the app is installable.
- Privacy language accurately distinguishes local storage from cloud processing.
- Focused checks, evaluation gates, typecheck, lint, build, and deployed smoke test pass.
- The production demo works without special access or payment.
- README, video, repository, application, and Devpost description remain consistent.

## 17. Final product narrative

Nugget is not another recorder and not another AI summary screen. It is a fast capture surface for people in motion and an organization engine for the thoughts that normally disappear into long voice notes. GPT-5.6 provides the central intelligence: recognizing where one idea ends and another begins, turning each into a useful record, and proposing structure while preserving the user's authority to confirm or correct it.
