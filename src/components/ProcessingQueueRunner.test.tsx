import { render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProcessingQueueRunner } from './ProcessingQueueRunner';

const mocks = vi.hoisted(() => ({
  resumePending: vi.fn(),
}));

vi.mock('@/lib/services/ProcessingService', () => ({
  ProcessingService: { resumePending: (...args: unknown[]) => mocks.resumePending(...args) },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.resumePending.mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
});

afterEach(() => {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
});

describe('ProcessingQueueRunner', () => {
  it('defers persisted work while offline and resumes it when the browser reconnects', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    render(<ProcessingQueueRunner />);

    expect(mocks.resumePending).not.toHaveBeenCalled();

    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    window.dispatchEvent(new Event('online'));

    await waitFor(() => expect(mocks.resumePending).toHaveBeenCalledTimes(1));
  });
});
