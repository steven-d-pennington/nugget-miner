import { createCloudTranscriptionProvider } from './cloudProvider';
import { mockTranscriptionProvider } from './mockProvider';
import type { ProviderListOptions, TranscriptionProvider } from './types';

const providers = new Map<string, TranscriptionProvider>();

export function registerTranscriptionProvider(provider: TranscriptionProvider) {
  providers.set(provider.id, provider);
}

export function getTranscriptionProvider(id: string) {
  return providers.get(id);
}

export async function listTranscriptionProviders(options: ProviderListOptions = {}) {
  const includeUnavailable = options.includeUnavailable ?? true;
  const allProviders = [...providers.values()];
  if (includeUnavailable) return allProviders;

  const availability = await Promise.all(
    allProviders.map(async (provider) => {
      try {
        return (await provider.isAvailable()) ? provider : undefined;
      } catch {
        return undefined;
      }
    }),
  );
  return availability.filter((provider): provider is TranscriptionProvider => Boolean(provider));
}

registerTranscriptionProvider(mockTranscriptionProvider);
registerTranscriptionProvider(createCloudTranscriptionProvider());

export { createCloudTranscriptionProvider } from './cloudProvider';
export { mockTranscriptionProvider } from './mockProvider';
export type { TranscriptionInput, TranscriptionProvider } from './types';
