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

  it('preserves relative static route analytics while removing query strings and fragments', () => {
    expect(sanitizeAnalyticsUrl('/settings?consent=granted#privacy')).toBe('/settings');
  });

  it('keeps the origin for absolute analytics URLs while removing local IDs, query strings, and fragments', () => {
    expect(
      sanitizeAnalyticsUrl('https://nugget-miner-kappa.vercel.app/capture/capture-local-123?transcript=private#source'),
    ).toBe('https://nugget-miner-kappa.vercel.app/capture/[capture]');
    expect(sanitizeAnalyticsUrl('http://localhost:3000/review/idea-local-456?draft=private#summary')).toBe(
      'http://localhost:3000/review/[idea]',
    );
    expect(sanitizeAnalyticsUrl('https://nugget-miner-kappa.vercel.app/actions?filter=open#today')).toBe(
      'https://nugget-miner-kappa.vercel.app/actions',
    );
  });

  it('drops malformed or unsafe input instead of forwarding it', () => {
    expect(sanitizeAnalyticsUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeAnalyticsUrl('//other.example/capture/local-id')).toBeNull();
    expect(sanitizeAnalyticsUrl('not-a-url')).toBeNull();
    expect(sanitizeAnalyticsUrl(undefined)).toBeNull();
  });
});
