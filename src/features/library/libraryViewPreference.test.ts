import { beforeEach, describe, expect, it } from 'vitest';
import { readLibraryView, writeLibraryView } from './libraryViewPreference';

function installLocalStorage() {
  const values = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      get length() { return values.size; },
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      key: (index: number) => [...values.keys()][index] ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, String(value)),
    } satisfies Storage,
  });
}

describe('library view preference', () => {
  beforeEach(() => {
    installLocalStorage();
    localStorage.clear();
  });

  it('defaults invalid or missing values to cards', () => {
    expect(readLibraryView(localStorage)).toBe('cards');
    localStorage.setItem('nugget:ideas:view', 'tiles');
    expect(readLibraryView(localStorage)).toBe('cards');
  });

  it('round-trips the compact preference locally', () => {
    writeLibraryView('compact', localStorage);
    expect(readLibraryView(localStorage)).toBe('compact');
    expect(localStorage.getItem('nugget:ideas:view')).toBe('compact');
  });

  it('handles an unavailable browser storage getter', () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get: () => { throw new Error('Storage is unavailable.'); },
    });

    expect(readLibraryView()).toBe('cards');
    expect(() => writeLibraryView('compact')).not.toThrow();
  });
});
