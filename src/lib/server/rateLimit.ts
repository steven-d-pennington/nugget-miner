interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const MAX_BUCKETS = 2_000;
const buckets = new Map<string, Bucket>();

function removeExpiredBuckets(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function enforceBucketLimit() {
  while (buckets.size > MAX_BUCKETS) {
    let earliestKey: string | undefined;
    let earliestResetAt = Number.POSITIVE_INFINITY;
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt < earliestResetAt) {
        earliestKey = key;
        earliestResetAt = bucket.resetAt;
      }
    }
    if (!earliestKey) return;
    buckets.delete(earliestKey);
  }
}

export function consumeRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  removeExpiredBuckets(now);
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    const bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(key, bucket);
    enforceBucketLimit();
    return { allowed: true, remaining: limit - 1, resetAt: bucket.resetAt };
  }

  current.count += 1;
  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
  };
}

export function rateLimitHeaders(result: RateLimitResult, now = Date.now()) {
  return {
    'Retry-After': String(Math.max(1, Math.ceil((result.resetAt - now) / 1_000))),
    'X-RateLimit-Remaining': String(result.remaining),
  };
}

export function resetRateLimitsForTest() {
  buckets.clear();
}

export function rateLimitBucketCountForTest() {
  return buckets.size;
}
