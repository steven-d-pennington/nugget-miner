import { z } from 'zod';
import {
  createOpenAIModelClient,
  getSegmentationPrompt,
  resolveLlmConfig,
} from '@/lib/llm';
import { normalizeSegmentationSpans } from '@/lib/validation/grounding';
import {
  parseSegmentationResult,
  SEGMENTATION_SCHEMA_VERSION,
  segmentationResultSchema,
} from '@/lib/validation/segmentationResult';
import {
  errorResponse,
  extractionErrorResponse,
  runValidatedStructured,
} from '../routeSupport';

const segmentRequestSchema = z
  .object({
    captureSessionId: z.string().uuid(),
    transcript: z
      .object({
        id: z.string().uuid(),
        hash: z.string().min(1),
        text: z.string().min(1),
      })
      .strict(),
    safetyIdentifier: z.string().uuid(),
  })
  .strict();

async function readRequest(request: Request) {
  try {
    const parsed = segmentRequestSchema.safeParse(await request.json());
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

export async function POST(request: Request) {
  const body = await readRequest(request);
  if (!body) {
    return errorResponse(400, 'invalid_request', 'Request body is invalid.');
  }

  const config = resolveLlmConfig();
  if (body.transcript.text.length > config.maxInputChars) {
    return errorResponse(413, 'transcript_too_large', 'Transcript is too large for extraction.');
  }
  if (!config.available || !config.apiKey) {
    return errorResponse(503, 'provider_unconfigured', 'LLM extraction provider is not configured.');
  }

  const prompt = getSegmentationPrompt({
    transcriptHash: body.transcript.hash,
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
    const { result, response } = await runValidatedStructured(
      () =>
        client.generateStructured({
          schema: segmentationResultSchema,
          schemaName: 'SegmentationResult',
          promptVersion: prompt.promptVersion,
          system: prompt.system,
          user: prompt.user,
          safetyIdentifier: body.safetyIdentifier,
          maxOutputTokens: 1800,
        }),
      (parsed) => normalizeSegmentationSpans(body.transcript.text, parseSegmentationResult(parsed)),
    );

    return Response.json({
      result,
      provider: response.provider,
      model: response.model,
      responseId: response.responseId,
      promptVersion: response.promptVersion,
      schemaVersion: SEGMENTATION_SCHEMA_VERSION,
    });
  } catch (error) {
    return extractionErrorResponse(error);
  }
}
