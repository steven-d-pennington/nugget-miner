export interface StorageHealth {
  usage?: number;
  quota?: number;
  persisted: boolean;
  usageRatio?: number;
}

function browserStorage() {
  return typeof navigator === 'undefined' ? undefined : navigator.storage;
}

export async function storageHealth(): Promise<StorageHealth> {
  const storage = browserStorage();
  const estimate = await storage?.estimate?.();
  const persisted = await storage?.persisted?.();
  const usage = estimate?.usage;
  const quota = estimate?.quota;

  return {
    usage,
    quota,
    persisted: persisted ?? false,
    usageRatio: typeof usage === 'number' && typeof quota === 'number' && quota > 0
      ? usage / quota
      : undefined,
  };
}

export async function requestPersistentStorage() {
  const storage = browserStorage();
  return storage?.persist ? storage.persist() : false;
}
