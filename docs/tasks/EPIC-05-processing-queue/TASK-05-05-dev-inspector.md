# TASK-05-05 — Dev queue inspector

> Epic: EPIC-05 · Priority: P1 · Est: S · Depends on: 05-01
> PRD: FR-804 · Docs: [data model §6](../../product/02-data-model.md)

## Objective

Give developers a way to inspect and manipulate the job queue during development.

## Implementation steps

1. Add a debug panel (in the Settings "Developer" section / behind an env flag)
   listing all jobs with type, status, attempts, provider, timestamps, and
   sanitized error.
2. Add actions: force retry, cancel, clear completed, and manually enqueue a
   transcription/extraction job for an idea.
3. Reuse `inspectJobQueue()` from `lib/dev/dbTools.ts` (02-08).

## Files to create / modify

- `src/features/settings/DevQueuePanel.tsx`

## Acceptance criteria

- Panel lists all jobs with live status and supports retry/cancel/clear/enqueue.
- Not rendered in production builds.

## Out of scope

Full settings screen (EPIC-10).
</content>
