# TASK-07-08 — Server-only LLM prompt/model layer

> Epic: EPIC-07 · Priority: P1 (M5) · Est: M · Depends on: 07-01 · Precedes: 07-07
> PRD: §13, §15, FR-401, FR-406, NFR-002 · Docs: [LLM layer](../../product/04-llm-layer.md), [architecture §5–6](../../product/01-architecture.md)

## Objective

Create the server-only LLM orchestration layer that owns model configuration,
prompt versioning, structured JSON parsing, and provider-error normalization, so
`/api/extract` stays thin and testable.

## Implementation steps

1. Create `src/lib/llm/modelClient.ts` with an OpenAI-compatible `ModelClient`
   using `fetch`, server env vars only, timeout support, and sanitized errors.
2. Create `src/lib/llm/promptRegistry.ts` mapping each `ExtractionPreset` to a
   stable `promptVersion` and prompt builder.
3. Create `src/lib/llm/extractionPrompts.ts` with builders for:
   `general-thought`, `product-idea`, `work-reminder`, and `story-idea`.
4. Create `src/lib/llm/structuredOutput.ts` to extract/parse JSON from model text
   without accepting malformed payloads.
5. Create `src/lib/llm/errors.ts` for `LlmProviderError` and related helpers that
   avoid leaking provider internals or user content.
6. Add tests with mocked `fetch`; no live model/API calls in tests.

## Files to create / modify

- `src/lib/llm/{modelClient,promptRegistry,extractionPrompts,structuredOutput,errors,index}.ts`
- `src/lib/llm/*.test.ts`
- Later integration in `src/app/api/extract/route.ts` (TASK-07-07)

## Acceptance criteria

- No `src/lib/llm/**` module is imported by Client Components or browser hooks.
- Model credentials are read only from server environment variables.
- Prompt registry returns stable promptVersion IDs for all four presets.
- Prompt builders instruct the model to return JSON matching the PRD §13 schema.
- Structured-output helper rejects non-JSON/malformed JSON.
- Provider failures are converted to sanitized typed errors.
- Unit tests pass without network or real provider credentials.

## Out of scope

- `/api/extract` route wiring (07-07).
- Real prompt-quality tuning beyond deterministic schema instructions.
- Embeddings, RAG, semantic search, or autonomous multi-step agents.
