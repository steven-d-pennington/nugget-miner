# Nugget Agent Orchestration

## Roles

- The primary Sol agent owns product interpretation, sprint sequencing, architecture decisions, integration review, final verification, and Git publication.
- The project-scoped `terra-worker` agent is pinned to `gpt-5.6-terra` and performs bounded implementation, focused verification, or contained repository investigation delegated by Sol.

## Sources of Truth

Before implementation, read these in order:

1. `docs/superpowers/specs/2026-07-15-nugget-mvp-hackathon-design.md`
2. `docs/superpowers/plans/2026-07-15-nugget-mvp-sprint-index.md`
3. The assigned sprint plan under `docs/superpowers/plans/`
4. `docs/design/NUGGET_MVP_DESIGN_AGENT_BRIEF.md` for UI work
5. Any newer user-provided design-system file under `docs/design/`

The detailed sprint plan wins for implementation sequencing. The approved product design wins if a task is ambiguous. Stop and ask the primary agent if the documents conflict.

## Delegation Policy

- When the user asks Sol to build through Terra, delegate one explicit sprint task or other bounded unit to `terra-worker`.
- Default to one write-enabled worker at a time because all agents share the same worktree.
- Parallel agents are appropriate for independent read-only research, review, test analysis, or non-overlapping work with an explicit file boundary.
- Every delegation prompt must name the task, relevant plan path, allowed scope, required checks, and expected handoff evidence.
- The primary agent chooses the working branch before delegation. Use a sprint branch unless the user explicitly requests direct work on `main`.
- Terra creates frequent, task-sized commits on the assigned branch after the relevant checks pass.
- Require at least one commit per completed plan task. Use additional intermediate commits when a task crosses coherent subsystem boundaries or lasts more than one focused working block.
- Each commit stages only assigned files, uses a concise conventional message, and leaves the tree in a reviewable state. Never commit unrelated changes or disguise failing checks as a completed checkpoint.
- The primary agent inspects each commit and reruns the relevant verification before accepting it or publishing the branch.
- Terra must not amend, rebase, force-push, push, or open a pull request unless the primary agent explicitly delegates that action.

## MVP Execution Rules

- Work sprint-by-sprint and stop at each sprint exit gate.
- Use focused risk-based tests, not a blanket full-TDD methodology.
- Preserve unrelated user changes.
- Do not pull later-sprint features forward unless the current plan requires an interface for them.
- Keep the mobile capture and local-save path reliable before adding secondary polish.
- Never weaken grounding, structured-output validation, eval fixtures, privacy wording, or acceptance criteria to make a check pass.
- UI implementation follows the user's design system when it becomes available; do not invent a competing visual direction.
- Prefer additive follow-up commits over rewriting published or already-reviewed history.

## Standard Terra Handoff

Terra must report:

- the assigned task and user-visible outcome;
- commit hashes and messages;
- changed files;
- exact verification commands and results;
- manual checks, screenshots, or evidence;
- unresolved risks or deviations;
- acceptance-criteria and exit-gate status.
