import type { ContentBasis } from '@/types';

const provenance: Record<ContentBasis, { label: string; explanation: string }> = {
  explicit: {
    label: 'Explicit',
    explanation: 'Directly supported by the transcript excerpts.',
  },
  inferred: {
    label: 'Inferred',
    explanation: 'Reasonably inferred from the transcript, but not stated directly.',
  },
  suggested: {
    label: 'Suggested',
    explanation: 'Proposed by Nugget as a useful addition, not stated in the transcript.',
  },
};

export function ProvenanceBadge({ basis }: { basis: ContentBasis }) {
  const details = provenance[basis];

  return (
    <span className="provenance-badge" data-basis={basis} title={details.explanation}>
      {details.label}
      <span className="sr-only">. {details.explanation}</span>
    </span>
  );
}
