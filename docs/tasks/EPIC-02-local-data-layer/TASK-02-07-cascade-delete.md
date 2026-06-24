# TASK-02-07 — Cascade delete + detach setting (AC-010)

> Epic: EPIC-02 · Priority: P0 · Est: S · Depends on: 02-04, 02-05
> PRD: FR-204, AC-010, §14 · Docs: [data model §4](../../product/02-data-model.md)

## Objective

Implement transactional deletion of an idea and all its dependent records, with a
product setting controlling whether linked actions are deleted or detached.

## Implementation steps

1. Add `ideaRepository.deleteCascade(ideaId, { deleteLinkedActions = true })`
   running in a single Dexie `transaction('rw', ...)` across: recordings,
   transcripts, extractionRuns, nuggets, questions, processingJobs, and the
   idea itself.
2. For action items linked to the idea: if `deleteLinkedActions`, delete them;
   else call `actionItemRepository.detachFromIdea(ideaId)` (clears
   `ideaId`/`sourceSpan`). Manual actions are never touched.
3. Decrement tag usage for the idea's tags; revoke any object URLs.
4. Surface `deleteLinkedActions` as a setting read from `settingsRepository`
   (default true), so EPIC-04's confirm dialog can honor it.
5. Ensure partial failure rolls back the whole transaction (no orphans).

## Files to create / modify

- `src/lib/repositories/ideaRepository.ts` (add `deleteCascade`)
- minor: `settings` field `deleteLinkedActions` (add to settings type/defaults if not present)

## Acceptance criteria

- Deleting an idea removes its recording, transcript, extraction runs, nuggets,
  questions, and processing jobs in one transaction (AC-010).
- With `deleteLinkedActions:false`, linked actions remain but are detached;
  manual actions are unaffected either way.
- A forced mid-transaction error leaves the DB unchanged (rollback verified).
- Unit test asserts full cascade and the detach branch.

## Out of scope

Confirm dialog UI (EPIC-04); retention-based audio deletion (EPIC-09/10).
</content>
