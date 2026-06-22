# EPIC-07 — Extraction

> Source: [Nugget PRD](../../Nugget_PRD.md) §7 J2/J3, §9 (Nugget extraction), §12, §13, §18 Milestone 3 & 5, §19, §24
> Status: Not started · Priority: P0 · Milestone: M3 (mock), M5 (real)

## Summary

Define the `ExtractionProvider` interface, ship a deterministic mock adapter,
validate structured results with a schema (Zod or equivalent), and build the
Nugget Review UI for accept/reject/edit/regenerate. Every extracted item links
back to its source transcript and recording.

## Scope

### Functional requirements (PRD §9 — Nugget extraction)

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-401 | P0 | Extraction interface returning summary, nuggets, actions, questions, tags, confidence. |
| FR-402 | P0 | Review, edit, accept, reject, or regenerate extracted items. |
| FR-403 | P0 | Every extracted item links back to source transcript and recording. |
| FR-404 | P0 | Action items include title, description, status, priority, due date, project, source idea ID. |
| FR-405 | P1 | Show source snippets / transcript spans explaining each extraction. |
| FR-406 | P1 | Extraction presets: "product idea", "work reminder", "story idea", "general thought". |

### Provider contract (PRD §12)

```ts
type ExtractionProvider = {
  id: string;
  label: string;
  mode: "mock" | "local" | "cloud";
  extract(input: { ideaId: string; transcript: string; context?: ExtractionContext }):
    Promise<ExtractionResult>;
};
```

### Result schema (PRD §13) — validate before saving (PRD §24)

```json
{
  "summary": "One-paragraph summary of the recording.",
  "nuggets": [
    { "title": "Short insight", "detail": "Useful detail",
      "category": "idea|decision|risk|note", "confidence": 0.0,
      "sourceSpan": { "start": 0, "end": 120 } }
  ],
  "actions": [
    { "title": "Action title", "description": "Optional detail",
      "priority": "low|medium|high", "dueDate": null, "project": null,
      "confidence": 0.0, "sourceSpan": { "start": 0, "end": 120 } }
  ],
  "questions": ["Open question to revisit"],
  "tags": ["suggested-tag"],
  "warnings": ["Any uncertainty or missing context"]
}
```

### Nugget Review screen (PRD §8)
- Focused accept/reject/edit flow turning raw extraction into trusted saved items.
- `ReviewService` (PRD §12) converts raw output → editable pending items → accepted saved items.

## Related PRD requirements

- §7 J2/J3 — review summary/nuggets/actions/questions/tags; edit when AI is wrong.
- AC-007 — accepting an action makes it appear in Actions and link to the source idea.
- §14 — output is presented as suggestions; user accepts/edits before items become trusted.
- R-004 (PRD §21) — treat AI output as suggestions; require review; include source links + confidence.
- NFR-002 Security — cloud extraction via server route, no client keys, sanitized errors.
- §24 — validate extraction results with Zod/equivalent before saving.

## Acceptance criteria

- AC-007: Accepting a suggested action creates an `actionItem` shown in Actions
  (EPIC-08) linked back to the source idea.
- Mock adapter returns deterministic, schema-valid output (FR-401).
- Invalid/malformed results are rejected by schema validation, not persisted (PRD §24).
- Each nugget/action/question stores `sourceSpan` + idea/transcript links (FR-403, FR-405).
- Accept/reject/edit/regenerate all work from the Review screen (FR-402).

## Implementation notes

- Persist each attempt in `extractionRuns` (rawJson, promptVersion, schemaVersion,
  status); accepted items go to `nuggets`, `actionItems`, `questions` (PRD §11).
- `ReviewService` mediates pending → accepted; never silently auto-accept (§14).
- Presets (FR-406) map to `ExtractionContext`; keep general default per Open Q (PRD §22).
- Cloud adapter uses `POST /api/extract` only after EPIC-10 consent; no key in client (NFR-002).

## Definition of Done

- `ExtractionProvider` interface + deterministic mock adapter via EPIC-05 queue.
- Schema validation gates all saves; Review UI supports accept/reject/edit/regenerate.
- Source links + confidence on every item; AC-007 passes.
- (M5) Real adapter behind consent + `/api/extract` with no client keys.

## Dependencies

- EPIC-02 (extractionRuns/nuggets/questions), EPIC-05 (queue), EPIC-06 (transcript), EPIC-10 (consent).
- Feeds EPIC-08 (actions) and EPIC-09 (search/export).
</content>
