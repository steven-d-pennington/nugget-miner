import { z } from 'zod';
import { ValidationError } from '@/lib/errors';

export const SEGMENTATION_SCHEMA_VERSION = 'segmentation-v1';

export const sourceSpanSchema = z
  .object({
    id: z.string().min(1),
    startChar: z.number().int().min(0),
    endChar: z.number().int().min(0),
    quote: z.string().min(1),
  })
  .strict()
  .refine((span) => span.endChar > span.startChar, {
    message: 'Source span endChar must be greater than startChar.',
    path: ['endChar'],
  });

const segmentedCandidateSchema = z
  .object({
    candidateId: z.string().min(1),
    coreStatement: z.string().min(1),
    sourceSpans: z.array(sourceSpanSchema).min(1),
  })
  .strict()
  .superRefine((candidate, context) => {
    const seenSpanIds = new Set<string>();
    candidate.sourceSpans.forEach((span, index) => {
      if (seenSpanIds.has(span.id)) {
        context.addIssue({
          code: 'custom',
          message: 'Source span IDs must be unique within a candidate.',
          path: ['sourceSpans', index, 'id'],
        });
      }
      seenSpanIds.add(span.id);
    });
  });

export const segmentationResultSchema = z
  .object({
    ideas: z.array(segmentedCandidateSchema).max(12),
  })
  .strict()
  .superRefine((result, context) => {
    const seenCandidateIds = new Set<string>();
    result.ideas.forEach((idea, index) => {
      if (seenCandidateIds.has(idea.candidateId)) {
        context.addIssue({
          code: 'custom',
          message: 'Candidate IDs must be unique.',
          path: ['ideas', index, 'candidateId'],
        });
      }
      seenCandidateIds.add(idea.candidateId);
    });
  });

export type SegmentationResult = z.infer<typeof segmentationResultSchema>;

export function parseSegmentationResult(input: unknown): SegmentationResult {
  const parsed = segmentationResultSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError('Segmentation result failed schema validation.');
  }
  return parsed.data;
}
