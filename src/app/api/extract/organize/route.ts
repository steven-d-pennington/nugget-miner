import { z } from 'zod';
import { ValidationError } from '@/lib/errors';
import {
  createOpenAIModelClient,
  getOrganizationPrompt,
  resolveLlmConfig,
} from '@/lib/llm';
import { validateOrganizationGrounding } from '@/lib/validation/grounding';
import {
  ORGANIZATION_SCHEMA_VERSION,
  organizationResultSchema,
  parseOrganizationResult,
} from '@/lib/validation/organizationResult';
import { segmentationResultSchema } from '@/lib/validation/segmentationResult';
import {
  errorResponse,
  extractionErrorResponse,
  runValidatedStructured,
} from '../routeSupport';

const categorySchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    isFallback: z.boolean(),
  })
  .strict();

const categoriesSchema = z
  .array(categorySchema)
  .min(1)
  .max(20)
  .superRefine((categories, context) => {
    const seenIds = new Set<string>();
    categories.forEach((category, index) => {
      if (seenIds.has(category.id)) {
        context.addIssue({
          code: 'custom',
          message: 'Category IDs must be unique.',
          path: [index, 'id'],
        });
      }
      seenIds.add(category.id);
    });

    if (categories.filter((category) => category.isFallback).length !== 1) {
      context.addIssue({
        code: 'custom',
        message: 'Exactly one fallback category is required.',
      });
    }
  });

const organizeRequestSchema = z
  .object({
    captureSessionId: z.string().uuid(),
    transcript: z
      .object({
        id: z.string().uuid(),
        hash: z.string().min(1),
      })
      .strict(),
    segmentation: segmentationResultSchema,
    categories: categoriesSchema,
    safetyIdentifier: z.string().uuid(),
  })
  .strict();

async function readRequest(request: Request) {
  try {
    const parsed = organizeRequestSchema.safeParse(await request.json());
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
  if (!config.available || !config.apiKey) {
    return errorResponse(503, 'provider_unconfigured', 'LLM extraction provider is not configured.');
  }

  const prompt = getOrganizationPrompt({
    candidates: body.segmentation.ideas,
    categories: body.categories,
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
          schema: organizationResultSchema,
          schemaName: 'OrganizationResult',
          promptVersion: prompt.promptVersion,
          system: prompt.system,
          user: prompt.user,
          safetyIdentifier: body.safetyIdentifier,
          maxOutputTokens: 4000,
        }),
      (parsed) => {
        const result = parseOrganizationResult(parsed);
        validateOrganizationGrounding(body.segmentation, result);
        const allowedIds = new Set(body.categories.map((category) => category.id));
        if (result.ideas.some((idea) => !allowedIds.has(idea.categoryId))) {
          throw new ValidationError('Organization returned an unknown category.');
        }
        return result;
      },
    );

    return Response.json({
      result,
      provider: response.provider,
      model: response.model,
      responseId: response.responseId,
      promptVersion: response.promptVersion,
      schemaVersion: ORGANIZATION_SCHEMA_VERSION,
    });
  } catch (error) {
    return extractionErrorResponse(error);
  }
}
