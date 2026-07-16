import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HomeScreen } from './HomeScreen';

vi.mock('@/lib/repositories', () => ({
  captureRepository: {
    listRecent: vi.fn(async () => []),
  },
  settingsRepository: { get: vi.fn(async () => ({ automaticProcessing: false })) },
}));

vi.mock('@/lib/services/CaptureService', () => ({
  CaptureService: { saveRecording: vi.fn() },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('HomeScreen', () => {
  it('describes local storage and cloud processing accurately', async () => {
    render(<HomeScreen />);

    expect(await screen.findByRole('button', { name: 'Record' })).toBeInTheDocument();
    expect(screen.getByText('Local storage')).toBeInTheDocument();
    expect(screen.getByText(/when you choose cloud processing/i)).toBeInTheDocument();
    expect(screen.queryByText('Local-only')).not.toBeInTheDocument();
    expect(screen.queryByText(/everything stays on your device/i)).not.toBeInTheDocument();
  });
});
