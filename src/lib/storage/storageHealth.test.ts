import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestPersistentStorage, storageHealth } from './storageHealth';

const originalStorage = Object.getOwnPropertyDescriptor(navigator, 'storage');

function setStorage(storage: Partial<StorageManager> | undefined) {
  Object.defineProperty(navigator, 'storage', {
    configurable: true,
    value: storage,
  });
}

afterEach(() => {
  if (originalStorage) Object.defineProperty(navigator, 'storage', originalStorage);
  else Reflect.deleteProperty(navigator, 'storage');
});

describe('storageHealth', () => {
  it('returns available estimate and persistence status without requesting persistence', async () => {
    const estimate = vi.fn().mockResolvedValue({ usage: 250, quota: 1_000 });
    const persisted = vi.fn().mockResolvedValue(true);
    const persist = vi.fn().mockResolvedValue(true);
    setStorage({ estimate, persisted, persist });

    await expect(storageHealth()).resolves.toEqual({
      usage: 250,
      quota: 1_000,
      persisted: true,
      usageRatio: 0.25,
    });

    expect(persist).not.toHaveBeenCalled();
  });

  it('reports an unsupported storage manager without failing', async () => {
    setStorage(undefined);

    await expect(storageHealth()).resolves.toEqual({
      usage: undefined,
      quota: undefined,
      persisted: false,
      usageRatio: undefined,
    });
  });

  it('requests persistent storage only when explicitly invoked', async () => {
    const persist = vi.fn().mockResolvedValue(true);
    setStorage({ persist });

    await expect(requestPersistentStorage()).resolves.toBe(true);
    expect(persist).toHaveBeenCalledTimes(1);
  });
});
