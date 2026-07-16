import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Category, Idea } from '@/types';
import { ConfirmedIdeasPreview } from './ConfirmedIdeasPreview';

const mocks = vi.hoisted(() => ({
  listConfirmed: vi.fn(),
  ensureDefaults: vi.fn(),
  listRecent: vi.fn(),
}));

vi.mock('@/lib/repositories', () => ({
  ideaRepository: { listConfirmed: (...args: unknown[]) => mocks.listConfirmed(...args) },
  categoryRepository: { ensureDefaults: (...args: unknown[]) => mocks.ensureDefaults(...args) },
  captureRepository: { listRecent: (...args: unknown[]) => mocks.listRecent(...args) },
}));

const category: Category = {
  id: 'category-personal',
  name: 'Personal',
  normalizedName: 'personal',
  description: 'Personal projects, hobbies, and other interests outside of work.',
  isDefault: true,
  isFallback: false,
  sortOrder: 30,
  createdAt: 1,
  updatedAt: 1,
};

function confirmedIdea(id: string, captureSessionId: string, title: string): Idea {
  return {
    id,
    captureSessionId,
    status: 'confirmed',
    title,
    summary: { id: `${id}-summary`, text: `${title} summary`, basis: 'inferred', sourceSpanIds: [] },
    goals: [],
    blockers: [],
    questions: [],
    suggestedActions: [],
    research: { needed: false, suggestedQueries: [], suggestedResourceTypes: [] },
    categoryId: category.id,
    tagIds: [],
    sourceSpans: [],
    createdAt: 1,
    updatedAt: 1,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.ensureDefaults.mockResolvedValue([category]);
  mocks.listConfirmed.mockResolvedValue([
    confirmedIdea('idea-1', 'capture-1', 'First independent idea'),
    confirmedIdea('idea-2', 'capture-2', 'Second independent idea'),
  ]);
  mocks.listRecent.mockResolvedValue([
    { id: 'capture-ready', source: 'audio', processingState: 'ready_for_review' },
    { id: 'capture-partial', source: 'text', processingState: 'partially_confirmed' },
    { id: 'capture-saved', source: 'audio', processingState: 'saved' },
  ]);
});

describe('ConfirmedIdeasPreview', () => {
  it('renders independent confirmed records with category, summary, and source links', async () => {
    render(<ConfirmedIdeasPreview />);

    expect(await screen.findByRole('heading', { name: 'First independent idea' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Second independent idea' })).toBeInTheDocument();
    expect(screen.getAllByText('Personal')).toHaveLength(2);
    expect(screen.getByText('First independent idea summary')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'View source capture' })[0]).toHaveAttribute(
      'href',
      '/capture/capture-1?stay=1',
    );
  });

  it('makes every ready and partially-confirmed capture reachable from Ideas', async () => {
    render(<ConfirmedIdeasPreview />);

    expect(await screen.findByRole('heading', { name: 'Ready to review' })).toBeInTheDocument();
    const reviewLinks = screen.getAllByRole('link', { name: /Review ideas/ });
    expect(reviewLinks).toHaveLength(2);
    expect(reviewLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/review/capture-ready',
      '/review/capture-partial',
    ]);
  });
});
