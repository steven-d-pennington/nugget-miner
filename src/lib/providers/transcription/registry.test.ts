import { describe, expect, it } from 'vitest';
import { getTranscriptionProvider, listTranscriptionProviders } from './index';

describe('transcription provider registry', () => {
  it('registers mock as the default available provider', async () => {
    const providers = await listTranscriptionProviders();

    expect(providers.map((provider) => provider.id)).toContain('mock');
    const mock = getTranscriptionProvider('mock');
    expect(mock).toMatchObject({ id: 'mock', mode: 'mock' });
    await expect(mock?.isAvailable()).resolves.toBe(true);
  });

  it('does not list unavailable cloud provider as available', async () => {
    const providers = await listTranscriptionProviders({ includeUnavailable: false });

    expect(providers.find((provider) => provider.id === 'cloud')).toBeUndefined();
  });
});
