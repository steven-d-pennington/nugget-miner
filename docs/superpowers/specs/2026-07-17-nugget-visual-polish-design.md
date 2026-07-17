# Nugget MVP Visual Polish Design

**Status:** Approved for implementation planning  
**Date:** July 17, 2026  
**Branch:** `codex/mvp-completion-2026-07-17`

## Context

This design refines the completed Nugget MVP before the hackathon demo recording. It does not replace the product requirements in [the MVP design brief](../../design/NUGGET_MVP_DESIGN_AGENT_BRIEF.md). It turns the approved warm ivory, navy, and amber direction into a more coherent interface for the app that already exists.

The product must continue to optimize for people capturing thoughts while moving: recording remains the dominant action, local persistence remains visible, and the organized idea—not the raw transcript—remains the primary result. All existing processing, grounding, provenance, privacy, error-recovery, export, and duplicate-prevention behavior must remain intact.

The selected visual direction is **Editorial Utility**: calm, premium, practical, and restrained. It preserves the existing palette and typography while improving hierarchy, spacing, controls, surfaces, and scannability. It may use a small amount of amber illumination around the capture control, but it must not introduce glassmorphism, neon AI effects, decorative gem repetition, generic gradients, or a competing visual identity.

## Scope and non-goals

The polish pass covers:

- the shared application shell and primary navigation;
- idle and active recording states;
- saved/processing presentation where shared components apply;
- the idea-confirmation review;
- the Ideas library in Cards and Compact modes;
- the saved idea detail screen;
- visual alignment of Actions and Settings;
- responsive, accessibility, loading, empty, and failure states affected by these changes.

This pass does not change API contracts, GPT prompts, extraction schemas, database entities, processing sequencing, consent rules, sanitized analytics, data retention, export contents, or the three-destination information architecture. It does not add onboarding, self-learning classification, cloud sync, research agents, or new product features beyond the local library-view preference.

## Visual system

Use the existing tokens as the source of truth:

- canvas `#FBF8F2`;
- paper surface `#FFFFFF`;
- deep navy ink `#101D36`;
- quiet ink `#6E6B67`;
- amber accent `#E5A11A`;
- warm highlight `#FFF2D4`;
- parchment divider `#E8DDCE`;
- success `#247A55`;
- existing danger and focus colors.

Manrope remains the interface typeface. Fraunces remains reserved for the Nugget wordmark; it must not spread across dense controls or forms. IBM Plex Mono remains limited to timers, versions, confidence, processing metadata, and other short machine-readable labels.

Use a clear spacing rhythm, hairline separators, and restrained paper surfaces. A screen should not become a stack of cards inside cards. Major regions may receive a paper surface, border, or quiet shadow, while internal relationships should primarily use whitespace and dividers. Corners should remain consistent with the existing 12- and 18-pixel radii. Only the recording control is circular and visually sculpted.

## Application shell and navigation

Keep the current three bottom-navigation destinations:

1. Capture
2. Ideas
3. Actions

Settings remains available from the header gear. It must not become a fourth persistent tab. This preserves large one-handed targets and keeps the primary navigation focused on the three frequent jobs.

The header remains compact and sticky. The Nugget mark and wordmark stay centered, a contextual back control appears on nested screens, and the Settings gear remains on the trailing edge. Active navigation uses amber plus a shape or weight change so color is not the only signal. Safe-area padding and the existing minimum touch-target requirements remain mandatory.

## Capture and recording

The idle Capture screen keeps the prompt **“What’s on your mind?”** and makes the record control the unmistakable focal point. Replace the current dot-style icon with a line microphone glyph. The amber control should look gently concave and pressable through an inward highlight and shadow, not glossy or toy-like. Preserve the accessible name **Record** and a minimum 48-pixel target; the visible control should remain substantially larger.

Below the control, show a quiet audio-status region. Before recording it contains a thin level line and truthful local-storage reassurance. During recording the line becomes a continuous, smoothly changing waveform driven by recent microphone levels. It must not use a row of independent vertical bars. A short in-memory sample buffer may produce an SVG path or polyline; no audio-derived visualization data is persisted.

The active state keeps the elapsed timer, clear recording status, and **Stop & save** action. The waveform remains an accessible meter with a useful screen-reader label and current level value. Reduced-motion mode may update the line less frequently or show a stable level trace. Permission, unsupported-browser, save-failure, and offline states keep their existing recovery behavior and must continue to state what was preserved.

## Nugget-first confirmation review

After organization, foreground the separated idea rather than the transcript. The review header states how many ideas were found, which idea is active, and how many are ready. The current Previous/Next and Confirm-all capabilities remain available, but their hierarchy should not compete with the active idea.

Each active candidate opens as a scannable organized briefing:

- editable title and summary;
- one category and multiple tags;
- purpose, goals, and problem;
- blockers and open questions;
- research assessment and suggested resources/searches;
- suggested actions;
- provenance labels and supporting excerpts.

The default presentation groups related fields under short headings such as **Why it matters**, **What’s in the way**, and **Next actions**. Use dividers and progressive disclosure so rich content remains readable. Editing may happen inline or by opening a focused section, but every required field remains available before confirmation. The source transcript is supporting evidence in a collapsed drawer or clear source link; it never disappears and never dominates the initial viewport.

The primary confirmation action may become sticky on small screens when this does not cover content or conflict with the bottom navigation. Discard and other destructive actions remain visually secondary, retain confirmation/recovery behavior, and must not be styled like primary progress.

## Ideas library: Cards plus Compact

The Ideas library defaults to a balanced Cards view. Each card shows enough information to recognize the idea without opening it:

- title;
- short summary;
- category;
- a small number of tags;
- indicators for goals, blockers, research, or open actions when present;
- relevant recency metadata.

Search, category filters, optional tag filtering, sorting, review-required callouts, and existing empty/no-result states remain intact. Category color appears only as a narrow edge, small chip, or similarly restrained marker.

Add a clearly labeled **Cards / Compact** segmented control near the Ideas heading. Compact mode shows more ideas using title-first rows with category, key tags, date, and a disclosure indicator. It must use the identical filtered and sorted collection; switching modes must not reset search, filters, sorting, selection, or unexpectedly reposition the user.

Cards remains the default for a browser profile that has never selected a view. The chosen display mode is remembered locally on that device and is never sent to the server. The preference may use the existing local settings abstraction or a narrowly scoped browser-storage key, whichever produces the smallest safe implementation without a risky data migration.

## Summary-first idea detail

A confirmed idea opens in reading mode, not as a long form. The first viewport shows the title, summary, category, tags, and one clear **Edit** action. The remaining organization is grouped into concise sections such as:

- **Why it matters** for purpose, goals, and problem;
- **What’s in the way** for blockers, questions, and research;
- **Next actions** for linked open and completed actions;
- **Source** for the recording, audio, transcript, and provenance.

The screen must preserve the relationship between these fields rather than hiding them behind separate tabs. Use high-level section boundaries with hairline internal rules instead of a deeply nested card stack. Empty fields should be omitted in reading mode or represented by a quiet, useful empty affordance—not by large blank form controls.

Tapping **Edit** exposes all existing editable fields without leaving the user unsure which idea is being changed. Focused inline section editing or a unified edit mode are both acceptable; the implementation plan should choose the lower-risk approach supported by the existing component structure. Save, archive, copy, Markdown export, JSON export, and source access remain available, but destructive and utility actions move below the organized briefing rather than interrupting it.

## Actions and Settings alignment

Actions already has a strong task-oriented hierarchy and should receive only system alignment: consistent headings, chips, dividers, touch targets, empty states, and amber/green state treatment. Completing an action must remain immediate and idempotent, and every action must retain visible idea context and its link back to that idea.

Settings remains a secondary utility screen reached from the header gear. Group classifier setup, processing preferences, privacy/storage information, exports, and destructive data controls into clearly labeled sections. Use warm surfaces and whitespace to improve scanning, while preserving the exact truthful privacy language and production model evidence. Destructive controls remain visually isolated and require the current strong confirmation flow.

## Motion, responsive behavior, and accessibility

Motion is functional and restrained. The recording line responds to live audio; processing may continue to use the thought-seam metaphor; view toggles and disclosures use short state transitions. Respect `prefers-reduced-motion`, and never make motion necessary to understand state.

At mobile widths, preserve a single reading column, safe-area padding, sticky navigation, and thumb-reachable primary actions. At wider widths, center content within the current shell. The Cards library may use a two-column grid when card width and reading order remain comfortable; Compact mode remains a list. Review and idea detail should favor a readable bounded column over filling the viewport with a dashboard.

All interactive controls require visible focus, keyboard operation, screen-reader names, and WCAG AA contrast. Primary touch targets remain at least 48 pixels. Category and processing states need text or icon support rather than color alone. Waveforms are supplemental visual feedback and must retain semantic recording status and an accessible level value.

## Acceptance criteria

The polish pass is complete when:

1. Capture uses the approved concave microphone control and a continuous line waveform in idle/recording presentation.
2. Recording, save, permission, offline, retry, and local-persistence behavior remains verified.
3. Review opens with the organized idea as the primary content while retaining every editable field, provenance, transcript grounding, and confirmation action.
4. Ideas defaults to balanced Cards and offers a locally remembered Compact view without changing the current query/filter/sort result.
5. Idea detail opens in summary-first reading mode and exposes complete editing, actions, source, archive, copy, and export functionality.
6. Bottom navigation still contains only Capture, Ideas, and Actions; Settings remains in the header.
7. Actions and Settings visually align without weakening idempotency, privacy language, storage controls, or model evidence.
8. Existing focused component tests are updated or extended for changed behavior, especially waveform semantics, library-mode persistence, review controls, and idea-detail editing.
9. Type checking, linting, production build, the relevant unit/integration tests, and the public judge-path browser checks pass.
10. Mobile Chrome is manually checked at an iPhone 14 Pro Max-sized viewport, plus one desktop viewport, with screenshots suitable for the final demo package.

## Approved decisions

- Visual direction: **Editorial Utility**.
- Capture control: **concave amber microphone button**.
- Audio feedback: **continuous moving waveform**, not vertical bars.
- Review: **Nugget-first**.
- Library: **balanced Cards default plus remembered Compact toggle**.
- Idea detail: **summary-first sections**.
- Navigation: **three bottom tabs plus Settings gear**.

