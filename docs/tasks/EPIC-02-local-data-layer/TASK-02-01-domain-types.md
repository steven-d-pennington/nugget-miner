# TASK-02-01 — Domain types + enums

> Epic: EPIC-02 · Priority: P0 · Est: S · Depends on: EPIC-01
> PRD: §11, §24 · Docs: [data model §2–3](../../product/02-data-model.md)

## Objective

Define every domain type and enum exactly as specified in the data model, as the
shared vocabulary for all repositories, services, and UI.

## Implementation steps

1. Create `src/types/` modules: `enums.ts`, `idea.ts`, `recording.ts`,
   `transcript.ts`, `extraction.ts` (ExtractionRun, Nugget, Question,
   SourceSpan, NuggetCategory), `action.ts`, `project.ts`, `tag.ts`,
   `job.ts`, `settings.ts`, `export.ts`, and a barrel `index.ts`.
2. Copy the enum unions and interfaces verbatim from
   [data model §2–3](../../product/02-data-model.md). Do not rename fields.
3. Export a `SCHEMA_VERSION` constant (string) from `src/types/index.ts` or
   `lib/db` for use by exports/imports.
4. Add lightweight type guards where helpful (e.g. `isManualAction`).

## Files to create / modify

- `src/types/*.ts`, `src/types/index.ts`

## Acceptance criteria

- Types compile under strict mode and match the data model field-for-field.
- Enums are string-literal unions with the exact documented values.
- `SCHEMA_VERSION` is exported and importable.
- No runtime/Dexie dependencies in `src/types` (pure types + small guards).

## Out of scope

Persistence, indexes (02-02), repository logic (02-03+).
</content>
