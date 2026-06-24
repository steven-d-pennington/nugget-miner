# TASK-09-01 — SearchService + local index

> Epic: EPIC-09 · Priority: P0 · Est: M · Depends on: EPIC-02, EPIC-06/07
> PRD: FR-601, FR-602, NFR-004, NFR-005 · Docs: [architecture §3](../../product/01-architecture.md)

## Objective

Provide fast, fully-local search across all idea content with enough context to
identify matches.

## Implementation steps

1. Implement `src/lib/services/SearchService.ts` indexing: idea title, transcript
   text, summary, nugget title/detail, action titles, question text, tags,
   project names (FR-601).
2. Build the index locally (in-memory built from Dexie on load, kept warm; or a
   lightweight lib like MiniSearch). Provide `reindexIdea(ideaId)` and
   `removeIdea(ideaId)` hooks called by transcript edits (06-04), review accept
   (07-04), and delete (02-07).
3. `search(query, filters?)` returns ranked results with a `snippet` (matched
   context) and the matching field/type (FR-602).
4. Keep it instant for hundreds of ideas (NFR-005); fully offline (NFR-004).

## Files to create / modify

- `src/lib/services/SearchService.ts`, `SearchService.test.ts`

## Acceptance criteria

- Searching a term present in any indexed field returns the idea with a context snippet.
- Index updates on transcript edit, accepted items, and deletion.
- Runs offline; remains responsive with hundreds of seeded ideas.

## Out of scope

Search UI (09-02); semantic search (FR-604, deferred P2).
</content>
