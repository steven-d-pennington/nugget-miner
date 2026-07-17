import { cloudOrganizationProvider } from './cloudProvider';
import { mockOrganizationProvider } from './mockProvider';
import type { OrganizationProvider } from './types';

const providers = new Map<string, OrganizationProvider>();

export function registerOrganizationProvider(provider: OrganizationProvider) {
  providers.set(provider.id, provider);
}

export function getOrganizationProvider(id = 'mock') {
  return providers.get(id);
}

export function listOrganizationProviders() {
  return [...providers.values()];
}

registerOrganizationProvider(mockOrganizationProvider);
registerOrganizationProvider(cloudOrganizationProvider);

export {
  cloudExtractionProvider,
  cloudOrganizationProvider,
  createCloudExtractionProvider,
  createCloudOrganizationProvider,
} from './cloudProvider';
export {
  mockExtractionProvider,
  mockOrganizationProvider,
} from './mockProvider';
export type {
  OrganizeProviderInput,
  OrganizeProviderOutput,
  OrganizationProvider,
  OrganizationProviderCategory,
  OrganizationProviderDescriptor,
  SegmentProviderInput,
  SegmentProviderOutput,
} from './types';
