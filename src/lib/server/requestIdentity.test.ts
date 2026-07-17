import { describe, expect, it } from 'vitest';
import { requestIdentity } from './requestIdentity';

const clientId = '20000000-0000-4000-8000-000000000001';

function request(forwardedFor?: string) {
  return new Request('https://nugget.example.test/api/extract/segment', {
    headers: forwardedFor ? { 'x-forwarded-for': forwardedFor } : undefined,
  });
}

describe('requestIdentity', () => {
  it('uses only a validated UUID client ID as the private in-memory key', () => {
    expect(requestIdentity(request('198.51.100.9'), clientId)).toBe(`client:${clientId}`);
  });

  it('falls back to the first forwarded IP or unknown without exposing the client value', () => {
    expect(requestIdentity(request('198.51.100.9, 10.0.0.4'), 'not-a-uuid')).toBe('ip:198.51.100.9');
    expect(requestIdentity(request(), undefined)).toBe('ip:unknown');
  });
});
