import { LlmValidationError } from './errors';

function stripJsonFence(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
}

export function extractJsonObject(text: string): unknown {
  const candidate = stripJsonFence(text);
  try {
    const parsed = JSON.parse(candidate) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new LlmValidationError('Model output was not a JSON object.');
    }
    return parsed;
  } catch (error) {
    if (error instanceof LlmValidationError) throw error;
    throw new LlmValidationError('Model output was not valid JSON.');
  }
}
