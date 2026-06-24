# TASK-09-06 — Storage-usage view (P1)

> Epic: EPIC-09 · Priority: P1 · Est: S · Depends on: EPIC-02
> PRD: FR-704, R-002 · Docs: [data model §6](../../product/02-data-model.md)

## Objective

Show local storage usage and the largest recordings so users can manage space.

## Implementation steps

1. Build a Settings "Storage" panel using `storageRepository.estimateUsage()`
   (usage/quota) and `largestRecordings(limit)`.
2. List large recordings with size + duration and a link to the idea; offer
   delete-audio (respecting retention/consent, EPIC-10) per item.
3. Show persistent-storage status (`navigator.storage.persisted()`) and a CTA to
   request persistence where supported (R-002).
4. Degrade gracefully where the Storage API is unavailable.

## Files to create / modify

- `src/features/settings/StoragePanel.tsx`

## Acceptance criteria

- Usage/quota and largest recordings display where supported.
- Persistent-storage status is shown with a request CTA where available.
- Graceful fallback when the API is missing.

## Out of scope

Retention automation (09-07).
</content>
