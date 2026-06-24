# TASK-10-05 — Provider selection settings

> Epic: EPIC-10 · Priority: P1 · Est: S · Depends on: 10-04, EPIC-06/07
> PRD: FR-801, FR-305, FR-003 · Docs: [architecture §3](../../product/01-architecture.md)

## Objective

Let users choose transcription/extraction providers and the default extraction
preset, from the available registered adapters.

## Implementation steps

1. In Settings → Processing providers, list available
   transcription/extraction providers (registry `list()` filtered by
   `isAvailable()`), each with its mode label (10-03).
2. Persist selections to `settings.transcriptionProviderId` /
   `extractionProviderId` and `defaultExtractionPreset`.
3. Disable/explain cloud providers when `privacyMode === 'local-only'`.
4. Show a short description and the data-handling note for each provider.

## Files to create / modify

- `src/features/settings/ProviderSettings.tsx`

## Acceptance criteria

- Only available providers are selectable; selections persist and are used by the runner.
- Cloud providers are gated behind cloud-enabled mode.
- Default preset is configurable.

## Out of scope

Adapter implementations (EPIC-06/07).
</content>
