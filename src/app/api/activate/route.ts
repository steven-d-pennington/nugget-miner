import { z } from 'zod';
import {
  ACTIVATION_PROMPT_VERSION,
  ACTIVATION_SCHEMA_VERSION,
  activationIdeaContextSchema,
  activationIntentSchema,
  activationResultSchema,
  buildActivationPrompt,
  parseActivationResult,
} from '@/lib/activation';
import { createOpenAIModelClient, resolveLlmConfig } from '@/lib/llm';
import { consumeRateLimit, rateLimitHeaders, rateLimitKey } from '@/lib/server/rateLimit';
import { requestIdentity } from '@/lib/server/requestIdentity';
import {
  errorResponse,
  runValidatedStructured,
  structuredLlmErrorResponse,
} from '../extract/routeSupport';

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1_000;
const ACTIVATION_RATE_LIMIT = 20;

const answerSchema = z
  .object({
    questionId: z.string().min(1).max(80),
    question: z.string().min(1).max(280),
    answer: z.string().min(1).max(2000),
  })
  .strict();

const requestSchema = z
  .object({
    ideaId: z.string().min(1).max(200),
    intent: activationIntentSchema,
    idea: activationIdeaContextSchema,
    answers: z.array(answerSchema).max(4),
    safetyIdentifier: z.string().uuid(),
  })
  .strict();

async function readRequest(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await request.json());
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

export async function POST(request: Request) {
  const body = await readRequest(request);
  if (!body) return errorResponse(400, 'invalid_request', 'Request body is invalid.');

  const config = resolveLlmConfig();
  if (JSON.stringify({ idea: body.idea, answers: body.answers }).length > config.maxInputChars) {
    return errorResponse(413, 'idea_too_large', 'This idea is too large to prepare as an AI brief.');
  }
  if (!config.available || !config.apiKey) {
    return errorResponse(503, 'provider_unconfigured', 'AI brief generation is not configured.');
  }

  const limit = consumeRateLimit(
    rateLimitKey('activation', requestIdentity(request, body.safetyIdentifier)),
    ACTIVATION_RATE_LIMIT,
    RATE_LIMIT_WINDOW_MS,
  );
  if (!limit.allowed) {
    return Response.json(
      { error: { code: 'rate_limited', message: 'Too many AI brief requests. Try again in a few minutes.' } },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  const prompt = buildActivationPrompt({ intent: body.intent, idea: body.idea, answers: body.answers });
  const client = createOpenAIModelClient({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    model: config.model,
    timeoutMs: config.timeoutMs,
    reasoningEffort: config.reasoningEffort,
  });

  try {
    const { result, response } = await runValidatedStructured(
      () => client.generateStructured({
        schema: activationResultSchema,
        schemaName: 'ActivationResult',
        promptVersion: ACTIVATION_PROMPT_VERSION,
        system: prompt.system,
        user: prompt.user,
        safetyIdentifier: body.safetyIdentifier,
        maxOutputTokens: 6000,
      }),
      parseActivationResult,
    );

    return Response.json({
      result,
      provider: response.provider,
      model: response.model,
      responseId: response.responseId,
      promptVersion: response.promptVersion,
      schemaVersion: ACTIVATION_SCHEMA_VERSION,
    });
  } catch (error) {
    return structuredLlmErrorResponse(error, 'activation_failed', 'AI brief generation failed.');
  }
}
