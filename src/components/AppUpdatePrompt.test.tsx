import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppUpdatePrompt } from './AppUpdatePrompt';

const mocks = vi.hoisted(() => ({
  applyUpdate: vi.fn(),
  exportLocalData: vi.fn(),
  update: {
    captureLocked: false,
    status: 'ready',
    updateMessage: undefined as string | undefined,
    updateReady: true,
  },
}));

vi.mock('./AppUpdateProvider', () => ({
  useAppUpdate: () => ({ ...mocks.update, applyUpdate: mocks.applyUpdate }),
}));

vi.mock('@/lib/export/exportLocalData', () => ({
  exportLocalData: (...args: unknown[]) => mocks.exportLocalData(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.update.captureLocked = false;
  mocks.update.status = 'ready';
  mocks.update.updateMessage = undefined;
  mocks.update.updateReady = true;
  mocks.exportLocalData.mockResolvedValue({ filename: 'nugget.json' });
});

describe('AppUpdatePrompt', () => {
  it('stays hidden without an update and throughout capture-sensitive work', () => {
    mocks.update.updateReady = false;
    const view = render(<AppUpdatePrompt />);
    expect(screen.queryByRole('region', { name: 'New version ready' })).not.toBeInTheDocument();

    mocks.update.updateReady = true;
    mocks.update.captureLocked = true;
    view.rerender(<AppUpdatePrompt />);
    expect(screen.queryByRole('region', { name: 'New version ready' })).not.toBeInTheDocument();
  });

  it('keeps export optional and activates only after Update now is chosen', async () => {
    render(<AppUpdatePrompt />);

    expect(screen.getByText('Update Nugget when you’re ready. You can export a copy of your local data first.')).toBeInTheDocument();
    expect(mocks.applyUpdate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Export data' }));
    await waitFor(() => expect(mocks.exportLocalData).toHaveBeenCalledTimes(1));
    expect(screen.getByText('Export created. Your data remains in Nugget.')).toBeInTheDocument();
    expect(mocks.applyUpdate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Update now' }));
    expect(mocks.applyUpdate).toHaveBeenCalledTimes(1);
  });

  it('offers an export retry without disabling the update', async () => {
    mocks.exportLocalData.mockRejectedValueOnce(new Error('blocked'));
    render(<AppUpdatePrompt />);

    fireEvent.click(screen.getByRole('button', { name: 'Export data' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The export could not be created');
    expect(screen.getByRole('button', { name: 'Try export again' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Update now' })).toBeEnabled();
  });
});
