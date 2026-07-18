import { describe, expect, it } from 'vitest';
import { buildServiceWorkerSource } from './serviceWorkerSource';

describe('buildServiceWorkerSource', () => {
  it('creates a release-specific worker that waits for explicit activation', () => {
    const source = buildServiceWorkerSource('dpl_test-123');
    const installHandler = source.match(/addEventListener\('install',[\s\S]*?\n\}\);/)?.[0] ?? '';

    expect(source).toContain('dpl_test-123');
    expect(source).toContain("const CACHE_PREFIX = 'nugget-shell-'");
    expect(source).toContain("event.data?.type === 'SKIP_WAITING'");
    expect(installHandler).not.toContain('skipWaiting()');
    expect(source).toContain("url.pathname.startsWith('/api/')");
    expect(source).not.toMatch(/audio|transcript|full-export/i);
  });

  it('serializes the release identifier as inert data', () => {
    const hostile = "release'; self.pwned = true; //";
    const source = buildServiceWorkerSource(hostile);

    expect(source).toContain(JSON.stringify(hostile));
    expect(source).not.toContain("const RELEASE_ID = 'release'; self.pwned");
  });
});
