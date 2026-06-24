import { describe, expect, it } from 'vitest';
import { ValidationError } from '@/lib/errors';
import { parseExtractionResult } from './extractionResult';

const validPayload = {
  summary: 'A useful idea about making transcription review faster.',
  nuggets: [
    {
      title: 'Improve review flow',
      detail: 'The transcript suggests making review faster.',
      category: 'idea',
      confidence: 0.87,
      sourceSpan: { start: 0, end: 20 },
    },
  ],
  actions: [
    {
      title: 'Prototype review flow',
      description: 'Build the first review surface.',
      priority: 'medium',
      dueDate: null,
      project: null,
      confidence: 0.75,
      sourceSpan: { start: 2, end: 25 },
    },
  ],
  questions: [
    {
      text: 'What should be reviewed first?',
      confidence: 0.68,
      sourceSpan: { start: 4, end: 30 },
    },
  ],
  tags: ['review', 'transcript'],
  warnings: [],
};

describe('parseExtractionResult', () => {
  it('parses a valid PRD extraction payload', () => {
    expect(parseExtractionResult(validPayload)).toMatchObject({ summary: validPayload.summary, tags: ['review', 'transcript'] });
  });

  it('rejects malformed categories, confidence, and source spans', () => {
    expect(() => parseExtractionResult({ ...validPayload, nuggets: [{ ...validPayload.nuggets[0], category: 'todo' }] })).toThrow(ValidationError);
    expect(() => parseExtractionResult({ ...validPayload, actions: [{ ...validPayload.actions[0], confidence: 2 }] })).toThrow(ValidationError);
    expect(() => parseExtractionResult({ ...validPayload, questions: [{ ...validPayload.questions[0], sourceSpan: { start: 20, end: 3 } }] })).toThrow(ValidationError);
  });
});
