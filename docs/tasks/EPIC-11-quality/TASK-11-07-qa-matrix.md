# TASK-11-07 — Browser/device QA matrix + checklist

> Epic: EPIC-11 · Priority: P0 · Est: M · Depends on: all
> PRD: §20, §23, R-001 · Docs: [product spec §9](../../product/00-product-spec.md)

## Objective

Define and execute the manual QA matrix that gates beta, covering real-device
behaviors automation can't fully cover.

## Implementation steps

1. Author `docs/qa/manual-qa-checklist.md` covering, per target: install/PWA
   launch, record/permission grant + **deny**, save, playback, mock
   transcribe/extract, review/accept, search, export, delete, offline reload,
   and screen-reader spot checks.
2. Targets: iPhone Safari + installed PWA, desktop Chrome/Edge, desktop Safari
   (where available) (PRD §20). Note iOS recording quirks (R-001).
3. Record results per release; file issues for failures; track the
   MVP-DoD (product spec §9) sign-off.

## Files to create / modify

- `docs/qa/manual-qa-checklist.md`

## Acceptance criteria

- A repeatable checklist exists covering all targets and core flows incl.
  permission-denied + offline.
- A completed run is recorded with pass/fail per target before beta.
- MVP Definition of Done (product spec §9) is signed off.

## Out of scope

Automated suites (11-01…06).
</content>
