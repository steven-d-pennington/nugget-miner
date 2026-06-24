import { NextResponse } from 'next/server';
import { ValidationError } from '@/lib/errors';
import { LlmProviderError, LlmValidationError, createOpenAICompatibleModelClient, getExtractionPrompt, publicLlmConfig, resolveLlmConfig } from '@/lib/llm';
import { parseExtractionResult } from '@/lib/validation/extractionResult';
import type { ExtractionPreset } from '@/types';

const allowedPresets = new Set<ExtractionPreset>(['general-thought', 'product-idea', 'work-reminder', 'story-idea']);

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
  if (!config.available) {
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
  const client = createOpenAICompatibleModelClient(config);

  try {
    const response = await client.generateJson({
      promptVersion: prompt.promptVersion,
      system: prompt.system,
      user: prompt.user,
      schemaName: 'ExtractionResult',
    });
    const result = parseExtractionResult(response.json);
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
