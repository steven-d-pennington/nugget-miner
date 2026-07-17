import { afterEach, describe, expect, it } from 'vitest';
import { consumeRateLimit, rateLimitBucketCountForTest, rateLimitKey, resetRateLimitsForTest } from './rateLimit';

afterEach(() => {
  resetRateLimitsForTest();
});

describe('consumeRateLimit', () => {
  it('enforces a token window boundary without returning a negative remaining count', () => {
    const now = 1_000;

    expect(consumeRateLimit('client:a', 2, 600_000, now)).toEqual({ allowed: true, remaining: 1, resetAt: 601_000 });
    expect(consumeRateLimit('client:a', 2, 600_000, now + 1)).toEqual({ allowed: true, remaining: 0, resetAt: 601_000 });
    expect(consumeRateLimit('client:a', 2, 600_000, now + 2)).toEqual({ allowed: false, remaining: 0, resetAt: 601_000 });
  });

  it('isolates identities and resets an expired window', () => {
    const now = 1_000;
    consumeRateLimit('client:a', 1, 10, now);

    expect(consumeRateLimit('client:b', 1, 10, now + 1)).toMatchObject({ allowed: true, remaining: 0 });
    expect(consumeRateLimit('client:a', 1, 10, now + 10)).toEqual({ allowed: true, remaining: 0, resetAt: 1_020 });
  });

  it('isolates route namespaces for the same request identity', () => {
    const now = 1_000;
    const identity = 'client:9c21b2a2-2f45-4c35-b1cb-19a2c17bbcd7';

    expect(consumeRateLimit(rateLimitKey('transcription', identity), 1, 60_000, now)).toMatchObject({ allowed: true });
    expect(consumeRateLimit(rateLimitKey('segmentation', identity), 1, 60_000, now)).toMatchObject({ allowed: true });
    expect(consumeRateLimit(rateLimitKey('organization', identity), 1, 60_000, now)).toMatchObject({ allowed: true });
    expect(consumeRateLimit(rateLimitKey('transcription', identity), 1, 60_000, now + 1)).toMatchObject({ allowed: false });
  });

  it('removes expired identities and caps active identities at two thousand buckets', () => {
    consumeRateLimit('expired', 1, 1, 0);
    consumeRateLimit('fresh', 1, 60_000, 1);
    expect(rateLimitBucketCountForTest()).toBe(1);

    for (let index = 0; index < 2_001; index += 1) {
      consumeRateLimit(`client:${index}`, 1, 60_000, 2);
    }

    expect(rateLimitBucketCountForTest()).toBe(2_000);
  });
});
