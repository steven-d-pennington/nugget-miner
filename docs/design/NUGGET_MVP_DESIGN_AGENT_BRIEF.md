# Nugget MVP Design-Agent Brief

## Assignment

Design the mobile-first MVP for **Nugget**, a voice-first application for people who need to capture ideas while moving. The product turns an unstructured spoken ramble into multiple organized, independently editable ideas using GPT-5.6.

Produce a coherent product design rather than disconnected attractive screens. Show the primary end-to-end flow, important loading and failure states, and a reusable component system. The visual treatment may be refined, but the behaviors and information architecture below are product requirements.

## Product thesis

The first job of Nugget is to make recording a thought nearly frictionless:

1. Open the app.
2. Tap the record control.
3. Speak freely.
4. Tap **Stop & save**.
5. Leave immediately if needed.

Nugget saves the recording locally first. When connectivity permits, it transcribes the recording, separates it into distinct ideas, organizes each idea, and prepares a confirmation review. Users never need to name or classify something before speaking.

The second job is organization. A single ramble may produce several idea records, and every record must remain linked to the original recording and supporting transcript excerpts.

## Audience and context

- People capturing thoughts while walking, commuting, between meetings, doing chores, or otherwise away from a desk.
- Often one-handed, outdoors, distracted, or on an unreliable connection.
- They value speed during capture and depth later during review.
- This is a responsive web app/PWA, not a native mobile app.

## Experience principles

1. **Capture before organization.** No form fields before recording.
2. **Saved means safe.** Confirm local persistence before starting network work.
3. **Background effort stays visible.** Processing states are understandable without demanding attention.
4. **AI proposes; the person confirms.** Generated information is editable and traceable to the transcript.
5. **Separate ideas stay separate.** Never collapse a multi-idea ramble into one generic summary.
6. **Use plain verbs.** Prefer labels such as **Record**, **Stop & save**, **Process now**, **Retry**, and **Confirm ideas**.
7. **Design for daylight and one hand.** High contrast, generous controls, safe-area awareness, and reachable primary actions.

## Primary visual reference

Use [nugget-initial-design-direction.png](references/nugget-initial-design-direction.png) as the primary visual reference. Preserve its warm ivory environment, deep navy typography, faceted amber nugget mark, fine gold linework, restrained shadows, and premium-but-approachable tone.

Use [nugget-mvp-screen-board.png](references/nugget-mvp-screen-board.png) as the first functional application of that direction across Capture, Recording, Processing, Confirmation, Library, and Idea Detail. It is a concept board rather than a final design system.

Treat the reference as a visual direction rather than a literal screen specification. Correct these product issues in the production designs:

- Do not display a completed transcript or extracted nuggets while an active recording is still underway.
- Do not claim that transcription or GPT-5.6 organization happens entirely on-device.
- It is accurate to say that recordings and saved idea data are stored locally, there is no cloud sync, and content is sent securely for cloud processing only when the user enables or initiates that processing.
- Replace the concept poster's four persistent tabs with the MVP navigation defined below.

## Refined visual direction: Faceted field notes

The product should feel like a calm, valuable field notebook for moving thoughts—not a corporate productivity dashboard or an AI chat interface. The faceted nugget is the brand mark and a metaphor for finding useful structure inside rough speech. Use it intentionally rather than repeating large decorative gems throughout every screen.

### Signature element: the crystallizing thought seam

Combine the reference image's gold waveform and faceted nugget with one continuous transformation motif. An active waveform settles into a thin gold processing path; as GPT-5.6 separates the ramble, the path branches into small faceted nodes and distinct idea records. This “crystallizing thought seam” communicates the product transformation without relying on robot or sparkle clichés.

Spend the visual boldness on the recording control and this one transformation. Keep the rest of the product quiet and disciplined.

### Suggested palette

- **Warm daylight canvas:** `#FBF8F2`
- **Paper surface:** `#FFFFFF`
- **Deep navy ink:** `#101D36`
- **Quiet ink:** `#6E6B67`
- **Nugget amber:** `#E5A11A`
- **Warm highlight:** `#FFF2D4`
- **Divider/parchment:** `#E8DDCE`
- **Success:** `#247A55`

Category colors may appear as narrow edge tabs or small chips, never as large saturated panels:

- Work: cobalt
- School: violet
- Personal: sage
- Family: amber
- Misc: slate

### Suggested typography

- **Brand wordmark only:** a confident editorial serif such as Fraunces or Source Serif 4
- **Screen titles, body, and controls:** a highly legible humanist sans such as Manrope or Atkinson Hyperlegible
- **Timers, confidence, and processing metadata:** IBM Plex Mono

If these faces are unavailable, choose replacements with the same roles. Keep the serif confined to the brand and occasional major editorial moments; rich forms and mobile controls remain sans serif.

### Shape, spacing, and texture

- Mobile-first single-column layouts with comfortable negative space.
- Large circular amber recording control with subtle concentric rings; other controls should not imitate it.
- Idea records should feel like valuable findings attached to the thought seam, with restrained rounding and a narrow category edge.
- Use hairline rules and whitespace to organize rich idea fields instead of nesting many cards inside cards.
- Minimum 48-pixel primary touch targets and visible keyboard focus.
- Subtle ivory paper grain and gentle amber illumination may reinforce the reference. Texture must never reduce text contrast.

### Motion

Use one orchestrated transformation: after saving, the gold waveform settles into the crystallizing thought seam and separates into idea branches as processing finishes. All other motion should be short and functional. Respect reduced-motion settings.

## Information architecture

Use a mobile bottom navigation with three persistent destinations:

- **Capture**
- **Ideas**
- **Actions**

Access the review queue from a visible badge on Capture and Ideas. Place Categories, processing preferences, privacy, export, and local-data controls in Settings rather than adding another primary tab.

## Required screens and states

### 1. Capture home

Single job: begin recording immediately.

Required elements:

- Nugget wordmark or compact page title
- Connection/offline indicator only when useful
- Dominant record control in the thumb-reachable portion of the screen
- Plain prompt such as **What’s on your mind?**
- Secondary **Paste a ramble** action
- Review-required badge, for example **3 ideas ready to review**
- A short list of recent captures with status: saved, processing, ready, or needs attention
- Bottom navigation

Do not begin with charts, onboarding cards, category selection, or a generic dashboard greeting.

### 2. Active recording

Single job: let the person speak without uncertainty.

Required elements:

- Large elapsed timer
- Live waveform or level feedback
- Clear recording state
- Large **Stop & save** control
- Pause/resume only if it can be implemented reliably
- Small reassurance such as **Saved on this device when you stop**
- Protection against accidental navigation

Keep secondary controls away from the stop/save target.

### 3. Saved and processing capture

Single job: confirm safety and explain what happens next.

Required elements:

- Immediate confirmation: **Recording saved**
- Audio playback and duration
- Visible state progression: Saved → Transcribing → Organizing → Ready for review
- Thought-seam transformation
- Copy such as **You can leave. We’ll resume when the app is open and connected.**
- **Process now**, **Retry**, or **Edit transcript** when applicable
- Clear offline and failure states that preserve the recording

Never promise that a mobile browser will continue working while fully closed.

### 4. Idea confirmation

Single job: turn AI proposals into trusted idea records.

Required elements:

- Header such as **3 ideas found**
- Progress through the extracted ideas without losing the overall context
- Editable title and summary
- One category selector and multi-tag editor
- Goals/purpose
- Problem statement and problem type
- Blockers
- Open questions
- Suggested actions
- Research-needed assessment plus suggested search questions/resource types
- Small `Explicit`, `Inferred`, and `Suggested` provenance labels
- Expandable supporting transcript excerpts
- **Discard idea**, **Save draft**, **Confirm**, and **Confirm all ready ideas** actions

The screen must remain scannable despite rich content. Use section rules, progressive disclosure, and a sticky confirmation action rather than deeply nested cards.

### 5. Idea library

Single job: retrieve organized ideas quickly.

Required elements:

- Search field across title, summary, and tags
- Compact category filter strip
- Optional tag filtering
- Review-required callout when drafts exist
- Idea rows/cards showing title, category edge, short summary, tags, and useful indicators for blockers, research, and open actions
- Empty state that directs the user to record the first idea
- Bottom navigation

Do not use a dense analytics dashboard. The library is a browsable collection of thoughts.

### 6. Idea detail and edit

Single job: make one organized idea genuinely useful.

Required elements:

- Editable title
- Category and tags
- Summary and purpose
- Goals
- Problem being solved
- Blockers
- Questions
- Research needs and suggested resources/searches
- Linked open/completed actions
- Source capture, audio playback, and transcript drawer
- Archive, copy, Markdown export, JSON export, and save actions

Make provenance available without allowing the transcript to dominate the idea.

### 7. Actions

Single job: collect next steps without severing their idea context.

Required elements:

- Open and completed sections
- Checkable action rows
- Source idea title and category
- Link back to the idea
- Empty state explaining that confirmed suggestions appear here
- Duplicate acceptance must never create duplicate action items

### 8. Categories and settings

Single job: teach the classifier what the user’s categories mean and provide trust controls.

Required elements:

- Defaults: Work, School, Personal, Family, Misc
- Category name and rich description editor
- Example and boundary guidance inside descriptions
- Add category
- Safe delete/reassign-to-Misc flow
- Automatic processing preference
- Accurate local-versus-cloud processing explanation
- Export all local data
- Delete all local data with strong confirmation
- Current app/model information suitable for hackathon verification without exposing secrets

The first-run experience may briefly explain capture, processing, and categories, but it must let users record immediately and defer customization.

## Required failure and empty states

Design explicit states for:

- Microphone permission denied
- Browser does not support recording
- Device storage unavailable or full
- Offline recording queued
- Transcription failed
- GPT organization failed or returned invalid data
- Transcript edited and awaiting reprocessing
- No meaningful ideas found
- Library empty
- Search has no results
- Category deletion requires reassignment

Every failure state must state what was preserved and offer the next valid action.

## Accessibility and responsive requirements

- WCAG AA contrast for text and controls
- Minimum 48-pixel primary touch targets
- Screen-reader names for recording state, timer, waveform, progress, and icon-only actions
- Keyboard-operable desktop layouts with strong focus treatment
- Reduced-motion alternative to the thought-seam transformation
- Do not rely on color alone for category or processing state
- Respect iOS and Android safe areas
- Show desktop adaptations for Capture, Review, and Library after the mobile designs are resolved

## Prototype flows to deliver

1. New user → Record → Stop & save → Leave-safe confirmation
2. Saved capture → Processing → Three ideas found → Edit → Confirm
3. Ideas → Search/filter → Open idea → Review source → Create/complete action
4. Offline capture → Queued → Reconnected → Processing resumes
5. Processing failure → Retry → No duplicate records

## Requested design deliverables

- Mobile high-fidelity screens for all eight areas above
- Desktop adaptations for Capture, Review, and Library
- Component/state sheet for recording, processing, category/tag controls, provenance labels, idea rows, actions, errors, and empty states
- Clickable prototype for the five flows
- Token sheet for color, typography, spacing, shape, elevation, and motion
- Short rationale explaining how the design supports one-handed capture and trustworthy AI review

Use realistic idea content. Do not fill screens with lorem ipsum.

## Exact content for the visual concept board

Use the following sample content consistently:

- Capture prompt: **What’s on your mind?**
- Review callout: **3 ideas ready to review**
- Recording timer: **02:14**
- Processing copy: **Recording saved** and **Organizing 3 ideas…**
- Review header: **3 ideas found**
- Primary idea: **Create a neighborhood tool-sharing library**
- Summary: **A simple way for neighbors to lend rarely used tools, reduce duplicate purchases, and coordinate pickup.**
- Category: **Personal**
- Tags: **community**, **sharing**, **weekend project**
- Goal: **Test whether ten nearby households would participate.**
- Blocker: **Need a simple way to track availability and responsibility.**
- Research need: **Compare lightweight inventory and lending tools.**
- Suggested action: **Draft a one-page interest survey.**

## Image-generation prompt for a visual screen board

Use case: ui-mockup

Asset type: high-fidelity mobile product-design concept board

Input images: Image 1 is the primary visual-style reference. Preserve its warm ivory, deep navy, faceted amber nugget branding, fine gold linework, restrained card shadows, and polished editorial warmth. Do not copy its incorrect product claims or combine recording and extracted results on one screen.

Primary request: Create a polished landscape presentation board containing six distinct portrait mobile screens for Nugget, a voice-first app that records spoken rambles and turns them into multiple organized ideas. Show Capture home, Active recording, Saved/processing, Idea confirmation, Idea library, and Idea detail.

Style/medium: realistic shippable product UI, not concept art; match Image 1's premium ivory-and-gold brand direction; daylight-readable; precise information hierarchy.

Composition/framing: 16:9 landscape board, six evenly spaced phone screens, each fully visible and clearly titled; practical iPhone-sized proportions; no device photography or hands.

Visual system: warm ivory canvas `#FBF8F2`, paper white, deep navy ink `#101D36`, nugget amber `#E5A11A`, warm highlight `#FFF2D4`, parchment dividers `#E8DDCE`; editorial serif only for the Nugget wordmark, highly legible humanist sans-serif interface text, mono timer labels. Restrained category edge colors.

Signature: a continuous fine-gold waveform “crystallizing thought seam” begins at the recording screen, becomes a processing path, then branches through tiny faceted nodes into three idea cards. Keep other gem decoration minimal.

Text (verbatim where visible): “What’s on your mind?”, “3 ideas ready to review”, “02:14”, “Stop & save”, “Recording saved”, “Organizing 3 ideas…”, “3 ideas found”, “Create a neighborhood tool-sharing library”, “Personal”, “community”, “sharing”, “weekend project”, “Draft a one-page interest survey.”

Screen details:

1. Capture: dominant amber record control in thumb reach, secondary Paste a ramble, recent captures, three-tab bottom navigation.
2. Recording: large 02:14 timer, expressive waveform, large Stop & save control, saved-on-device reassurance.
3. Processing: audio playback, Saved → Transcribing → Organizing status, waveform resolving into the thought seam.
4. Review: editable idea title and summary, Personal category, tag chips, goals and blockers, Explicit/Inferred/Suggested labels, sticky Confirm action.
5. Library: search, category filter strip, varied idea rows with narrow category edges and small blocker/action indicators.
6. Detail: full organized idea with summary, goal, blocker, research need, suggested action, and discreet source-transcript drawer.

Constraints: practical accessible UI; high contrast; generous 48-pixel touch targets; realistic spacing; readable typography; one-handed mobile ergonomics; consistent bottom navigation; use the faceted nugget as a controlled brand mark rather than repeated large decoration; no mining tools; no robots; no chat bubbles; no neon AI glow; no glassmorphism; no dark-mode presentation; no analytics dashboard; no generic gradient cards; no external logos or trademarks; no watermark; do not claim “100% local processing,” “fully on device,” or “everything stays on your device.”
