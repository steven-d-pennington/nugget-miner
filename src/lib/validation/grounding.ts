import { ValidationError } from '@/lib/errors';
import type { OrganizationResult } from './organizationResult';
import type { SegmentationResult } from './segmentationResult';

export function normalizeSegmentationSpans(transcript: string, result: SegmentationResult): SegmentationResult {
  return {
    ideas: result.ideas.map((idea) => ({
      ...idea,
      sourceSpans: idea.sourceSpans.map((span) => {
        const offsetIsInBounds = span.endChar <= transcript.length;
        if (offsetIsInBounds && transcript.slice(span.startChar, span.endChar) === span.quote) {
          return span;
        }

        const first = transcript.indexOf(span.quote);
        const second = first < 0 ? -1 : transcript.indexOf(span.quote, first + 1);
        if (first < 0 || second >= 0) {
          throw new ValidationError('Source quote could not be mapped uniquely to the transcript.');
        }

        return {
          ...span,
          startChar: first,
          endChar: first + span.quote.length,
        };
      }),
    })),
  };
}

export function validateOrganizationGrounding(
  segmentation: SegmentationResult,
  organization: OrganizationResult,
): void {
  const candidates = new Map(segmentation.ideas.map((item) => [item.candidateId, item]));
  const organizedCandidateIds = new Set(organization.ideas.map((item) => item.candidateId));

  for (const idea of organization.ideas) {
    const candidate = candidates.get(idea.candidateId);
    if (!candidate) {
      throw new ValidationError('Organization referenced an unknown candidate.');
    }

    const validSpanIds = new Set(candidate.sourceSpans.map((span) => span.id));
    const grounded = [
      idea.summary,
      idea.purpose,
      ...idea.goals,
      idea.problem?.statement,
      ...idea.blockers,
      ...idea.questions,
      ...idea.suggestedActions,
      idea.research.assessment,
    ];

    for (const field of grounded) {
      if (!field) continue;
      if (field.basis === 'explicit' && field.sourceSpanIds.length === 0) {
        throw new ValidationError('Explicit content requires source evidence.');
      }
      if (field.sourceSpanIds.some((id) => !validSpanIds.has(id))) {
        throw new ValidationError('Content referenced an unknown source span.');
      }
    }
  }

  for (const candidateId of candidates.keys()) {
    if (!organizedCandidateIds.has(candidateId)) {
      throw new ValidationError('Organization omitted a segmented candidate.');
    }
  }
}
