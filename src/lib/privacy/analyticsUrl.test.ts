import { describe, expect, it } from 'vitest';
import { sanitizeAnalyticsUrl } from './analyticsUrl';

describe('sanitizeAnalyticsUrl', () => {
  it.each([
    ['/capture/capture-local-123?transcript=private#source', '/capture/[capture]'],
    ['/idea/idea-local-123?export=json#details', '/idea/[idea]'],
    ['/ideas/idea-local-123?tag=private#source', '/ideas/[idea]'],
    ['/review/idea-local-123?draft=private#summary', '/review/[idea]'],
  ])('masks local identifiers for %s', (input, expected) => {
    expect(sanitizeAnalyticsUrl(input)).toBe(expected);
  });

  it('preserves static route analytics while removing query strings and fragments', () => {
    expect(sanitizeAnalyticsUrl('/settings?consent=granted#privacy')).toBe('/settings');
    expect(sanitizeAnalyticsUrl('https://nugget-miner-kappa.vercel.app/actions?filter=open#today')).toBe('/actions');
  });

  it('drops malformed or unsafe input instead of forwarding it', () => {
    expect(sanitizeAnalyticsUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeAnalyticsUrl('//other.example/capture/local-id')).toBeNull();
    expect(sanitizeAnalyticsUrl('not-a-url')).toBeNull();
    expect(sanitizeAnalyticsUrl(undefined)).toBeNull();
  });
});
