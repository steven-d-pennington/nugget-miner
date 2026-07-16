import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ValidationError } from '@/lib/errors';
import { LlmProviderError, LlmValidationError, createOpenAIModelClient, getExtractionPrompt, publicLlmConfig, resolveLlmConfig } from '@/lib/llm';
import { extractionResultSchema, parseExtractionResult } from '@/lib/validation/extractionResult';
import type { ExtractionPreset } from '@/types';

const allowedPresets = new Set<ExtractionPreset>(['general-thought', 'product-idea', 'work-reminder', 'story-idea']);

// Temporary Task 3 compatibility wire schema. Task 5 replaces this legacy route
// with the two-stage schemas. Responses structured output requires every field,
// so the legacy optional detail fields are nullable on the wire and normalized
// before the existing extraction validator produces the legacy response shape.
const legacyExtractionWireSchema = extractionResultSchema
  .extend({
    nuggets: z.array(
      extractionResultSchema.shape.nuggets.element.extend({
        detail: z.string().trim().nullable(),
      }),
    ),
    actions: z.array(
      extractionResultSchema.shape.actions.element.extend({
        description: z.string().trim().nullable(),
      }),
    ),
    tags: z.array(z.string().trim().min(1)),
    warnings: z.array(z.string().trim().min(1)),
  })
  .strict();

function normalizeLegacyExtractionWire(result: z.infer<typeof legacyExtractionWireSchema>) {
  return {
    ...result,
    nuggets: result.nuggets.map(({ detail, ...nugget }) => (detail === null ? nugget : { ...nugget, detail })),
    actions: result.actions.map(({ description, ...action }) =>
      description === null ? action : { ...action, description },
    ),
  };
}

function parseLegacyExtractionWire(input: unknown) {
  const parsed = legacyExtractionWireSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError('Legacy extraction wire result failed schema validation.');
  }
  return normalizeLegacyExtractionWire(parsed.data);
}

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function isPreset(value: unknown): value is ExtractionPreset {
  return typeof value === 'string' && allowedPresets.has(value as ExtractionPreset);
}

interface ExtractRequestBody {
  ideaId?: unknown;
  title?: unknown;
  preset?: unknown;
  transcript?: {
    id?: unknown;
    text?: unknown;
  };
}

export async function GET() {
  return NextResponse.json(publicLlmConfig());
}

export async function POST(request: Request) {
  const config = resolveLlmConfig();
  if (!config.available || !config.apiKey) {
    return errorResponse(503, 'provider_unconfigured', 'LLM extraction provider is not configured.');
  }

  let body: ExtractRequestBody;
  try {
    body = (await request.json()) as ExtractRequestBody;
  } catch {
    return errorResponse(400, 'invalid_json', 'Request body must be valid JSON.');
  }

  if (typeof body.ideaId !== 'string' || !body.ideaId.trim()) {
    return errorResponse(400, 'invalid_idea', 'ideaId is required.');
  }
  if (!isPreset(body.preset)) {
    return errorResponse(400, 'invalid_preset', 'A valid extraction preset is required.');
  }
  if (!body.transcript || typeof body.transcript.id !== 'string' || typeof body.transcript.text !== 'string' || !body.transcript.text.trim()) {
    return errorResponse(400, 'invalid_transcript', 'A transcript id and text are required.');
  }
  if (body.transcript.text.length > config.maxInputChars) {
    return errorResponse(413, 'transcript_too_large', 'Transcript is too large for extraction.');
  }

  const prompt = getExtractionPrompt({
    ideaId: body.ideaId,
    preset: body.preset,
    title: typeof body.title === 'string' ? body.title : undefined,
    transcriptText: body.transcript.text,
  });
  const client = createOpenAIModelClient({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    model: config.model,
    timeoutMs: config.timeoutMs,
    reasoningEffort: config.reasoningEffort,
  });

  try {
    const response = await client.generateStructured({
      schema: legacyExtractionWireSchema,
      promptVersion: prompt.promptVersion,
      system: prompt.system,
      user: prompt.user,
      schemaName: 'ExtractionResult',
      safetyIdentifier: body.ideaId,
      maxOutputTokens: 1800,
    });
    const result = parseExtractionResult(parseLegacyExtractionWire(response.parsed));
    return NextResponse.json({
      result,
      provider: 'cloud',
      model: response.model,
      promptVersion: response.promptVersion,
    });
  } catch (error) {
    if (error instanceof LlmValidationError || error instanceof ValidationError) {
      return errorResponse(502, 'invalid_model_output', 'The LLM returned output Nugget could not validate.');
    }
    if (error instanceof LlmProviderError) {
      return errorResponse(502, 'provider_error', 'The LLM provider request failed.');
    }
    return errorResponse(500, 'extract_failed', 'Extraction failed.');
  }
}
