import { z } from 'zod';
import { ProviderError } from '@/lib/errors';
import type { ActivationIntent } from '@/types';
import type { ActivationIdeaContext } from './context';
import type { ActivationAnswer } from './prompt';
import { activationResultSchema } from './schema';

const activationResponseSchema = z
  .object({
    result: activationResultSchema,
    provider: z.literal('openai'),
    model: z.string().min(1),
    responseId: z.string().min(1),
    promptVersion: z.string().min(1),
    schemaVersion: z.string().min(1),
  })
  .strict();

const routeErrorSchema = z.object({ error: z.object({ code: z.string(), message: z.string() }).strict() }).strict();

export async function generateActivationBrief(input: {
  ideaId: string;
  intent: ActivationIntent;
  idea: ActivationIdeaContext;
  answers: ActivationAnswer[];
  safetyIdentifier: string;
  signal?: AbortSignal;
}) {
  let response: Response;
  try {
    response = await fetch('/api/activate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
      signal: input.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ProviderError('AI brief generation could not connect.');
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  if (!response.ok) {
    const parsedError = routeErrorSchema.safeParse(body);
    throw new ProviderError(parsedError.success ? parsedError.data.error.message : 'AI brief generation failed.');
  }
  const parsed = activationResponseSchema.safeParse(body);
  if (!parsed.success) throw new ProviderError('AI brief generation returned an invalid response.');
  return parsed.data;
}
