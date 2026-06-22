# EPIC-04 — Idea Library

> Source: [Nugget PRD](../../Nugget_PRD.md) §7 J3/J4, §8, §9 (Local library), §18 Milestone 2–3, §19
> Status: Not started · Priority: P0 · Milestone: M2–M3

## Summary

Build the Home/Inbox, Idea Library list, and Idea Detail screens: reverse-chron
listing with key metadata, rename/edit metadata, tags and projects, archive and
delete (with cascade), favorites/pins, and bulk actions.

## Scope

### Functional requirements (PRD §9 — Local library and organization)

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-201 | P0 | List ideas reverse-chron with title, date, duration, processing state, action count. |
| FR-202 | P0 | Rename an idea and edit basic metadata. |
| FR-203 | P0 | Support tags and projects for organizing ideas. |
| FR-204 | P0 | Archive and delete; delete removes transcript, extraction, nuggets, actions after confirmation. |
| FR-205 | P1 | Support favorites / pinned ideas. |
| FR-206 | P1 | Bulk actions: archive, export, delete, assign project/tag. |

### Screens (PRD §8)
- **Home / Inbox:** recent ideas, quick record CTA, pending processing, pending
  review, open actions.
- **Idea Library:** searchable list with filters for project, tag, status,
  processing state.
- **Idea Detail:** playback, metadata, transcript, summary, nuggets, actions,
  questions, tags, processing history.

## Related PRD requirements

- §7 J4 — find an old idea; open result, play audio, review notes, export.
- AC-003 — offline: saved ideas, transcripts, actions, and playback remain available.
- AC-010 — confirmed delete removes related recording/transcript/extraction runs/
  nuggets/questions/source-linked actions (or clearly detaches per setting).
- NFR-004 Offline — library browsing + playback offline.
- NFR-005 Performance — instant for hundreds of ideas.
- §14 — encouraging empty states; never auto-destroy raw recordings.

## Acceptance criteria

- AC-003: With device offline, ideas/transcripts/actions/playback are available.
- AC-010: Delete confirmation cascades/detaches related records correctly.
- Library lists ideas reverse-chron with title, date, duration, processing state,
  action count (FR-201); list stays instant at hundreds of ideas (NFR-005).
- Rename + metadata edit persist (FR-202); tags/projects assignable (FR-203).
- Empty state encourages capture per PRD §14 copy.

## Implementation notes

- Drive lists from EPIC-02 repository query methods with indexes (avoid N+1 blob loads).
- Idea Detail aggregates transcript (EPIC-06), nuggets (EPIC-07), actions
  (EPIC-08), questions, and processing history (EPIC-05).
- Implement delete cascade in the repository layer; make detach-vs-delete a
  product setting per AC-010.
- Honor §14: never auto-destroy raw recordings outside a configured retention policy.

## Definition of Done

- Home/Inbox, Library (with filters), and Idea Detail screens functional.
- Rename, tags/projects, favorites, archive, delete (cascade), and bulk actions work.
- AC-003 and AC-010 pass; library performant with hundreds of seeded ideas.

## Dependencies

- EPIC-01, EPIC-02, EPIC-03 (recordings to list/play).
- Surfaces data from EPIC-05/06/07/08; filters complement EPIC-09 search.
</content>
