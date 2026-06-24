# TASK-05-04 — `useProcessingQueue` hook + progress UI

> Epic: EPIC-05 · Priority: P0 · Est: S · Depends on: 05-01
> PRD: §7 J2, NFR-005 · Docs: [UX §4, §8](../../product/03-ux-guidelines.md)

## Objective

Expose queue state to React and render job progress/retry on the relevant screens.

## Implementation steps

1. Implement `src/hooks/useProcessingQueue.ts` subscribing to the queue, exposing
   `jobs`, `activeJobs`, and `byIdea(ideaId)` plus `cancel`/`retry`.
2. Build a `ProcessingStatus` component (determinate bar when `progress` known,
   else reduced-motion indeterminate; UX §8) with cancel/retry controls.
3. Render it on Home (Processing section, 04-01) and Idea Detail (processing
   history + active job).
4. Use `aria-live="polite"` for status changes (UX §7).

## Files to create / modify

- `src/hooks/useProcessingQueue.ts`
- `src/components/ProcessingStatus.tsx`

## Acceptance criteria

- Hook reflects live job changes via subscription.
- Progress UI shows status, progress, and cancel/retry; updates announced to SR.
- UI never blocks during long jobs (NFR-005).

## Out of scope

Dev inspector (05-05).
</content>
