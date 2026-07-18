import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exportLocalData } from './exportLocalData';

const mocks = vi.hoisted(() => ({
  buildFullExport: vi.fn(),
  downloadText: vi.fn(),
}));

vi.mock('./fullExport', () => ({
  buildFullExport: (...args: unknown[]) => mocks.buildFullExport(...args),
}));

vi.mock('./download', () => ({
  downloadText: (...args: unknown[]) => mocks.downloadText(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.buildFullExport.mockResolvedValue({
    schemaVersion: 'nugget-full-export-v1',
    exportedAt: '2026-07-18T08:00:00.000Z',
  });
});

describe('exportLocalData', () => {
  it('downloads the full local export through the shared JSON contract', async () => {
    const result = await exportLocalData();

    expect(mocks.downloadText).toHaveBeenCalledWith(
      'nugget-full-export-2026-07-18.json',
      expect.stringContaining('nugget-full-export-v1'),
      'application/json',
    );
    expect(result).toEqual({
      exportedAt: '2026-07-18T08:00:00.000Z',
      filename: 'nugget-full-export-2026-07-18.json',
    });
  });
});
