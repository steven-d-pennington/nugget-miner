# EPIC-04 — Idea Library

> Milestone M2–M3 · Priority P0 · Feature F-3
> Product context: [UX §3](../../product/03-ux-guidelines.md),
> [data model §3–4](../../product/02-data-model.md)

## Goal

Build Home/Inbox, the filterable Library list, and the Idea Detail hub, plus
rename/metadata edit, tags & projects, archive/delete (cascade), favorites, and
bulk actions.

## Outcome / DoD

- AC-003: ideas/transcripts/actions/playback available offline.
- AC-010: confirmed delete cascades/detaches correctly.
- Library lists reverse-chron with title/date/duration/status/action count and
  stays instant at hundreds of ideas.

## Tasks

| ID | Title | Depends on |
| --- | --- | --- |
| [TASK-04-01](./TASK-04-01-home-inbox.md) | Home / Inbox screen | EPIC-02, EPIC-03 |
| [TASK-04-02](./TASK-04-02-library-list-filters.md) | Library list + filters | EPIC-02 |
| [TASK-04-03](./TASK-04-03-idea-detail-shell.md) | Idea Detail shell + sections | EPIC-02, EPIC-03 |
| [TASK-04-04](./TASK-04-04-rename-metadata.md) | Rename + metadata edit | 04-03 |
| [TASK-04-05](./TASK-04-05-tags-projects.md) | Tags & projects assignment | 04-02, 04-03 |
| [TASK-04-06](./TASK-04-06-archive-delete.md) | Archive + delete (cascade) with confirm | 04-03, EPIC-02 (02-07) |
| [TASK-04-07](./TASK-04-07-favorites-bulk.md) | Favorites/pins + bulk actions (P1) | 04-02 |

## Sequencing

04-02 and 04-03 first (list + detail), then 04-01 (inbox aggregates), 04-04/05/06
on detail, 04-07 last (P1).
</content>
