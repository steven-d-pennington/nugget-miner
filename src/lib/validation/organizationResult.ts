import { z } from 'zod';
import { ValidationError } from '@/lib/errors';

export const ORGANIZATION_SCHEMA_VERSION = 'organization-v1';

const basisSchema = z.enum(['explicit', 'inferred', 'suggested']);

export const groundedTextSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1),
    basis: basisSchema,
    sourceSpanIds: z.array(z.string().min(1)),
  })
  .strict()
  .superRefine((groundedText, context) => {
    const seenSpanIds = new Set<string>();
    groundedText.sourceSpanIds.forEach((spanId, index) => {
      if (seenSpanIds.has(spanId)) {
        context.addIssue({
          code: 'custom',
          message: 'Grounded source span IDs must be unique.',
          path: ['sourceSpanIds', index],
        });
      }
      seenSpanIds.add(spanId);
    });
  });

const organizedCandidateObjectSchema = z
  .object({
    candidateId: z.string().min(1),
    title: z.string().min(1).max(120),
    summary: groundedTextSchema,
    purpose: groundedTextSchema.nullable(),
    goals: z.array(groundedTextSchema).max(8),
    problem: z
      .object({
        statement: groundedTextSchema,
        type: z.string().max(80).nullable(),
      })
      .strict()
      .nullable(),
    blockers: z.array(groundedTextSchema).max(8),
    questions: z.array(groundedTextSchema).max(8),
    suggestedActions: z.array(groundedTextSchema).max(8),
    research: z
      .object({
        needed: z.boolean(),
        assessment: groundedTextSchema.nullable(),
        suggestedQueries: z.array(z.string().min(1)).max(5),
        suggestedResourceTypes: z.array(z.string().min(1)).max(5),
      })
      .strict(),
    categoryId: z.string().min(1),
    categoryConfidence: z.number().min(0).max(1),
    tags: z.array(z.string().min(1).max(40)).max(6),
    warnings: z.array(z.string().min(1)).max(8),
  })
  .strict();

export const organizedCandidateSchema = organizedCandidateObjectSchema.superRefine((candidate, context) => {
  const groundedFields = [
    candidate.summary,
    candidate.purpose,
    ...candidate.goals,
    candidate.problem?.statement,
    ...candidate.blockers,
    ...candidate.questions,
    ...candidate.suggestedActions,
    candidate.research.assessment,
  ].filter((field): field is z.infer<typeof groundedTextSchema> => field !== null && field !== undefined);

  const seenGroundedTextIds = new Set<string>();
  groundedFields.forEach((field) => {
    if (seenGroundedTextIds.has(field.id)) {
      context.addIssue({
        code: 'custom',
        message: 'Grounded content IDs must be unique within a candidate.',
      });
    }
    seenGroundedTextIds.add(field.id);
  });
});

export const organizationResultSchema = z
  .object({
    ideas: z.array(organizedCandidateSchema).max(12),
  })
  .strict()
  .superRefine((result, context) => {
    const seenCandidateIds = new Set<string>();
    result.ideas.forEach((idea, index) => {
      if (seenCandidateIds.has(idea.candidateId)) {
        context.addIssue({
          code: 'custom',
          message: 'Organized candidate IDs must be unique.',
          path: ['ideas', index, 'candidateId'],
        });
      }
      seenCandidateIds.add(idea.candidateId);
    });
  });

export type OrganizationResult = z.infer<typeof organizationResultSchema>;

export function parseOrganizationResult(input: unknown): OrganizationResult {
  const parsed = organizationResultSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError('Organization result failed schema validation.');
  }
  return parsed.data;
}
