# EPIC-09 — Search & Export

> Source: [Nugget PRD](../../Nugget_PRD.md) §7 J4/J5, §9 (Search; Export/import/retention), §12, §18 Milestone 4, §19
> Status: Not started · Priority: P0 · Milestone: M4

## Summary

Implement fast local indexed search across all idea content, plus Markdown and
JSON export, JSON import with duplicate reconciliation, storage-usage visibility,
and retention controls. Everything works without an account.

## Scope

### Search (PRD §9 — Search and retrieval)

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-601 | P0 | Search idea titles, transcript text, summary, nuggets, action titles, questions, tags, projects. |
| FR-602 | P0 | Return results with enough context to identify the matching idea. |
| FR-603 | P1 | Filter by date range, project, tag, processing state, action status, favorite/archive. |
| FR-604 | P2 | Semantic search / local embeddings when privacy-preserving. |

### Export, import, retention (PRD §9)

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-701 | P0 | Export one idea or selected ideas to Markdown. |
| FR-702 | P0 | Export all structured app data to JSON for portability. |
| FR-703 | P1 | Import a prior JSON export and reconcile duplicates safely. |
| FR-704 | P1 | Show local storage usage and large recordings. |
| FR-705 | P1 | Retention settings: keep forever, delete raw audio after transcript, archive after N days. |
| FR-706 | P2 | Export audio files as a ZIP package with metadata manifest. |

### Services (PRD §12)
- `ExportService` creates Markdown and JSON exports with no server account.

## Related PRD requirements

- §7 J4 — search by keyword/tag/project/transcript/nugget/action; quick local results.
- §7 J5 — export one idea, a project, or the full DB as Markdown/JSON.
- AC-008 — searching a matching term returns the idea with matching context.
- AC-009 — Markdown export includes title, date, transcript, summary, nuggets,
  actions, questions, tags.
- NFR-004 Offline — search and export of structured data work offline.
- NFR-008 Portability — export open formats without an account.
- R-002 (PRD §21) — local storage can be cleared; export/import mitigates.

## Acceptance criteria

- AC-008: A matching search term surfaces the idea with identifying context (FR-601/602).
- AC-009: Single-idea Markdown export contains title, date, transcript, summary,
  nuggets, actions, questions, tags (FR-701).
- Full-database JSON export round-trips via import with safe duplicate handling
  (FR-702/703).
- Search and export run offline (NFR-004).
- Storage-usage view lists large recordings (FR-704); retention options applied (FR-705).

## Implementation notes

- Build a local index over the EPIC-02 entities; keep it instant for hundreds of
  ideas (NFR-005). Update index on transcript edits (AC-006) and new nuggets/actions.
- Markdown export formatting is a tested `ExportService` unit (PRD §20); record
  exports in the `exports` entity (PRD §11).
- Import reconciliation: match on stable IDs; surface conflicts rather than silently overwriting.
- Retention "delete raw audio after transcript" must show consequences clearly (§14, §15).
- Audio ZIP (FR-706) and semantic search (FR-604) are P2 / later — keep interfaces open.

## Definition of Done

- Indexed local search over all listed fields with contextual results and filters.
- Markdown (per-idea/selected) + JSON (full) export; JSON import with dedupe.
- Storage-usage view and retention controls; AC-008 and AC-009 pass.

## Dependencies

- EPIC-02 (all entities + `exports`), EPIC-06 (transcript text), EPIC-07/08 (nuggets/actions).
- Retention/reset coordinates with EPIC-10.
</content>
