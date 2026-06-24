# Nugget — LLM Layer & Prompt Orchestration

> Server-only contract for cloud model calls, prompt versioning, structured JSON
> enforcement, and provider normalization. This sits below the extraction cloud
> adapter and above raw model APIs. It preserves the PRD's privacy rule: no user
> content leaves the device unless a consent gate explicitly allowed the request.

---

## 1. Purpose

Nugget's AI behavior is implemented through provider adapters, but raw model
calls must not be smeared across API route handlers. The LLM layer owns:

- prompt construction and prompt-version IDs,
- model/client configuration from server environment only,
- structured JSON request/response handling,
- provider error normalization,
- retries/timeouts where safe,
- zero-content logging and sanitized failures.

The UI never imports this layer. Client code talks to provider adapters; cloud
adapters call Nugget API routes; API routes call the LLM layer.

## 2. File structure

```text
src/lib/llm/
  modelClient.ts          # server-only OpenAI-compatible chat/JSON client
  promptRegistry.ts       # promptVersion lookup by task + preset
  extractionPrompts.ts    # extraction prompt builders
  structuredOutput.ts     # JSON extraction/parsing helpers
  errors.ts               # LlmProviderError / LlmValidationError helpers
  index.ts
```

Every file in `src/lib/llm/**` is server-only. Use `import 'server-only'` where
supported by the framework and never import these modules from Client Components,
hooks, or browser providers.

## 3. Runtime configuration

Use server environment variables only. No model credentials are stored in IndexedDB,
localStorage, bundled client code, or settings records.

```text
NUGGET_LLM_BASE_URL       # optional OpenAI-compatible base URL
NUGGET_LLM_API_KEY        # required for cloud extraction
NUGGET_LLM_MODEL          # default extraction model
NUGGET_LLM_TIMEOUT_MS     # optional, bounded default
```

The first implementation may use `fetch` against an OpenAI-compatible endpoint
rather than adding a provider SDK. Provider-specific SDKs remain out of MVP unless
explicitly approved.

## 4. Core contract

```ts
interface LlmJsonRequest {
  promptVersion: string;
  system: string;
  user: string;
  schemaName: string;
  temperature?: number;
  maxOutputTokens?: number;
  signal?: AbortSignal;
}

interface LlmJsonResponse {
  rawText: string;
  json: unknown;
  provider: string;
  model: string;
  promptVersion: string;
}

interface ModelClient {
  generateJson(request: LlmJsonRequest): Promise<LlmJsonResponse>;
}
```

`generateJson` returns untrusted `unknown`. The caller must still run the relevant
Zod parser, e.g. `parseExtractionResult`, before returning or persisting data.

## 5. Extraction prompt registry

Extraction prompts are versioned by preset. Initial IDs:

| Preset | promptVersion |
| --- | --- |
| `general-thought` | `extract-general-thought-v1` |
| `product-idea` | `extract-product-idea-v1` |
| `work-reminder` | `extract-work-reminder-v1` |
| `story-idea` | `extract-story-idea-v1` |

Prompt builders must include:

- the user's editable transcript text,
- optional lightweight context (`ideaId`, title, preset),
- explicit instruction to return only JSON matching the extraction schema,
- the schema fields from PRD §13,
- source-span guidance: offsets are character indexes into `transcript.text`, best
  effort but must remain in range.

Prompt builders must not include raw audio or unrelated database content.

## 6. Route integration

`src/app/api/extract/route.ts` remains thin:

1. validate request shape and payload size,
2. construct prompt via `promptRegistry`,
3. call `modelClient.generateJson`,
4. validate output with `parseExtractionResult`,
5. return typed JSON or sanitized `{ error: { code, message } }`.

The route must not persist transcripts, prompt bodies, model outputs, or provider
errors containing content. If local debug tracing is introduced later, it must be
redacted and opt-in.

## 7. Testing requirements

- Prompt registry resolves each preset to a stable `promptVersion`.
- Prompt builders include schema-critical fields and exclude forbidden content.
- Structured-output parser rejects non-JSON and malformed JSON.
- Model client tests mock `fetch`; no live provider calls in unit tests.
- Route tests prove invalid model output becomes a sanitized error.

## 8. Non-goals

- No autonomous agent loop.
- No memory/RAG layer.
- No semantic search or embeddings in MVP.
- No client-side LLM calls.
- No storing provider credentials in the app database.
