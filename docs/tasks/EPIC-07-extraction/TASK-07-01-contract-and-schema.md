# TASK-07-01 — ExtractionProvider interface + Zod result schema

> Epic: EPIC-07 · Priority: P0 · Est: M · Depends on: EPIC-01
> PRD: §12, §13, FR-401, §24 · Docs: [architecture §3](../../product/01-architecture.md)

## Objective

Define the extraction contract and a strict Zod schema that validates all
extraction output before it is persisted.

## Implementation steps

1. Create `src/lib/providers/extraction/types.ts` with `ExtractionProvider`,
   `ExtractionContext`, and `ExtractionResult` per architecture §3 and the PRD
   §13 JSON schema.
2. Create `src/lib/validation/extractionResult.ts` — a Zod schema matching PRD §13:
   `summary` (string), `nuggets[]` (`title`, `detail`, `category` ∈
   idea|decision|risk|note, `confidence` 0..1, `sourceSpan{start,end}`),
   `actions[]` (`title`, `description?`, `priority` ∈ low|medium|high, `dueDate`
   nullable, `project` nullable, `confidence`, `sourceSpan`), `questions[]`,
   `tags[]`, `warnings[]`. Coerce/validate ranges; reject unknown shapes.
3. Export `parseExtractionResult(json): ExtractionResult` that throws
   `ValidationError` on failure.
4. Create a registry mirroring the transcription one
   (`register/get/list`, default from `settings.extractionProviderId`).

## Files to create / modify

- `src/lib/providers/extraction/{types.ts,index.ts}`
- `src/lib/validation/extractionResult.ts` + test

## Acceptance criteria

- Valid PRD §13 payloads parse; malformed payloads throw `ValidationError`.
- `sourceSpan`, enums, and confidence ranges are enforced.
- Registry registers/lists/resolves extraction providers.

## Out of scope

Adapters (07-02/07); persistence (07-03).
</content>
