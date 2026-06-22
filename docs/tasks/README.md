# Nugget — Task Documents

These task documents decompose the [Nugget PRD](../../Nugget_PRD.md) into
individual, actionable work items. The breakdown follows the PRD's **Epic
Backlog** (PRD §19), with each task cross-referencing the relevant functional
requirements (§9), non-functional requirements (§10), data model (§11),
delivery milestones (§18), and MVP acceptance criteria (§17).

## How to use

Each task doc is self-contained and aimed at a coding agent or contributor. It
lists scope, the PRD requirements it satisfies, acceptance criteria,
implementation notes, a Definition of Done, and dependencies on other epics.

## Index

| Task | Epic | Theme | Priority | Milestone |
| --- | --- | --- | --- | --- |
| [EPIC-01](./EPIC-01-pwa-foundation.md) | PWA foundation | Installable shell, routing, offline, theme | P0 | M1 |
| [EPIC-02](./EPIC-02-local-data-layer.md) | Local data layer | Dexie schema, repositories, migrations, seed/reset | P0 | M1 |
| [EPIC-03](./EPIC-03-recorder.md) | Recorder | Mic permission, record/stop/save/delete, level meter, playback | P0 | M2 |
| [EPIC-04](./EPIC-04-idea-library.md) | Idea library | Inbox/list, detail, edit, archive/delete, tags/projects | P0 | M2–M3 |
| [EPIC-05](./EPIC-05-processing-queue.md) | Processing queue | Job model, statuses, retry/cancel, mock wiring | P0 | M3 |
| [EPIC-06](./EPIC-06-transcription.md) | Transcription | Provider contract, mock output, editable transcript | P0 | M3, M5 |
| [EPIC-07](./EPIC-07-extraction.md) | Extraction | Provider contract, schema validation, mock, review UI | P0 | M3, M5 |
| [EPIC-08](./EPIC-08-actions.md) | Actions | Action CRUD, filters, status workflow, source links | P0 | M3 |
| [EPIC-09](./EPIC-09-search-export.md) | Search / export | Local search, Markdown/JSON export, import | P0 | M4 |
| [EPIC-10](./EPIC-10-privacy-settings.md) | Privacy / settings | Consent gates, privacy status, retention, reset, vault | P0 | M1, M5 |
| [EPIC-11](./EPIC-11-quality.md) | Quality | Unit/integration/a11y/offline/privacy tests, QA matrix | P0 | M4 + continuous |

## Milestone roadmap (PRD §18)

- **M1 — App shell & storage foundation:** EPIC-01, EPIC-02, parts of EPIC-10.
- **M2 — Recording MVP:** EPIC-03, parts of EPIC-04.
- **M3 — Mock processing & review:** EPIC-05, EPIC-06, EPIC-07, EPIC-08.
- **M4 — Search, export & polish:** EPIC-09, EPIC-11.
- **M5 — Real provider integration beta:** EPIC-06/EPIC-07 real adapters, EPIC-10 consent/rate limits.

## Priority legend (PRD §9)

- **P0** — required for MVP.
- **P1** — important, target within MVP/beta.
- **P2** — later phase / post-V1.
</content>
