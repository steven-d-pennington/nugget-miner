import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeScreen } from './HomeScreen';

const push = vi.fn();
const saveText = vi.fn();
const listRecent = vi.fn();

vi.mock('@/lib/repositories', () => ({
  captureRepository: {
    listRecent: (...args: unknown[]) => listRecent(...args),
  },
  settingsRepository: { get: vi.fn(async () => ({ automaticProcessing: false })) },
}));

vi.mock('@/lib/services/CaptureService', () => ({
  CaptureService: { saveRecording: vi.fn(), saveText: (...args: unknown[]) => saveText(...args) },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  push.mockReset();
  saveText.mockReset();
  listRecent.mockReset();
  saveText.mockResolvedValue({ capture: { id: 'text-capture-1' } });
  listRecent.mockResolvedValue([]);
});

describe('HomeScreen', () => {
  it('describes local storage and cloud processing accurately', async () => {
    render(<HomeScreen />);

    expect(await screen.findByRole('button', { name: 'Record' })).toBeInTheDocument();
    expect(screen.getByText('Local storage')).toBeInTheDocument();
    expect(screen.getByText(/when you choose cloud processing/i)).toBeInTheDocument();
    expect(screen.queryByText('Local-only')).not.toBeInTheDocument();
    expect(screen.queryByText(/everything stays on your device/i)).not.toBeInTheDocument();
  });

  it('routes a saved typed ramble through the capture compatibility URL', async () => {
    render(<HomeScreen />);

    await waitFor(() => expect(listRecent).toHaveBeenCalledTimes(1));
    listRecent.mockRejectedValueOnce(new Error('Recent captures could not refresh.'));

    fireEvent.click(screen.getByRole('button', { name: 'Paste a ramble' }));
    fireEvent.change(screen.getByLabelText('Ramble text'), {
      target: { value: 'Plan a neighborhood tool-sharing library.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save and organize' }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/idea/text-capture-1'));
    expect(listRecent).toHaveBeenCalledTimes(1);
  });
});
