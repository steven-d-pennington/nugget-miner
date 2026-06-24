# Nugget — Product Specification

> The authoritative product definition. Resolves the open questions in
> [Nugget PRD](../../Nugget_PRD.md) §22, fixes the MVP feature set, and defines
> the conventions every task document builds on. Read this **before** the
> architecture, data model, and task docs.

---

## 1. Product in one sentence

Nugget turns spoken ideas into structured, editable summaries, "nuggets," and
action items, stored privately on the user's device by default.

## 2. MVP thesis (what we must prove)

1. **Capture is frictionless** — recording is faster than opening a notes app.
2. **Transformation is useful** — recordings reliably become helpful structured
   output the user keeps.
3. **Privacy is trusted** — users believe nothing leaves the device unless they
   ask, so they record real thoughts.

Every MVP feature is justified against one of these three. If a feature does not
serve capture, transformation, or trust, it is deferred.

## 3. Resolved product decisions (PRD §22 Open Questions)

These decisions are **fixed for the MVP** so agents do not need product
clarification. Each is reversible later but should be treated as settled now.

| # | Open question | Decision for MVP | Rationale |
| --- | --- | --- | --- |
| Q1 | Pure PWA vs React Native/Expo? | **Pure PWA** (Next.js App Router). Native is a Post-V1 spike, only if iOS recording/storage blockers prove unfixable. | Fastest path; one codebase; PRD working assumption. |
| Q2 | Default real transcription provider? | **Mock by default in dev.** First real provider is a **server-side OpenAI-compatible Whisper route** (`/api/transcribe`). Browser `SpeechRecognition` is an optional on-device provider where supported. | Provider-agnostic contract; server keeps keys off client. |
| Q3 | Keep raw audio forever? | **Keep forever by default.** Retention setting offers "delete raw audio after transcript" and "archive after N days" as opt-in. Audio is never auto-deleted without an explicit policy. | Trust principle; PRD §14. |
| Q4 | Encrypted local storage for V1? | **Design now, build Post-V1.** EPIC-10 ships the threat model + settings flag; encryption implementation is out of MVP scope. | Avoids false security confidence (R-006). |
| Q5 | Accounts? | **Accountless.** No auth, no sign-in, no server-side user records in MVP. | Local-first; PRD §5 non-goals. |
| Q6 | First export path? | **Markdown first, JSON second (both P0).** Apple Reminders/Shortcuts and third-party task exports are P2/Post-V1. | Portability with least complexity. |
| Q7 | Pricing model? | **Out of scope.** No payments, no metering in MVP. Cloud cost is controlled by rate limits + opt-in only. | PRD §5 / §24 non-goals. |
| Q8 | Prompt presets by category? | **Ship 4 presets** ("product idea", "work reminder", "story idea", "general thought") with **"general thought" as default.** Presets only change extraction context, never storage shape. | Useful without over-fitting (FR-406). |

## 4. The four pillars and their primary objects

Nugget has four conceptual pillars. Every screen and task maps to one.

1. **Capture** → a `Recording` saved into an `Idea`.
2. **Transform** → a `Transcript` + an `ExtractionRun` producing `Nugget`s,
   `ActionItem`s, and `Question`s.
3. **Organize & Review** → accept/edit suggestions; tag, project, search.
4. **Trust & Portability** → consent, privacy state, retention, export, reset.

## 5. Feature catalog (what we are building)

Each feature below is the PM-level definition that the epic/task docs implement.
Feature IDs (`F-x`) are referenced by task documents.

### F-1 Onboarding & privacy primer (EPIC-10)
First-run, skippable-after-first, three-card explainer: *stored on this device*,
*you choose what gets processed*, *export or delete anytime*. Ends by landing on
Home with the Record CTA. No mic permission requested here.

### F-2 One-tap capture (EPIC-03)
A persistent **Record** affordance reachable from Home in one tap. Recording
shows elapsed time, a live level meter, and stop. On stop: **Save**, **Save &
Process**, or **Discard**. Saving creates an `Idea` + `Recording` with a default
title (`"Idea — {date, time}"`). Mic permission requested only on first record.

### F-3 Idea library & inbox (EPIC-04)
Home/Inbox surfaces: quick Record CTA, *Needs review* (extractions awaiting
accept), *Processing* (running/failed jobs), *Recent ideas*, and *Open actions*
count. Library is a filterable, reverse-chron list. Idea Detail is the hub:
playback, editable transcript, summary, nuggets, actions, questions, tags,
project, processing history.

### F-4 Processing pipeline (EPIC-05/06/07)
A local job queue runs transcription then extraction. Jobs are visible,
retryable, and cancellable. Providers are pluggable adapters; mock adapters ship
first and produce deterministic output so the whole flow is demoable offline.

### F-5 Nugget review (EPIC-07)
Extraction output is **suggestions**, never auto-saved. A focused review surface
lets the user accept / edit / reject each nugget, action, and question, or
regenerate the whole run. Accepted items become first-class records linked to
their source span in the transcript.

### F-6 Action management (EPIC-08)
Accepted (and manually created) action items live in an Actions view with
status workflow (open → done, plus reopen/archive), priority, due date, project,
and a back-link to the source idea.

### F-7 Search & retrieval (EPIC-09)
Instant local search across titles, transcript, summary, nuggets, action titles,
questions, tags, projects — with filters. Results show enough context to
identify the idea and jump to it.

### F-8 Export & import (EPIC-09)
Markdown export (one idea / selection) and JSON export (entire database) with no
account. JSON re-import reconciles duplicates by stable ID.

### F-9 Settings, retention & reset (EPIC-10)
Privacy mode, processing-provider selection, storage usage, retention policy,
export/import, app version, and a guarded "nuclear reset" that explains exactly
what is deleted.

### F-10 Trust & consent gates (EPIC-10)
Before any byte leaves the device, a consent sheet names *what* is sent, *to
which provider*, and *why*, and is cancellable. A persistent privacy indicator
shows current mode (Local-only / Cloud-enabled).

## 6. Personas → feature priority (PRD §4)

| Persona | Most-valued features |
| --- | --- |
| Idea-driven builder | F-2, F-5, F-6, F-7, F-8 |
| Busy professional | F-2, F-4 (concise summary), F-6, F-10 |
| Creative writer / podcaster | F-2, F-3 (keep raw audio), F-7, F-8 |
| Neurodivergent / ADHD-leaning | F-2 (zero friction), F-3 inbox prompts, F-6 visible next actions |

## 7. Global UX principles (binding on all tasks; PRD §14)

- **Capture first, organize later.** Never block recording on setup.
- **AI is a suggestion engine.** Extracted items are visibly "suggested" until
  accepted; always traceable to a transcript span.
- **Plain privacy language.** Use "Stored on this device" and "Will be sent for
  processing" — never jargon.
- **Destructive actions are explicit.** Confirm, explain consequences, never
  auto-destroy raw audio without a configured policy.
- **Trust-preserving errors.** e.g. "Extraction failed, but your recording is
  safe." Failures never harm the source recording.
- **Calm, minimal, dark-friendly.** Native semantic controls over custom widgets.

## 8. MVP scope boundary (in / out)

**In:** F-1…F-10 at P0/P1 as defined. Mock providers + one real cloud provider
behind consent. Offline capture/library/playback/edit/export.

**Out (PRD §5):** team/collab, mandatory cloud or accounts, real-time meeting
capture, full PM-tool parity, medical/legal/financial advice, guaranteed
cross-browser offline transcription, analytics, payments, push notifications.

## 9. Definition of Done for the MVP (PRD §23)

A user can install/open Nugget on iPhone, record an idea, save it locally, play
it back, find it later, run mock **or** real processing, review and edit output,
accept actions, search everything, and export one idea or the whole database —
all offline for local-only flows, with no content leaving the device unless they
consent. Core flows pass manual QA on iPhone Safari/PWA and one desktop browser.

## 10. How the docs fit together

- **This file** — product decisions and feature definitions.
- [`01-architecture.md`](./01-architecture.md) — stack, folder structure,
  service/provider contracts, conventions every task follows.
- [`02-data-model.md`](./02-data-model.md) — concrete Dexie schema, types,
  indexes, relationships, migration strategy.
- [`03-ux-guidelines.md`](./03-ux-guidelines.md) — design tokens, navigation,
  component/state/empty/error conventions, accessibility, copy.
- [`../tasks/`](../tasks/README.md) — per-epic folders of executable task docs.
</content>
