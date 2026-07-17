const SAFE_ORIGIN = 'https://nugget.invalid';

const dynamicRoutePlaceholders: Record<string, string> = {
  capture: '[capture]',
  idea: '[idea]',
  ideas: '[idea]',
  review: '[idea]',
};

/**
 * Keeps page-view analytics useful without exposing browser-local record IDs or
 * query/hash data. Returning null tells the analytics boundary to drop unsafe
 * input rather than risk forwarding it.
 */
export function sanitizeAnalyticsUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) return null;

  const isPath = value.startsWith('/') && !value.startsWith('//');
  const isHttpUrl = /^https?:\/\//i.test(value);
  if (!isPath && !isHttpUrl) return null;

  let parsed: URL;
  try {
    parsed = new URL(value, SAFE_ORIGIN);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;

  const segments = parsed.pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  let sanitizedPathname: string;
  if (firstSegment && segments.length > 1 && dynamicRoutePlaceholders[firstSegment]) {
    sanitizedPathname = `/${firstSegment}/${dynamicRoutePlaceholders[firstSegment]}`;
  } else {
    sanitizedPathname = parsed.pathname || '/';
  }

  return isHttpUrl ? `${parsed.origin}${sanitizedPathname}` : sanitizedPathname;
}
