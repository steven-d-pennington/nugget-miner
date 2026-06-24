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
  it('renders local-only record affordance', async () => {
    render(<HomeScreen />);

    expect(await screen.findByRole('button', { name: 'Record' })).toBeInTheDocument();
    expect(screen.getAllByText(/local-only/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Mock transcription runs locally/i)).toBeInTheDocument();
  });
});
