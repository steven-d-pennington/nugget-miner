# TASK-09-03 — Markdown export (AC-009)

> Epic: EPIC-09 · Priority: P0 · Est: M · Depends on: EPIC-02
> PRD: FR-701, AC-009, §7 J5, NFR-008 · Docs: [architecture §3](../../product/01-architecture.md)

## Objective

Export one idea (or a selection/project) to a readable Markdown document with no
account.

## Implementation steps

1. Implement `src/lib/services/ExportService.ts` `toMarkdown(ideaIds)` producing,
   per idea: title, date, duration, project/tags, transcript, summary, nuggets
   (grouped by category), accepted actions (as a task list using the 08-05
   mapper), and questions (AC-009).
2. Support scopes: single idea, selection, project; concatenate with clear
   headings.
3. Trigger a file download (Blob + `URL.createObjectURL`) named sensibly; record
   the export via `exportRepository.record`.
4. Provide entry points: Idea Detail "Export", library bulk export (04-07).

## Files to create / modify

- `src/lib/services/ExportService.ts` (markdown), `ExportService.test.ts`
- export buttons on Idea Detail / library

## Acceptance criteria

- AC-009: single-idea Markdown includes title, date, transcript, summary,
  nuggets, actions, questions, tags.
- Selection/project scopes export multiple ideas with clear separation.
- Export works offline and is recorded in `exports`.

## Out of scope

JSON export (09-04); audio ZIP (FR-706, deferred P2).
</content>
