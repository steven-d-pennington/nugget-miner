import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HomeScreen } from './HomeScreen';

vi.mock('@/lib/repositories', () => ({
  ideaRepository: {
    listByRecency: vi.fn(async () => []),
  },
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
