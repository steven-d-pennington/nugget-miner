# EPIC-02 — Local Data Layer

> Source: [Nugget PRD](../../Nugget_PRD.md) §11, §12, §18 Milestone 1, §19, §24
> Status: Not started · Priority: P0 · Milestone: M1

## Summary

Implement the Dexie/IndexedDB schema, typed domain models, repository layer,
migrations, seed data, and database health/reset tooling. The service layer must
hide storage details so a future native storage implementation can reuse the
same domain model (PRD §11).

## Scope

### Schema & domain types (PRD §11, §24)

Implement entities and TypeScript domain types for:

| Entity | Key fields (PRD §11) |
| --- | --- |
| settings | id, privacyMode, processingMode, providerConfigRef, retentionPolicy, encryptionEnabled, createdAt, updatedAt |
| ideas | id, title, createdAt, updatedAt, durationMs, status, projectId, tags, favorite, archived, sourceType |
| recordings | id, ideaId, blob, mimeType, sizeBytes, durationMs, waveformPreview, checksum, createdAt |
| transcripts | id, ideaId, text, segments, language, provider, confidence, jobId, createdAt, updatedAt |
| extractionRuns | id, ideaId, transcriptId, provider, promptVersion, schemaVersion, status, rawJson, createdAt |
| nuggets | id, ideaId, extractionRunId, title, detail, category, confidence, sourceSpan, status |
| actionItems | id, ideaId, title, description, status, priority, dueDate, projectId, tags, sourceSpan, createdAt, updatedAt |
| questions | id, ideaId, text, status, sourceSpan, createdAt |
| projects | id, name, description, color, archived, createdAt, updatedAt |
| tags | id, name, usageCount, createdAt, updatedAt |
| processingJobs | id, ideaId, type, provider, status, progress, errorMessage, createdAt, updatedAt |
| exports | id, scope, format, itemCount, createdAt |

### Repositories (PRD §12, §24)
- `IdeaRepository` and per-entity repository methods with explicit return types
  and error handling. No direct IndexedDB access scattered across components.

### Migrations (PRD §24)
- Dexie migrations from day one; never assume a schema reset is acceptable once
  users have real recordings.

### Seed & dev tooling (FR-804, PRD §24)
- Seed sample data; clear database; export database; processing-queue inspection.

### Fixtures (PRD §24)
- short recording, long recording, no transcript, failed transcript, failed
  extraction, many actions, many tags, deleted source idea.

## Related PRD requirements

- §11 — full data model.
- §12 — repository / service separation.
- FR-804 (P1) — debug tools for DB health, processing job queue, sample data.
- NFR-003 Durability — data survives refresh/relaunch/offline.
- NFR-009 Maintainability — storage logic in testable services/adapters.
- §24 — strict types, migrations from day one, repository pattern, fixtures.

## Acceptance criteria

- All entities in PRD §11 exist with indexes supporting library + search queries.
- Repository methods are typed, return explicit results, and handle errors.
- A schema migration test shows an upgrade preserves existing ideas/recordings (NFR-003).
- Dev tools can seed, clear, export the DB, and inspect the job queue (FR-804).
- Fixtures listed above are available for tests/demos.

## Implementation notes

- Domain types are shared with EPIC-06/07 provider contracts and EPIC-09 export.
- `sourceSpan` shape (`{ start, end }`) matches the extraction schema (PRD §13).
- Keep blob storage in `recordings`; metadata duplicated onto `ideas` for fast lists.
- Repositories back EPIC-03…09; design query methods with those screens in mind.

## Definition of Done

- Dexie DB with all entities, indexes, and at least one real migration path.
- Typed repositories with error handling; no raw IndexedDB in UI components.
- Seed/clear/export/inspect dev tools and the full fixture set.
- Migration test green.

## Dependencies

- EPIC-01 (project scaffold). Unblocks EPIC-03 … EPIC-10.
</content>
