# Nugget Product Requirements Document (PRD)

**Version:** 0.1 draft  
**Date:** June 22, 2026  
**Status:** Draft for planning and implementation

## Document Control
| Field | Value |
| --- | --- |
| Product | Nugget |
| Document type | Product Requirements Document (PRD) |
| Version | 0.1 draft |
| Date | June 22, 2026 |
| Primary audience | Founder/product owner, coding agent, design/engineering contributors |
| MVP platform assumption | iPhone-first local-first PWA using Next.js, React, TypeScript, Dexie/IndexedDB, MediaRecorder/Web Audio, and pluggable transcription/extraction services. |
| Positioning | Turn spoken ideas into structured summaries, nuggets, and action items while keeping user data private by default. |

## Working Assumptions
- Nugget starts as an iPhone-friendly PWA and desktop web app. A native React Native/Expo version or wrapper can be evaluated later if browser limitations block core quality.
- Local-first means recordings, transcripts, extracted nuggets, and action items are stored on the user device by default. No audio, transcript, or idea content is uploaded unless the user explicitly starts a processing or sync action that explains what leaves the device.
- The first build should include mock processing so the app can be built and tested before final transcription and AI providers are chosen.
- No API keys or long-lived model credentials are stored in the client app. Cloud transcription/extraction, if enabled, goes through server-side API routes or a user-controlled BYOK configuration later.
- The MVP is for personal idea capture and personal productivity, not a meeting recorder, therapy product, medical product, or team collaboration platform.

## 1. Executive Summary
Nugget is a privacy-first voice capture app for people who think out loud. It lets a user quickly record an idea, save the raw recording locally, generate a transcript, extract the useful “nuggets,” and turn those nuggets into actionable items that can be reviewed, edited, searched, and exported.

The product should feel like a calm personal thinking inbox: fast to open, forgiving when thoughts are messy, and structured enough to turn rambling voice notes into usable next steps.

The MVP should prove three things: users can capture ideas with near-zero friction; the app can reliably transform recordings into helpful structured output; and users trust the privacy model enough to record real thoughts.


## 2. Product Vision and Principles
### Vision

Nugget becomes a trusted local memory layer for spoken ideas: a place where half-formed thoughts can land safely and be refined into summaries, decisions, open questions, tasks, and project notes.

### Guiding principles

- Capture first, organize later. Recording must be faster than opening a notes app and typing.
- Private by default. The user should never wonder whether an idea was uploaded.
- AI is an assistant, not the source of truth. Extracted nuggets must remain editable and traceable to the original transcript/recording.
- Local-first does not mean trapped. Users must be able to export their data in open formats.
- Useful beats flashy. The app should focus on daily reliability, readable output, and clear workflows over novelty features.


## 3. Problem Statement
Ideas often arrive when the user is walking, driving, doing chores, or away from a keyboard. Voice memos are easy to capture but hard to review. Notes apps are searchable but slow for free-form speech. AI chat can organize thoughts, but it often requires copying transcripts into a cloud tool, losing context, privacy, and continuity.

Nugget addresses the gap between raw voice capture and usable follow-through. It should preserve the raw recording, generate a clean transcript, extract the useful parts, and create actionable items without forcing the user to build a manual productivity system first.


## 4. Target Users and Personas
| Type | Persona | Description | Needs |
| --- | --- | --- | --- |
| Primary | Idea-driven builder | Captures app ideas, product thoughts, technical notes, story concepts, and work reminders throughout the day. | Needs low-friction capture, strong search, action item extraction, project tagging, and export. |
| Primary | Busy professional | Has thoughts between meetings or while away from a desk and wants to turn them into tasks before they vanish. | Needs quick recording, concise summaries, reminders/actions, and trust that sensitive work thoughts are private. |
| Secondary | Creative writer / podcaster | Records fragments of stories, scripts, scenes, jokes, or audio book ideas. | Needs capture, tags, searchable memory, export to Markdown, and the ability to keep raw recordings. |
| Secondary | Neurodivergent / ADHD-leaning user | May lose interest in long capture flows or forget to return to voice notes. | Needs frictionless capture, gentle review prompts, lightweight organization, and visible next actions. |


## 5. Goals and Non-Goals
### MVP goals

- Enable one-tap voice capture on iPhone and desktop browser.
- Store recordings, transcripts, extracted nuggets, and actions locally by default.
- Provide a transcript and structured extraction workflow with mock providers first, then pluggable real providers.
- Let the user review, edit, accept, reject, and organize extracted output.
- Make all saved content searchable and exportable.
- Clearly communicate privacy and processing state before any data leaves the device.

### Non-goals for MVP

- Real-time meeting bot, call recorder, or always-on microphone capture.
- Team workspaces, shared projects, comments, or collaborative editing.
- Mandatory cloud sync or account creation.
- Complex project management replacement for tools like Jira, Todoist, Linear, or Notion.
- Medical, legal, financial, or therapeutic advice generation.
- Guaranteed offline transcription quality across all browsers and devices in the first release.


## 6. Product Scope by Release Phase
| Phase | Theme | Scope |
| --- | --- | --- |
| MVP / Alpha | Capture and local library | PWA shell, install prompt guidance, onboarding/privacy notice, microphone permissions, recording, playback, local storage, basic list/detail views. |
| MVP / Alpha | Mock processing | Mock transcription and extraction adapters that return deterministic sample output for development and demos. |
| MVP / Beta | Real processing path | Pluggable transcription/extraction using feature detection and/or explicit opt-in API processing. User sees exactly what will be processed. |
| MVP / Beta | Review and action workflow | Structured nugget review, editable summaries, action item CRUD, tags, projects, search, export Markdown/JSON. |
| V1 | Trust and retention | Storage usage screen, retention controls, export/import, backup guidance, optional app-lock/encryption approach. |
| Post-V1 | Integrations and native path | Apple Reminders/Shortcuts export, calendar/task app integrations, optional React Native/Expo app or Capacitor wrapper, optional encrypted sync. |


## 7. Core User Journeys
### J1. Capture a quick thought
1. User opens Nugget from Home Screen or browser.
2. User taps Record.
3. App requests microphone permission only when needed.
4. App shows timer, recording state, and basic audio level feedback.
5. User stops recording and chooses Save, Process Now, or Delete.
6. Recording is saved locally with timestamp, duration, and default title.

### J2. Turn a recording into nuggets
1. User opens a saved recording detail page.
2. User taps Transcribe/Extract.
3. If processing uses cloud, app shows explicit consent and provider explanation before upload.
4. App creates a processing job and shows progress/retry state.
5. App stores transcript and extraction result locally.
6. User reviews summary, nuggets, actions, questions, and tags.

### J3. Review and act
1. User opens the review queue or an idea detail screen.
2. User edits transcript or extracted items when the AI is wrong.
3. User accepts selected action items and assigns project, priority, due date, and status.
4. Accepted actions appear in the Actions view and remain linked to their source recording.

### J4. Find an old idea
1. User searches by keyword, tag, project, transcript text, nugget text, or action title.
2. App returns matching ideas quickly from local indexed data.
3. User opens the result, plays the source audio, reviews extracted notes, or exports it.

### J5. Export or leave
1. User opens Settings or an idea detail screen.
2. User exports one idea, a project, or the full database as Markdown and/or JSON.
3. Export includes recordings metadata, transcripts, nuggets, and action items. Audio export can be included separately or as a ZIP in later phases.


## 8. Information Architecture and Screens
| Screen | Purpose | Outcome |
| --- | --- | --- |
| Onboarding / Privacy | Explains local-first model, microphone permission timing, processing choices, and what will/won’t leave the device. | User understands privacy before recording. |
| Home / Inbox | Recent ideas, quick record CTA, pending processing, pending review, open actions. | User can capture or continue review in one tap. |
| Recorder | Record/stop controls, duration, audio level meter, save/delete/process options. | User records confidently and knows it is being captured. |
| Idea Library | Searchable list of recordings/ideas with filters for project, tag, status, and processing state. | User can find saved ideas. |
| Idea Detail | Playback, metadata, transcript, summary, nuggets, actions, questions, tags, processing history. | User can review the full context of an idea. |
| Nugget Review | Focused accept/reject/edit flow for extracted items. | User can turn AI output into trusted saved output. |
| Actions | Action items grouped by status, project, priority, due date, and source. | User sees what to do next. |
| Settings | Privacy mode, processing providers, local storage usage, retention, export/import, app reset. | User controls data and app behavior. |


## 9. Functional Requirements
### Onboarding and privacy
| ID | Priority | Requirement |
| --- | --- | --- |
| FR-001 | P0 | Show first-run onboarding that explains local storage, optional processing, and privacy defaults. |
| FR-002 | P0 | Do not request microphone permission until the user initiates recording. |
| FR-003 | P0 | Clearly label processing modes: Local/mock, browser/on-device where available, and cloud/API opt-in. |
| FR-004 | P0 | Before any cloud/API processing, show a consent confirmation that names the data being sent and the purpose. |
| FR-005 | P1 | Provide a privacy status indicator in Settings and on processing screens. |
### Recording and playback
| ID | Priority | Requirement |
| --- | --- | --- |
| FR-101 | P0 | Start, stop, save, and delete a voice recording from a dedicated Recorder screen. |
| FR-102 | P0 | Display recording duration and current recording state. |
| FR-103 | P0 | Show a simple audio level meter or waveform-style feedback while recording. |
| FR-104 | P0 | Save recording audio as a local Blob with metadata including createdAt, duration, MIME type, and file size. |
| FR-105 | P0 | Provide playback controls on the idea detail screen. |
| FR-106 | P1 | Support pause/resume recording where browser support and implementation complexity allow. |
| FR-107 | P1 | Warn the user when storage is low or a recording is unusually long. |
### Local library and organization
| ID | Priority | Requirement |
| --- | --- | --- |
| FR-201 | P0 | List saved ideas in reverse chronological order with title, date, duration, processing state, and action count. |
| FR-202 | P0 | Allow users to rename an idea and edit basic metadata. |
| FR-203 | P0 | Support tags and projects for organizing ideas. |
| FR-204 | P0 | Support archive and delete. Delete must remove associated transcript, extraction, nuggets, and actions after confirmation. |
| FR-205 | P1 | Support favorites or pinned ideas. |
| FR-206 | P1 | Support bulk actions for archive, export, delete, and assign project/tag. |
### Transcription
| ID | Priority | Requirement |
| --- | --- | --- |
| FR-301 | P0 | Implement a transcription service interface with at least a mock adapter for MVP development. |
| FR-302 | P0 | Store transcripts locally and link them to the source recording. |
| FR-303 | P0 | Allow the user to edit transcript text manually. |
| FR-304 | P0 | Track transcription job state: queued, processing, complete, failed, canceled. |
| FR-305 | P1 | Support multiple transcription providers behind a common adapter contract. |
| FR-306 | P1 | Support retry and provider switching without losing source recording. |
### Nugget extraction
| ID | Priority | Requirement |
| --- | --- | --- |
| FR-401 | P0 | Implement an extraction service interface that returns structured summary, nuggets, actions, questions, tags, and confidence values. |
| FR-402 | P0 | Allow the user to review, edit, accept, reject, or regenerate extracted items. |
| FR-403 | P0 | Every extracted item must link back to the source transcript and recording. |
| FR-404 | P0 | Extracted action items should include title, optional description, status, priority, due date, project, and source idea ID. |
| FR-405 | P1 | Show source snippets or transcript spans that explain why an item was extracted. |
| FR-406 | P1 | Support extraction presets such as “product idea,” “work reminder,” “story idea,” and “general thought.” |
### Action management
| ID | Priority | Requirement |
| --- | --- | --- |
| FR-501 | P0 | Provide an Actions screen for accepted action items. |
| FR-502 | P0 | Allow create, edit, complete, reopen, archive, and delete actions. |
| FR-503 | P0 | Allow actions to be grouped or filtered by project, status, priority, and due date. |
| FR-504 | P0 | Maintain a source link from each action to the idea recording/transcript it came from. |
| FR-505 | P1 | Support manual actions that do not originate from a recording. |
| FR-506 | P2 | Export actions to Apple Reminders, Shortcuts, calendar, Markdown task lists, or third-party task apps. |
### Search and retrieval
| ID | Priority | Requirement |
| --- | --- | --- |
| FR-601 | P0 | Search across idea titles, transcript text, summary, nuggets, action titles, questions, tags, and projects. |
| FR-602 | P0 | Return search results with enough context to identify the matching idea. |
| FR-603 | P1 | Filter search by date range, project, tag, processing state, action status, and favorite/archive state. |
| FR-604 | P2 | Add semantic search or local embeddings when privacy-preserving implementation is viable. |
### Export, import, and retention
| ID | Priority | Requirement |
| --- | --- | --- |
| FR-701 | P0 | Export one idea or selected ideas to Markdown. |
| FR-702 | P0 | Export all structured app data to JSON for portability. |
| FR-703 | P1 | Import a prior JSON export and reconcile duplicates safely. |
| FR-704 | P1 | Show local storage usage and large recordings. |
| FR-705 | P1 | Provide retention settings such as keep forever, delete raw audio after transcript, or archive after N days. |
| FR-706 | P2 | Export audio files as a ZIP package with metadata manifest. |
### Settings and administration
| ID | Priority | Requirement |
| --- | --- | --- |
| FR-801 | P0 | Settings must include privacy mode, processing provider settings, export, reset, and app version. |
| FR-802 | P0 | Provide a safe “nuclear reset” that clearly explains data deletion before clearing local storage. |
| FR-803 | P1 | Support optional app lock/passphrase or encrypted vault mode where feasible. |
| FR-804 | P1 | Provide debug tools for database health, processing job queue, and test sample data during development. |


## 10. Non-Functional Requirements
| ID | Category | Requirement |
| --- | --- | --- |
| NFR-001 | Privacy | No user content upload by default. Any network processing must be explicit, contextual, and cancellable before it starts. |
| NFR-002 | Security | No API keys in the client. Server-side routes must validate payload sizes, sanitize errors, and avoid persistent server storage unless explicitly introduced later. |
| NFR-003 | Local durability | Saved recordings and metadata should survive browser refresh, app relaunch, and offline usage unless the user clears browser/app data. |
| NFR-004 | Offline behavior | Core capture, library browsing, playback of saved local recordings, manual editing, and export of structured data should work offline. |
| NFR-005 | Performance | Home and library screens should feel instant for hundreds of ideas. Long processing jobs must not freeze the UI. |
| NFR-006 | Accessibility | Keyboard navigation, screen reader labels, high contrast, visible focus states, and reduced-motion support are required for core flows. |
| NFR-007 | Reliability | Processing failures must leave the original recording intact and present a retry path. |
| NFR-008 | Portability | The user must be able to export structured data in open formats without creating an account. |
| NFR-009 | Maintainability | Recorder, storage, transcription, extraction, and export logic should be separated into testable services/adapters. |
| NFR-010 | Cost control | Cloud processing must be optional and rate-limitable. Mock/local mode must support development without paid APIs. |


## 11. Data Model
The schema should be implemented with Dexie/IndexedDB for the PWA MVP. The service layer should hide storage details so a future native storage implementation can reuse the same domain model.

| Entity | Purpose | Key fields |
| --- | --- | --- |
| settings | Stores app-level preferences. | id, privacyMode, processingMode, providerConfigRef, retentionPolicy, encryptionEnabled, createdAt, updatedAt |
| ideas | Primary record for each saved voice idea. | id, title, createdAt, updatedAt, durationMs, status, projectId, tags, favorite, archived, sourceType |
| recordings | Stores local audio Blob and audio metadata. | id, ideaId, blob, mimeType, sizeBytes, durationMs, waveformPreview, checksum, createdAt |
| transcripts | Stores transcript text and provider metadata. | id, ideaId, text, segments, language, provider, confidence, jobId, createdAt, updatedAt |
| extractionRuns | Stores each extraction attempt and raw structured result. | id, ideaId, transcriptId, provider, promptVersion, schemaVersion, status, rawJson, createdAt |
| nuggets | Stores accepted or pending extracted insights. | id, ideaId, extractionRunId, title, detail, category, confidence, sourceSpan, status |
| actionItems | Stores actionable tasks from extraction or manual entry. | id, ideaId, title, description, status, priority, dueDate, projectId, tags, sourceSpan, createdAt, updatedAt |
| questions | Stores open questions extracted from an idea. | id, ideaId, text, status, sourceSpan, createdAt |
| projects | User-defined project buckets. | id, name, description, color, archived, createdAt, updatedAt |
| tags | User-defined or suggested tags. | id, name, usageCount, createdAt, updatedAt |
| processingJobs | Tracks queued transcription/extraction operations. | id, ideaId, type, provider, status, progress, errorMessage, createdAt, updatedAt |
| exports | Records export history and export settings. | id, scope, format, itemCount, createdAt |


## 12. Processing Architecture
Nugget should use a pluggable processing pipeline so capture and review can be built before provider decisions are final.

- RecorderService captures audio and writes the source recording to local storage.
- IdeaRepository reads/writes ideas, recordings, transcripts, extraction runs, nuggets, actions, projects, tags, and settings.
- ProcessingQueue stores jobs locally and allows retry, cancel, and failure recovery.
- TranscriptionProvider interface supports mock, browser/on-device, local WASM, or server/API adapters.
- ExtractionProvider interface supports mock, local model, or server/API adapters.
- ReviewService converts raw extraction output into editable pending items and accepted saved items.
- ExportService creates Markdown and JSON exports without requiring a server account.

### Provider contract examples

```ts
type TranscriptionProvider = {
  id: string;
  label: string;
  mode: "mock" | "local" | "browser" | "cloud";
  transcribe(input: { ideaId: string; recordingId: string; audioBlob: Blob }): Promise<TranscriptResult>;
};

type ExtractionProvider = {
  id: string;
  label: string;
  mode: "mock" | "local" | "cloud";
  extract(input: { ideaId: string; transcript: string; context?: ExtractionContext }): Promise<ExtractionResult>;
};
```


## 13. API and Integration Requirements
| Endpoint | Purpose |
| --- | --- |
| POST /api/transcribe | Optional cloud transcription route. Accepts audio file plus metadata after explicit user consent. Returns transcript text, optional segments, confidence, language, provider metadata. Server must not persist audio by default. |
| POST /api/extract | Optional cloud extraction route. Accepts transcript and context. Returns structured JSON matching the extraction schema. Server must not persist transcript by default. |
| GET /api/health | Development/support endpoint for checking backend availability without sending user content. |

All API usage is optional for the MVP. The app must work in mock/local mode so development, demos, and basic manual workflows do not depend on cloud providers.

### Extraction result schema

```json
{
  "summary": "One-paragraph summary of the recording.",
  "nuggets": [
    { "title": "Short insight", "detail": "Useful detail", "category": "idea|decision|risk|note", "confidence": 0.0, "sourceSpan": { "start": 0, "end": 120 } }
  ],
  "actions": [
    { "title": "Action title", "description": "Optional detail", "priority": "low|medium|high", "dueDate": null, "project": null, "confidence": 0.0, "sourceSpan": { "start": 0, "end": 120 } }
  ],
  "questions": ["Open question to revisit"],
  "tags": ["suggested-tag"],
  "warnings": ["Any uncertainty or missing context"]
}
```


## 14. UX, Content, and Interaction Requirements
- Tone should be calm, minimal, and dark-mode friendly. The app should feel like a trusted personal notebook, not enterprise software.
- Primary CTA should be Record. Secondary CTAs should be Review, Search, Actions, and Export.
- Use plain language around privacy: “Stored on this device” and “Will be sent for processing” rather than technical jargon.
- Never destroy raw recordings automatically unless the user has configured a retention policy and sees the consequence clearly.
- Processing output should be presented as suggestions. The user should accept or edit important items before they become trusted actions.
- Use empty states that encourage capture: “Record a thought. Nugget will help pull out the useful parts.”
- Use error states that preserve trust: “The extraction failed, but your original recording is safe.”


## 15. Privacy, Security, and Data Handling
### Privacy rules

- Default state is local-only. The app stores user content in the browser/device local database.
- Any cloud processing requires explicit user action and contextual confirmation.
- The app must not silently sync, upload telemetry containing content, or send recordings in background jobs.
- Exports should be user-initiated and visibly scoped.
- Reset and delete flows must be clear, confirm destructive operations, and avoid accidental data loss.

### Security rules

- Do not store API keys in client-side code, browser storage, or app bundles.
- Validate upload sizes and types on optional API routes.
- Avoid logging transcript or audio content in server logs.
- Sanitize errors returned to the client so provider details or secrets are not exposed.
- Add Content Security Policy and dependency hygiene before public beta.
- Treat local-only as a privacy benefit, not a complete security guarantee. Optional encrypted vault mode should be scoped and tested separately.


## 16. Success Metrics
Because Nugget is privacy-first, metrics should initially be local-only or opt-in. During early testing, product learning can rely on user interviews, manual feedback, and local debug summaries rather than hidden content telemetry.

| Metric | Definition | Target |
| --- | --- | --- |
| Activation | User records first idea and saves it locally. | >= 70% of testers who open the app complete a first saved recording. |
| Capture quality | Saved recordings that can be played back. | >= 98% successful playback for saved recordings in supported browsers. |
| Processing usefulness | Accepted extracted nuggets/actions divided by generated suggestions. | >= 50% accepted or edited-and-accepted after early prompt/provider tuning. |
| Follow-through | Recordings that produce at least one accepted action item. | >= 35% for users using action workflow. |
| Retention | Users who record at least three ideas in the first week. | >= 40% of active testers. |
| Trust | Users who report understanding what is local vs uploaded. | >= 90% in beta feedback survey. |
| Portability | Users can export data without account creation. | 100% supported in MVP. |


## 17. MVP Acceptance Criteria
| ID | Scenario | Acceptance criterion |
| --- | --- | --- |
| AC-001 | First recording | Given a new user opens Nugget, when they tap Record and grant microphone permission, then the app shows an active timer and audio-level feedback. |
| AC-002 | Local save | Given a user stops recording, when they tap Save, then the recording and metadata are saved locally and appear in the library without requiring network access. |
| AC-003 | Offline library | Given the device is offline, when the user opens Nugget, then saved ideas, transcripts, actions, and playback for local recordings remain available. |
| AC-004 | Cloud consent | Given a processing provider would send data to a server, when the user taps Process, then Nugget must show a consent explanation before upload begins. |
| AC-005 | Processing failure safety | Given transcription or extraction fails, then the original recording remains intact and the user can retry or change provider. |
| AC-006 | Editable transcript | Given a transcript exists, when the user edits and saves it, then search and later extraction use the updated transcript. |
| AC-007 | Nugget review | Given extraction returns suggestions, when the user accepts an action, then it appears in Actions and links back to the source idea. |
| AC-008 | Search | Given an idea has transcript text and tags, when the user searches a matching term, then the idea appears in results with matching context. |
| AC-009 | Export | Given the user chooses Markdown export for an idea, then the export includes title, date, transcript, summary, nuggets, actions, questions, and tags. |
| AC-010 | Delete | Given the user confirms deleting an idea, then related recording, transcript, extraction runs, nuggets, questions, and source-linked actions are deleted or clearly detached according to product setting. |


## 18. Delivery Milestones
| Milestone | Name | Deliverable |
| --- | --- | --- |
| Milestone 1 | App shell and storage foundation | Next.js PWA shell, routing, Dexie schema, settings, sample data, service-worker/offline foundation. |
| Milestone 2 | Recording MVP | Microphone permission flow, record/stop/save/delete, playback, metadata, local library. |
| Milestone 3 | Mock processing and review | Mock transcript/extraction providers, processing queue, idea detail, review screen, action creation. |
| Milestone 4 | Search, export, and polish | Local search, tags/projects, Markdown/JSON export, error states, accessibility pass. |
| Milestone 5 | Real provider integration beta | Optional transcription/extraction providers behind consent gates, rate limits, payload guards, feedback loop. |


## 19. Epic Backlog
| Epic | Name | Scope |
| --- | --- | --- |
| EPIC-01 | PWA foundation | Installable shell, routing, offline fallback, theme, responsive layout, app metadata. |
| EPIC-02 | Local data layer | Dexie schema, repositories, migrations, seed data, database health/reset tools. |
| EPIC-03 | Recorder | Microphone permission, record/stop/save/delete, duration, level meter, playback. |
| EPIC-04 | Idea library | Inbox/list, detail page, edit title, archive/delete, tags/projects. |
| EPIC-05 | Processing queue | Job model, statuses, retry/cancel, mock provider wiring. |
| EPIC-06 | Transcription | Provider contract, mock output, editable transcript, future real providers. |
| EPIC-07 | Extraction | Provider contract, schema validation, mock output, review UI, source links. |
| EPIC-08 | Actions | Action CRUD, filters, status workflow, source idea links. |
| EPIC-09 | Search/export | Indexed local search, Markdown export, JSON export, import later. |
| EPIC-10 | Privacy/settings | Consent gates, privacy status, retention, reset, optional encrypted vault design. |
| EPIC-11 | Quality | Unit tests, integration tests, accessibility tests, browser/device QA matrix. |


## 20. Testing and QA Strategy
- Unit test service modules: recorder state machine, repository methods, provider adapters, extraction schema validation, export formatting.
- Integration test core flows: onboarding, record/save, list/detail, mock transcript, mock extraction, accept action, search, export, delete.
- Offline tests: app load after cache, save recordings offline, browse existing ideas offline, queue processing when provider unavailable.
- Browser/device tests: iPhone Safari/PWA installed mode, desktop Chrome/Edge, desktop Safari where available, microphone permission denied cases.
- Data migration tests: schema upgrades preserve existing ideas and recordings.
- Accessibility tests: keyboard navigation, screen reader labels, focus management, color contrast, reduced motion.
- Privacy tests: no network calls during local-only capture; cloud processing requires explicit confirmation; server logs avoid user content.


## 21. Risks and Mitigations
| Risk | Description | Mitigation |
| --- | --- | --- |
| R-001 | Browser recording support varies across iOS/Safari/PWA contexts. | Prototype recording early on real devices; feature-detect APIs; consider native wrapper if blockers remain. |
| R-002 | Local storage can be cleared by browser/device settings or pressure. | Warn users; provide export/import; evaluate persistent storage APIs and backup guidance. |
| R-003 | Cloud processing may undermine privacy trust. | Use explicit consent, local/mock defaults, no silent uploads, clear provider labeling. |
| R-004 | Extraction output may create inaccurate or misleading actions. | Treat AI output as suggestions; require review; include source links and confidence. |
| R-005 | Local/browser transcription quality may be inconsistent. | Use provider abstraction and allow fallback options. |
| R-006 | Encryption in browser can create false confidence if key handling is weak. | Position encrypted vault as a separate feature with explicit threat model and testing. |
| R-007 | Long recordings may cause memory/performance problems. | Set recommended limits, stream where possible, warn on large files, background queue work. |


## 22. Open Questions
- Should the first production build remain pure PWA, or should a React Native/Expo app be revived for stronger iPhone recording and storage behavior?
- What should be the default real transcription provider: local/on-device, browser-native where available, server-side Whisper-like service, or user-selected?
- Should raw audio be kept forever by default, or should Nugget recommend deleting audio after transcript/extraction is verified?
- How important is encrypted local storage for V1 versus post-V1?
- Should Nugget have accounts at all, or remain accountless until sync/integrations require identity?
- Which export path matters most first: Markdown, JSON, Apple Reminders/Shortcuts, Notion, Todoist, GitHub issues, or calendar?
- What pricing model should be used if cloud processing introduces ongoing model/API cost?
- Should Nugget include prompt/preset templates by category, or keep extraction general until user behavior is clearer?


## 23. Suggested MVP Definition of Done
- A user can install/open Nugget on iPhone, record an idea, save it locally, play it back, and find it later.
- A user can run mock or real transcription/extraction, review the output, edit it, and accept action items.
- A user can search across saved ideas and export one idea or the full structured database.
- The app remains usable offline for capture, library, playback, manual review, and export of local data.
- No user content leaves the device in local-only mode. Network processing requires explicit consent.
- Core flows pass manual QA on iPhone Safari/PWA and one desktop browser.
- A coding agent can use this PRD plus the implementation notes to generate the first working prototype without needing product clarification.


## 24. Appendix: Coding Agent Implementation Notes
- Use TypeScript strict mode and domain types for Idea, Recording, Transcript, ExtractionRun, Nugget, ActionItem, Project, Tag, ProcessingJob, and Settings.
- Keep audio capture logic out of React components where possible. Use hooks that wrap a RecorderService/state machine.
- Use Dexie migrations from day one. Never assume a schema reset is acceptable once users have real recordings.
- Keep TranscriptionProvider and ExtractionProvider adapters behind interfaces. Start with mock providers returning deterministic fixture data.
- Use Zod or equivalent schema validation for extraction results before saving them.
- Implement repository methods with explicit return types and error handling. Avoid direct IndexedDB access scattered across components.
- Add a development Settings section with seed data, clear database, export database, and processing queue inspection.
- Create fixtures for short recording, long recording, no transcript, failed transcript, failed extraction, many actions, many tags, and deleted source idea.
- Prefer accessible semantic HTML, native buttons/inputs, and minimal custom controls for the first build.
- Do not add analytics, cloud sync, auth, payments, or provider-specific SDKs to the MVP unless explicitly requested.


## 25. Change Log
| Version | Date | Change |
| --- | --- | --- |
| 0.1 | June 22, 2026 | Initial detailed PRD created from Nugget landing page and prior app direction. |

