# TASK-02-04 — Idea / recording / transcript repositories

> Epic: EPIC-02 · Priority: P0 · Est: M · Depends on: 02-03
> PRD: §11, FR-104, FR-201, FR-202, FR-302, FR-303, AC-006 · Docs: [data model §3, §6](../../product/02-data-model.md)

## Objective

Implement the repositories backing capture, the library list, and transcripts.

## Implementation steps

1. `ideaRepository`:
   - `create(input)` → sets id/timestamps, `status:'captured'`, defaults
     (`favorite:false, archived:false, tags:[], actionCount:0`).
   - `getById(id)`, `update(id, patch)`, `setArchived(id, bool)`,
     `toggleFavorite(id)`, `setStatus(id, status)`,
     `recomputeActionCount(id)` (counts open+done linked actions).
   - `listByRecency(filters?)` → ordered by `createdAt` desc, supporting filters
     for project, tag, status, favorite, archived (used by EPIC-04/09).
2. `recordingRepository`: `add(ideaId, draft)` (stores Blob + metadata),
   `getByIdeaId(ideaId)`, `createObjectUrl(recording)` helper,
   `deleteByIdeaId(ideaId)`.
3. `transcriptRepository`: `upsert(ideaId, result)`, `getByIdeaId(ideaId)`,
   `updateText(ideaId, text)` → sets `edited:true`, bumps `updatedAt` (AC-006).

## Files to create / modify

- `src/lib/repositories/{ideaRepository,recordingRepository,transcriptRepository}.ts`
- barrel update

## Acceptance criteria

- Creating an idea persists with correct defaults and is retrievable.
- `listByRecency` returns reverse-chron and honors each documented filter.
- Recording Blob round-trips with `mimeType`, `sizeBytes`, `durationMs`,
  `waveformPreview` intact (FR-104).
- `transcriptRepository.updateText` sets `edited:true` and updates `updatedAt`.
- Unit tests cover create/list/filter, blob round-trip, transcript edit.

## Out of scope

Cascade delete (02-07); UI (EPIC-03/04).
</content>
