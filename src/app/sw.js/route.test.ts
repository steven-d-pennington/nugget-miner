import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('GET /sw.js', () => {
  it('serves a revalidated root-scoped release worker', async () => {
    const response = GET();

    expect(response.headers.get('content-type')).toContain('application/javascript');
    expect(response.headers.get('cache-control')).toContain('no-cache');
    expect(response.headers.get('service-worker-allowed')).toBe('/');
    expect(await response.text()).toContain(
      process.env.NEXT_PUBLIC_NUGGET_RELEASE ?? 'local-development',
    );
  });
});
