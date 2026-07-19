import { describe, expect, it } from 'vitest';
import { ValidationError } from '@/lib/errors';
import { parseActivationResult } from './schema';

function validResult() {
  return {
    needsClarification: false,
    clarifyingQuestions: [],
    brief: {
      title: 'Neighborhood tool library plan',
      objective: 'Create a practical plan.',
      context: 'Neighbors want to share rarely used tools.',
      assumptions: [],
      constraints: ['Do not invent a budget.'],
      deliverables: ['A small pilot plan.'],
      successCriteria: ['Ten households can evaluate the pilot.'],
      prompt: 'Create a small pilot plan for a neighborhood tool library.',
    },
  };
}

describe('activationResultSchema', () => {
  it('accepts a ready structured brief', () => {
    expect(parseActivationResult(validResult())).toEqual(validResult());
  });

  it('requires questions only when clarification is needed', () => {
    expect(() => parseActivationResult({ ...validResult(), needsClarification: true })).toThrow(ValidationError);
    expect(() => parseActivationResult({
      ...validResult(),
      clarifyingQuestions: [{ id: 'audience', question: 'Who is this for?', reason: 'Scope depends on the audience.' }],
    })).toThrow(ValidationError);
  });

  it('rejects duplicate clarification question IDs', () => {
    const question = { id: 'scope', question: 'What is in scope?', reason: 'The deliverable depends on scope.' };
    expect(() => parseActivationResult({
      ...validResult(),
      needsClarification: true,
      clarifyingQuestions: [question, { ...question, question: 'What is out of scope?' }],
    })).toThrow(ValidationError);
  });
});
