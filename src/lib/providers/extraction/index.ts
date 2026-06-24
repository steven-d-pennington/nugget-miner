import { mockExtractionProvider } from './mockProvider';
import type { ExtractionProvider } from './types';

const providers = new Map<string, ExtractionProvider>();

export function registerExtractionProvider(provider: ExtractionProvider) {
  providers.set(provider.id, provider);
}

export function getExtractionProvider(id = 'mock') {
  return providers.get(id);
}

export function listExtractionProviders() {
  return [...providers.values()];
}

registerExtractionProvider(mockExtractionProvider);

export { mockExtractionProvider } from './mockProvider';
export type { ExtractionContext, ExtractionProvider, ExtractionProviderInput } from './types';
