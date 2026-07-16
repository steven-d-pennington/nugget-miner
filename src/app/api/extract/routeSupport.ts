import { ValidationError } from '@/lib/errors';
import { LlmProviderError, LlmValidationError } from '@/lib/llm';
import type { StructuredResponse } from '@/lib/llm';

export class InvalidModelOutputError extends Error {
  constructor() {
    super('Structured model output remained invalid after one retry.');
    this.name = 'InvalidModelOutputError';
  }
}

export function errorResponse(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

export async function runValidatedStructured<TParsed, TResult>(
  generate: () => Promise<StructuredResponse<TParsed>>,
  validate: (parsed: TParsed) => TResult,
): Promise<{ result: TResult; response: StructuredResponse<TParsed> }> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await generate();
      return { result: validate(response.parsed), response };
    } catch (error) {
      const invalidOutput = error instanceof LlmValidationError || error instanceof ValidationError;
      if (!invalidOutput) throw error;
      if (attempt === 1) throw new InvalidModelOutputError();
    }
  }

  throw new InvalidModelOutputError();
}

export function extractionErrorResponse(error: unknown) {
  if (error instanceof InvalidModelOutputError) {
    return errorResponse(502, 'invalid_model_output', 'The LLM returned output Nugget could not validate.');
  }
  if (error instanceof LlmProviderError) {
    return errorResponse(502, 'provider_error', 'The LLM provider request failed.');
  }
  return errorResponse(500, 'extract_failed', 'Extraction failed.');
}
