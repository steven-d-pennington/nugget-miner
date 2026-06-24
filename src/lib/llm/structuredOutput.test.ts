import { describe, expect, it } from 'vitest';
import { LlmValidationError } from './errors';
import { extractJsonObject } from './structuredOutput';

describe('extractJsonObject', () => {
  it('parses raw JSON or fenced JSON from model text', () => {
    expect(extractJsonObject('{"summary":"ok"}')).toEqual({ summary: 'ok' });
    expect(extractJsonObject('```json\n{"summary":"ok"}\n```')).toEqual({ summary: 'ok' });
  });

  it('rejects malformed or missing JSON', () => {
    expect(() => extractJsonObject('not json')).toThrow(LlmValidationError);
    expect(() => extractJsonObject('{"summary":')).toThrow(LlmValidationError);
  });
});
