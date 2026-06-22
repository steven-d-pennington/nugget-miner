# EPIC-08 — Actions

> Source: [Nugget PRD](../../Nugget_PRD.md) §7 J3, §8, §9 (Action management), §18 Milestone 3, §19
> Status: Not started · Priority: P0 · Milestone: M3

## Summary

Build the Actions screen and action-item management: create/edit/complete/
reopen/archive/delete, grouping and filtering by project/status/priority/due
date, manual (non-recording) actions, and a persistent source link from each
action back to the idea/transcript it came from. Later: export to external task
systems.

## Scope

### Functional requirements (PRD §9 — Action management)

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-501 | P0 | Actions screen for accepted action items. |
| FR-502 | P0 | Create, edit, complete, reopen, archive, delete actions. |
| FR-503 | P0 | Group/filter actions by project, status, priority, due date. |
| FR-504 | P0 | Maintain a source link from each action to its idea recording/transcript. |
| FR-505 | P1 | Support manual actions not originating from a recording. |
| FR-506 | P2 | Export actions to Apple Reminders, Shortcuts, calendar, Markdown task lists, or third-party task apps. |

### Screen (PRD §8)
- **Actions:** items grouped by status, project, priority, due date, and source;
  "User sees what to do next."

## Related PRD requirements

- §7 J3 — accept action items; assign project, priority, due date, status; accepted
  actions appear in Actions and stay linked to source.
- AC-007 — accepted extraction action appears in Actions and links back to source idea.
- `actionItems` fields (PRD §11): id, ideaId, title, description, status, priority,
  dueDate, projectId, tags, sourceSpan, createdAt, updatedAt.
- §16 Follow-through metric — recordings producing >= 1 accepted action.
- §5 Non-goals — not a full PM replacement (Jira/Todoist/Linear/Notion).

## Acceptance criteria

- AC-007: An accepted extraction action shows in Actions linked to its source idea.
- Full action lifecycle works: create, edit, complete, reopen, archive, delete (FR-502).
- Actions filter/group by project, status, priority, due date (FR-503).
- Source link persists and is navigable back to the idea/transcript (FR-504).
- Manual actions can be created without a recording (FR-505).

## Implementation notes

- Back the screen with the EPIC-02 `actionItems` repository; index status/project/
  dueDate for fast filtering.
- Accepted actions come from EPIC-07 review; manual actions share the same model
  with `ideaId`/`sourceSpan` null/optional (FR-505).
- Keep workflow lightweight per §5 non-goals — avoid PM-tool complexity.
- FR-506 exports are P2 / post-V1 (PRD §6, §22) — design the data shape now, defer integrations.

## Definition of Done

- Actions screen with full CRUD + status workflow and filters/grouping.
- Source links navigable; manual actions supported; AC-007 passes.
- Action data shape ready for future export targets (FR-506 deferred).

## Dependencies

- EPIC-02 (`actionItems`), EPIC-07 (accepted actions), EPIC-04 (source idea navigation).
- Feeds EPIC-09 (search across action titles; export).
</content>
