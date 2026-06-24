# Nugget — UX Guidelines

> Binding interaction, visual, state, copy, and accessibility conventions.
> Implements [PRD §8](../../Nugget_PRD.md) (IA), §14 (UX/content), NFR-006
> (accessibility). Task docs reference these by section.

---

## 1. Design language

- **Tone:** calm personal notebook, not enterprise software. Minimal chrome,
  generous spacing, one clear primary action per screen.
- **Theme:** dark-mode-first; light mode supported via CSS variables. Respect
  `prefers-color-scheme` and `prefers-reduced-motion`.
- **Tokens** (CSS variables, defined in EPIC-01): `--bg`, `--surface`,
  `--text`, `--muted`, `--accent` (single accent), `--danger`, `--success`,
  `--radius`, spacing scale `--space-1..6`. Tailwind theme maps to these.
- **Controls:** native `<button>`, `<input>`, `<textarea>`, `<dialog>` first.
  Custom widgets only when native cannot deliver the interaction (e.g. level
  meter). Minimum touch target 44×44px.

## 2. Navigation & IA (PRD §8)

Primary nav (bottom tab bar on mobile, sidebar on desktop):

| Tab | Route | Primary action |
| --- | --- | --- |
| Home | `/` | **Record** (FAB-style, always one tap) |
| Library | `/library` | Search/filter ideas |
| Actions | `/actions` | Triage next actions |
| Settings | `/settings` | Privacy & data |

Secondary routes: `/onboarding`, `/idea/[ideaId]`, `/review/[ideaId]`.
The **Record** affordance is reachable from Home and persistent on Home; never
behind a menu.

## 3. Screen specs (outcomes per PRD §8)

| Screen | Must show | Primary CTA |
| --- | --- | --- |
| Onboarding | 3 cards: device storage / processing choice / export-delete | "Start" → Home |
| Home / Inbox | Record CTA, *Needs review*, *Processing*, *Recent ideas*, *Open actions* | Record |
| Recorder | Elapsed time, level meter, Stop; post-stop Save / Save & Process / Discard | Stop |
| Library | Filterable reverse-chron list: title, date, duration, status, action count | Open idea |
| Idea Detail | Playback, metadata, transcript (editable), summary, nuggets, actions, questions, tags, processing history | Process / Review |
| Nugget Review | Per-item accept / edit / reject; regenerate run | Accept |
| Actions | Items grouped by status; filter by project/priority/due | Complete |
| Settings | Privacy mode, providers, storage, retention, export/import, reset, version | — |

## 4. Component states (every data surface implements all four)

1. **Loading** — skeletons, never layout shift; no spinner-only blank screens.
2. **Empty** — encouraging copy + the action that fills it.
3. **Error** — trust-preserving message + recovery action; never a dead end.
4. **Populated** — the normal state.

### Canonical copy (PRD §14)

- Library empty: *"Record a thought. Nugget will help pull out the useful parts."*
- Review empty: *"Nothing to review yet. Process a recording to see suggestions."*
- Actions empty: *"No open actions. Accept suggestions from an idea to add some."*
- Extraction error: *"The extraction failed, but your original recording is safe."*
- Transcription error: *"We couldn't transcribe this yet. Your recording is saved — try again or switch provider."*
- Offline cloud attempt: *"You're offline. This recording is saved and can be processed later."*

## 5. Privacy & consent UI (PRD §14/§15)

- **Privacy indicator** persistent in the header/settings: a small chip reading
  **"Local-only"** (default) or **"Cloud-enabled"**. Tapping it opens privacy
  settings.
- **Consent sheet** (modal `<dialog>`) before any cloud call. Must state:
  - *what* is sent ("this recording's audio" / "this transcript text"),
  - *to whom* (provider label),
  - *why* (transcription / extraction),
  - and offer **Cancel** (default focus) + **Send for processing**.
- Labels for processing modes everywhere they appear: **On this device (mock)**,
  **On this device (browser)**, **Cloud (opt-in)** (FR-003).
- Use plain language: "Stored on this device", "Will be sent for processing".
  Never "upload", "sync", or technical provider jargon in primary copy.

## 6. Destructive actions (PRD §14/§15)

- Delete idea, nuclear reset, and "delete audio after transcript" require a
  confirm dialog that **names what is removed** and is not the default-focused
  button. Reset additionally requires typing/holding to confirm.
- Never auto-destroy raw audio unless a retention policy is set **and** the user
  has seen its consequence.

## 7. Accessibility (NFR-006 — required for all core flows)

- Full keyboard operability; visible focus rings on every interactive element;
  logical tab order; focus trapped in dialogs and returned on close.
- Semantic landmarks (`header/nav/main`), headings in order, `label`s for all
  inputs, `aria-live="polite"` for processing/job status updates.
- Recording state announced to screen readers (start/stop/elapsed milestones).
- Level meter is decorative (`aria-hidden`); recording state conveyed in text too.
- Color contrast ≥ WCAG AA; never use color alone to convey state (pair with
  icon/text). Honor `prefers-reduced-motion` (no nonessential animation).
- Automated axe checks + a manual screen-reader pass per core flow (EPIC-11).

## 8. Feedback & motion

- Processing/job progress uses a determinate bar when `progress` is known, else
  an indeterminate, reduced-motion-aware indicator.
- Toasts for transient confirmations ("Saved", "Exported"); errors use inline
  state, not disappearing toasts.
- No motion that blocks interaction; long jobs never freeze the UI (NFR-005).

## 9. Content/labeling rules

- Default idea title: `"Idea — {Mon D, h:mm a}"`; user-renamable inline.
- Dates: relative for < 7 days ("2h ago"), absolute thereafter.
- Durations `m:ss`; sizes human-readable (KB/MB).
- AI output is always visually marked **"Suggested"** until accepted (PRD §14).
</content>
