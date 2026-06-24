# TASK-04-01 — Home / Inbox screen

> Epic: EPIC-04 · Priority: P0 · Est: M · Depends on: EPIC-02, EPIC-03
> PRD: §8, §7 J3 · Docs: [UX §3](../../product/03-ux-guidelines.md)

## Objective

Make Home the capture-and-continue hub showing the Record CTA and the user's
pending work.

## Implementation steps

1. Build `src/features/library/HomeScreen.tsx` rendering, in order: the Record
   CTA (EPIC-03), **Needs review** (ideas with pending extraction items),
   **Processing** (active/failed jobs), **Recent ideas** (latest N), and an
   **Open actions** count (link to Actions).
2. Source data via repositories: `nuggetRepository`/`questionRepository` pending
   counts, `processingJobRepository.listActive()`, `ideaRepository.listByRecency`,
   `actionItemRepository.list({status:'open'})`.
3. Implement all four component states (loading skeletons, empty, error,
   populated) per UX §4; empty uses the canonical capture copy.
4. Keep it instant (NFR-005) — query counts, not full collections.

## Files to create / modify

- `src/features/library/HomeScreen.tsx`, supporting cards
- `src/app/page.tsx` (mount)

## Acceptance criteria

- Home shows Record CTA + the four sections with live counts.
- Empty state shows the capture-encouraging copy (UX §4).
- Sections link to the relevant screens (review/idea/actions).
- Renders quickly with hundreds of seeded ideas.

## Out of scope

Library list (04-02), detail (04-03), review UI (EPIC-07).
</content>
