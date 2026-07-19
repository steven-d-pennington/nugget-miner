import { z } from 'zod';
import { ValidationError } from '@/lib/errors';

export const ACTIVATION_SCHEMA_VERSION = 'activation-v1';

export const activationIntentSchema = z.enum(['explore', 'plan', 'agent']);

export const activationQuestionSchema = z
  .object({
    id: z.string().min(1).max(80),
    question: z.string().min(1).max(280),
    reason: z.string().min(1).max(280),
  })
  .strict();

export const activationBriefContentSchema = z
  .object({
    title: z.string().min(1).max(160),
    objective: z.string().min(1).max(1200),
    context: z.string().min(1).max(4000),
    assumptions: z.array(z.string().min(1).max(500)).max(8),
    constraints: z.array(z.string().min(1).max(500)).max(10),
    deliverables: z.array(z.string().min(1).max(500)).min(1).max(10),
    successCriteria: z.array(z.string().min(1).max(500)).min(1).max(10),
    prompt: z.string().min(1).max(12000),
  })
  .strict();

export const activationResultSchema = z
  .object({
    needsClarification: z.boolean(),
    clarifyingQuestions: z.array(activationQuestionSchema).max(4),
    brief: activationBriefContentSchema,
  })
  .strict()
  .superRefine((result, context) => {
    if (result.needsClarification && result.clarifyingQuestions.length === 0) {
      context.addIssue({ code: 'custom', message: 'Clarification requires at least one question.' });
    }
    if (!result.needsClarification && result.clarifyingQuestions.length > 0) {
      context.addIssue({ code: 'custom', message: 'A ready brief cannot include blocking questions.' });
    }
    const ids = new Set<string>();
    result.clarifyingQuestions.forEach((question, index) => {
      if (ids.has(question.id)) {
        context.addIssue({ code: 'custom', message: 'Clarification question IDs must be unique.', path: ['clarifyingQuestions', index, 'id'] });
      }
      ids.add(question.id);
    });
  });

export type ActivationResult = z.infer<typeof activationResultSchema>;

export function parseActivationResult(input: unknown): ActivationResult {
  const parsed = activationResultSchema.safeParse(input);
  if (!parsed.success) throw new ValidationError('Activation result failed schema validation.');
  return parsed.data;
}
