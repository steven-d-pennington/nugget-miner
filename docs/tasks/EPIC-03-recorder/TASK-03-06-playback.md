# TASK-03-06 — Playback component on idea detail

> Epic: EPIC-03 · Priority: P0 · Est: S · Depends on: 03-05
> PRD: FR-105, AC-003 · Docs: [UX §3, §7](../../product/03-ux-guidelines.md)

## Objective

Let users play back a saved recording from the idea detail screen, fully offline.

## Implementation steps

1. Build `src/components/AudioPlayer.tsx` that takes a `Recording`, creates an
   object URL from the stored Blob (`recordingRepository.createObjectUrl`), and
   wraps a native `<audio controls>` with accessible labels.
2. Render the saved `waveformPreview` as a decorative track (optional) and show
   duration via UX §9 formatting.
3. Revoke the object URL on unmount to avoid leaks.
4. Mount it in the Idea Detail playback slot (the detail shell is EPIC-04;
   provide the component + a usage stub).

## Files to create / modify

- `src/components/AudioPlayer.tsx`, `src/components/AudioPlayer.test.tsx`

## Acceptance criteria

- A saved recording plays back from idea detail with no network (AC-003 path).
- Object URLs are revoked on unmount.
- Controls are keyboard-accessible and labeled.

## Out of scope

Detail screen composition (EPIC-04).
</content>
