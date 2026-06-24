# TASK-03-07 — Pause/resume + storage/length warnings (P1)

> Epic: EPIC-03 · Priority: P1 · Est: S · Depends on: 03-04
> PRD: FR-106, FR-107, R-007 · Docs: [architecture §3](../../product/01-architecture.md)

## Objective

Add best-effort pause/resume and proactive warnings for long recordings or low
storage.

## Implementation steps

1. Implement `pause()`/`resume()` in `RecorderService` using
   `MediaRecorder.pause/resume` where supported; feature-detect and hide the
   control when unsupported (FR-106, R-001).
2. In `useRecorder`/screen, surface pause/resume controls and reflect the
   `paused` state.
3. Add a soft warning when elapsed exceeds a recommended threshold (e.g. 10 min)
   and when `storageRepository.estimateUsage()` indicates low free space (FR-107).
4. Keep warnings non-blocking (the user may continue) and reduced-motion friendly.

## Files to create / modify

- `src/lib/services/RecorderService.ts` (pause/resume)
- `src/features/recorder/RecorderScreen.tsx` (controls + warnings)

## Acceptance criteria

- Pause/resume works where supported and is hidden where not, without errors.
- A long-recording warning appears past the threshold; recording continues.
- A low-storage warning appears when estimate is low.

## Out of scope

Hard limits/auto-stop; retention deletion (EPIC-10).
</content>
