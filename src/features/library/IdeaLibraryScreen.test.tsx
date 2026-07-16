import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IdeaLibraryRow as LibraryRow } from '@/lib/services/LibraryService';
import type { CaptureSession, Category, Idea, Tag } from '@/types';
import { IdeaLibraryScreen } from './IdeaLibraryScreen';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
  search: vi.fn(),
  ensureDefaults: vi.fn(),
  listTags: vi.fn(),
  listReviewReadyOldestFirst: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
  useSearchParams: () => mocks.searchParams,
}));

vi.mock('@/lib/services/LibraryService', () => ({
  LibraryService: { search: (...args: unknown[]) => mocks.search(...args) },
}));

vi.mock('@/lib/repositories', () => ({
  categoryRepository: { ensureDefaults: () => mocks.ensureDefaults() },
  tagRepository: { list: () => mocks.listTags() },
  captureRepository: { listReviewReadyOldestFirst: () => mocks.listReviewReadyOldestFirst() },
}));

const personal: Category = {
  id: 'personal',
  name: 'Personal',
  normalizedName: 'personal',
  description: 'Personal projects and interests outside of work.',
  isDefault: true,
  isFallback: false,
  sortOrder: 10,
  createdAt: 1,
  updatedAt: 1,
};

const work: Category = { ...personal, id: 'work', name: 'Work', normalizedName: 'work', sortOrder: 20 };
const community: Tag = { id: 'community', name: 'Community', normalizedName: 'community', createdAt: 1 };
const planning: Tag = { id: 'planning', name: 'Planning', normalizedName: 'planning', createdAt: 2 };

function idea(id: string, title: string, overrides: Partial<Idea> = {}): Idea {
  return {
    id,
    captureSessionId: `capture-${id}`,
    status: 'confirmed',
    title,
    summary: { id: `${id}-summary`, text: `${title} summary`, basis: 'inferred', sourceSpanIds: [] },
    goals: [],
    blockers: [],
    questions: [],
    suggestedActions: [],
    research: { needed: false, suggestedQueries: [], suggestedResourceTypes: [] },
    categoryId: personal.id,
    tagIds: [],
    sourceSpans: [],
    createdAt: 1,
    updatedAt: Date.UTC(2026, 6, 15),
    confirmedAt: 1,
    ...overrides,
  };
}

const rows: LibraryRow[] = [
  {
    idea: idea('tool-library', 'Neighborhood tool library', {
      blockers: [{ id: 'blocker', text: 'Find storage.', basis: 'explicit', sourceSpanIds: [] }],
      research: { needed: true, suggestedQueries: [], suggestedResourceTypes: [] },
      tagIds: [community.id, planning.id],
    }),
    category: personal,
    tags: [community, planning],
    openActionCount: 2,
    hasBlockers: true,
    needsResearch: true,
  },
  {
    idea: idea('meeting-notes', 'Meeting notes workflow', { categoryId: work.id, tagIds: [planning.id] }),
    category: work,
    tags: [planning],
    openActionCount: 0,
    hasBlockers: false,
    needsResearch: false,
  },
];

function capture(id: string, createdAt: number): CaptureSession {
  return {
    id,
    source: 'audio',
    processingState: 'ready_for_review',
    processingPreference: 'automatic',
    processingAttempt: 0,
    durationMs: 1,
    createdAt,
    updatedAt: createdAt,
  };
}

function filteredRows(input: { query?: string; categoryId?: string; tagIds?: string[] }) {
  const query = input.query?.toLocaleLowerCase().trim();
  return rows.filter((row) =>
    (!query || `${row.idea.title} ${row.idea.summary.text} ${row.tags.map((tag) => tag.name).join(' ')}`.toLocaleLowerCase().includes(query))
    && (!input.categoryId || row.idea.categoryId === input.categoryId)
    && (input.tagIds ?? []).every((tagId) => row.idea.tagIds.includes(tagId)),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.searchParams = new URLSearchParams();
  mocks.ensureDefaults.mockResolvedValue([personal, work]);
  mocks.listTags.mockResolvedValue([community, planning]);
  mocks.listReviewReadyOldestFirst.mockResolvedValue([]);
  mocks.search.mockImplementation(async (input) => filteredRows(input));
});

describe('IdeaLibraryScreen', () => {
  it('renders the rows returned by LibraryService and exposes every indicator as text', async () => {
    render(<IdeaLibraryScreen />);

    expect(await screen.findByRole('link', { name: /Neighborhood tool library/ })).toHaveAttribute(
      'href',
      '/ideas/tool-library',
    );
    expect(mocks.search).toHaveBeenCalledWith({
      query: undefined,
      categoryId: undefined,
      tagIds: [],
      includeArchived: false,
    });
    expect(screen.getByText('Blocked')).toBeInTheDocument();
    expect(screen.getByText('Research')).toBeInTheDocument();
    expect(screen.getByText('2 open actions')).toBeInTheDocument();
  });

  it('visibly labels demo idea rows as Sample', async () => {
    mocks.search.mockResolvedValue([{ ...rows[0]!, idea: { ...rows[0]!.idea, id: 'demo-idea-tool-sharing' } }]);
    render(<IdeaLibraryScreen />);

    expect(await screen.findByText('Sample')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Neighborhood tool library/ })).toHaveAttribute('href', '/ideas/demo-idea-tool-sharing');
  });

  it('changes query results only after the 150 ms debounce', async () => {
    vi.useFakeTimers();
    try {
      render(<IdeaLibraryScreen />);
      await act(async () => { await Promise.resolve(); });

      fireEvent.change(screen.getByRole('searchbox', { name: 'Search ideas' }), {
        target: { value: 'meeting' },
      });

      await act(async () => { await vi.advanceTimersByTimeAsync(149); });
      expect(mocks.search).not.toHaveBeenCalledWith(expect.objectContaining({ query: 'meeting' }));

      await act(async () => { await vi.advanceTimersByTimeAsync(1); });
      expect(mocks.search).toHaveBeenLastCalledWith(expect.objectContaining({ query: 'meeting' }));
      expect(screen.getByRole('link', { name: /Meeting notes workflow/ })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /Neighborhood tool library/ })).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('synchronizes controls from changed search params without replacing the URL back', async () => {
    const view = render(<IdeaLibraryScreen />);
    await screen.findByText('2 ideas');
    expect(mocks.replace).not.toHaveBeenCalled();

    mocks.searchParams = new URLSearchParams('q=meeting&category=work&tags=planning&archived=1');
    view.rerender(<IdeaLibraryScreen />);

    expect(screen.getByRole('searchbox', { name: 'Search ideas' })).toHaveValue('meeting');
    expect(screen.getByRole('button', { name: 'Work' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '#Planning' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('checkbox', { name: 'Include archived ideas' })).toBeChecked();
    await waitFor(() => expect(mocks.search).toHaveBeenLastCalledWith({
      query: 'meeting',
      categoryId: 'work',
      tagIds: ['planning'],
      includeArchived: true,
    }));
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('combines URL-initialized category and tag filters, then clears them', async () => {
    mocks.searchParams = new URLSearchParams('category=personal&tags=community');
    render(<IdeaLibraryScreen />);

    expect(await screen.findByText('1 idea')).toBeInTheDocument();
    expect(mocks.search).toHaveBeenCalledWith(expect.objectContaining({
      categoryId: 'personal',
      tagIds: ['community'],
    }));

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(await screen.findByText('2 ideas')).toBeInTheDocument();
    expect(mocks.replace).toHaveBeenLastCalledWith('/ideas', { scroll: false });
  });

  it('points an empty library to Capture', async () => {
    mocks.search.mockResolvedValue([]);
    render(<IdeaLibraryScreen />);

    expect(await screen.findByRole('heading', { name: 'Your idea library is empty' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Record your first idea' })).toHaveAttribute('href', '/');
  });

  it('links the review callout to the oldest ready or partially confirmed capture', async () => {
    mocks.listReviewReadyOldestFirst.mockResolvedValue([
      { ...capture('oldest', 100), processingState: 'partially_confirmed' },
      capture('newer', 300),
    ]);
    render(<IdeaLibraryScreen />);

    expect(await screen.findByRole('link', { name: /2 captures ready to review/i })).toHaveAttribute(
      'href',
      '/review/oldest',
    );
  });

  it('ignores a stale search result', async () => {
    let resolveFirst: ((value: LibraryRow[]) => void) | undefined;
    mocks.search
      .mockImplementationOnce(() => new Promise<LibraryRow[]>((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValueOnce([rows[1]])
      .mockResolvedValue([rows[1]]);
    render(<IdeaLibraryScreen />);

    fireEvent.click(await screen.findByRole('button', { name: 'Work' }));
    expect(await screen.findByRole('link', { name: /Meeting notes workflow/ })).toBeInTheDocument();

    await act(async () => resolveFirst?.([rows[0]!]));
    expect(screen.queryByRole('link', { name: /Neighborhood tool library/ })).not.toBeInTheDocument();

  });

  it('refreshes metadata and search with the current filters on focus', async () => {
    mocks.searchParams = new URLSearchParams('q=meeting&category=work&tags=planning');
    render(<IdeaLibraryScreen />);
    await screen.findByText('1 idea');
    vi.clearAllMocks();
    mocks.ensureDefaults.mockResolvedValue([personal, work]);
    mocks.listTags.mockResolvedValue([community, planning]);
    mocks.listReviewReadyOldestFirst.mockResolvedValue([]);
    mocks.search.mockImplementation(async (input) => filteredRows(input));

    fireEvent.focus(window);

    await waitFor(() => expect(mocks.ensureDefaults).toHaveBeenCalledTimes(1));
    expect(mocks.listTags).toHaveBeenCalledTimes(1);
    expect(mocks.listReviewReadyOldestFirst).toHaveBeenCalledTimes(1);
    expect(mocks.search).toHaveBeenCalledWith({
      query: 'meeting',
      categoryId: 'work',
      tagIds: ['planning'],
      includeArchived: false,
    });
  });

  it('keeps metadata failures visible while successful searches remain usable', async () => {
    mocks.ensureDefaults.mockRejectedValue(new Error('Categories unavailable.'));
    render(<IdeaLibraryScreen />);

    expect(await screen.findByRole('link', { name: /Neighborhood tool library/ })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Library organization could not be refreshed');
    expect(screen.getByRole('alert')).toHaveTextContent('Categories unavailable.');

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search ideas' }), { target: { value: 'meeting' } });
    await waitFor(() => expect(mocks.search).toHaveBeenCalledWith(expect.objectContaining({ query: 'meeting' })));
    expect(screen.getByRole('alert')).toHaveTextContent('Categories unavailable.');
  });
});
