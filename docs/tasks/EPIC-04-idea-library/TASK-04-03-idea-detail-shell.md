# TASK-04-03 — Idea Detail shell + sections

> Epic: EPIC-04 · Priority: P0 · Est: M · Depends on: EPIC-02, EPIC-03
> PRD: §8, §7 J2/J3, AC-003 · Docs: [UX §3](../../product/03-ux-guidelines.md)

## Objective

Build the Idea Detail page that aggregates everything about an idea and hosts the
slots later epics fill.

## Implementation steps

1. Build `src/features/library/IdeaDetailScreen.tsx` at `/idea/[ideaId]` loading
   the idea + related records via repositories.
2. Compose sections (each a slot/component, with empty states): **Playback**
   (`AudioPlayer`, EPIC-03), **Metadata** (title/date/duration/project/tags),
   **Transcript** (editable; EPIC-06 fills), **Summary**, **Nuggets**,
   **Actions**, **Questions** (EPIC-07/08 fill), **Processing history**
   (jobs via `processingJobRepository.listByIdeaId`).
3. Provide a primary action that adapts to state: **Process** (if no transcript),
   **Review** (if pending extraction), else **Re-process** (EPIC-05/07 wire).
4. Handle not-found / deleted idea gracefully.
5. Ensure offline rendering for local data (AC-003).

## Files to create / modify

- `src/features/library/IdeaDetailScreen.tsx` + section components
- `src/app/idea/[ideaId]/page.tsx`

## Acceptance criteria

- Detail shows playback, metadata, and placeholder/empty sections for transcript,
  summary, nuggets, actions, questions, and processing history.
- Primary action reflects idea state (Process/Review/Re-process).
- Loads offline for local data; not-found handled without crashing.

## Out of scope

Transcript editing (EPIC-06), review (EPIC-07), action lists (EPIC-08).
</content>
