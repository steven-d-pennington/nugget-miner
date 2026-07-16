import type { GroundedText, SourceSpan } from '@/types';

export function isValidSourceSpan(span: SourceSpan | undefined): span is SourceSpan {
  return Boolean(
    span &&
      span.id.trim() &&
      span.startChar >= 0 &&
      span.endChar > span.startChar &&
      span.endChar - span.startChar === span.quote.length &&
      span.quote.trim(),
  );
}

export function resolveSourceSpans(grounded: GroundedText, sourceSpans: SourceSpan[]) {
  const storedSpans = new Map(sourceSpans.map((span) => [span.id, span]));
  const seen = new Set<string>();

  return grounded.sourceSpanIds.flatMap((id) => {
    if (seen.has(id)) return [];
    seen.add(id);
    const span = storedSpans.get(id);
    return isValidSourceSpan(span) ? [span] : [];
  });
}

export function hasValidExplicitEvidence(grounded: GroundedText, sourceSpans: SourceSpan[]) {
  if (grounded.basis !== 'explicit') return true;
  if (grounded.sourceSpanIds.length === 0) return false;

  const storedSpans = new Map(sourceSpans.map((span) => [span.id, span]));
  return grounded.sourceSpanIds.every((id) => isValidSourceSpan(storedSpans.get(id)));
}

export function SourceExcerpt({
  grounded,
  sourceSpans,
}: {
  grounded: GroundedText;
  sourceSpans: SourceSpan[];
}) {
  const resolved = resolveSourceSpans(grounded, sourceSpans);
  const invalidExplicitEvidence = !hasValidExplicitEvidence(grounded, sourceSpans);

  return (
    <>
      {invalidExplicitEvidence ? (
        <p className="grounding-error" role="alert">
          Explicit content needs valid supporting transcript evidence before it can be confirmed.
        </p>
      ) : null}
      {resolved.length > 0 ? (
        <details className="source-excerpt">
          <summary>{resolved.length === 1 ? 'View source excerpt' : `View ${resolved.length} source excerpts`}</summary>
          <div className="source-excerpt__quotes">
            {resolved.map((span) => (
              <blockquote key={span.id}>{span.quote}</blockquote>
            ))}
          </div>
        </details>
      ) : null}
    </>
  );
}
