import { z } from 'zod';
import { ValidationError } from '@/lib/errors';
import type { ExtractionResult } from '@/types';

export const EXTRACTION_SCHEMA_VERSION = 'extraction-result-v1';

export const sourceSpanSchema = z
  .object({
    start: z.number().int().min(0),
    end: z.number().int().min(0),
  })
  .strict()
  .refine((span) => span.end >= span.start, 'sourceSpan.end must be >= sourceSpan.start');

const confidenceSchema = z.number().min(0).max(1);

export const extractionResultSchema = z
  .object({
    summary: z.string().trim().min(1),
    nuggets: z
      .array(
        z
          .object({
            title: z.string().trim().min(1),
            detail: z.string().trim().optional(),
            category: z.enum(['idea', 'decision', 'risk', 'note']),
            confidence: confidenceSchema,
            sourceSpan: sourceSpanSchema,
          })
          .strict(),
      )
      .min(1),
    actions: z.array(
      z
        .object({
          title: z.string().trim().min(1),
          description: z.string().trim().optional(),
          priority: z.enum(['low', 'medium', 'high']),
          dueDate: z.number().int().positive().nullable(),
          project: z.string().trim().nullable(),
          confidence: confidenceSchema,
          sourceSpan: sourceSpanSchema,
        })
        .strict(),
    ),
    questions: z.array(
      z
        .object({
          text: z.string().trim().min(1),
          confidence: confidenceSchema,
          sourceSpan: sourceSpanSchema,
        })
        .strict(),
    ),
    tags: z.array(z.string().trim().min(1)).default([]),
    warnings: z.array(z.string().trim().min(1)).default([]),
  })
  .strict();

export function parseExtractionResult(input: unknown): ExtractionResult {
  const parsed = extractionResultSchema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError('Extraction result failed schema validation.');
  }
  return parsed.data;
}
