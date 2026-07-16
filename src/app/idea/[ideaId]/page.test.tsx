import { describe, expect, it, vi } from 'vitest';

const redirect = vi.fn(() => {
  throw new Error('NEXT_REDIRECT');
});

vi.mock('next/navigation', () => ({ redirect }));

describe('legacy idea route', () => {
  it('redirects exactly to the capture route', async () => {
    const { default: LegacyIdeaPage } = await import('./page');
    await expect(LegacyIdeaPage({ params: Promise.resolve({ ideaId: 'capture-123' }) })).rejects.toThrow('NEXT_REDIRECT');
    expect(redirect).toHaveBeenCalledWith('/capture/capture-123');
  });
});
