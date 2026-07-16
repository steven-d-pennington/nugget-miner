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
  listRecent: vi.fn(),
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
  captureRepository: { listRecent: (...args: unknown[]) => mocks.listRecent(...args) },
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
  mocks.listRecent.mockResolvedValue([]);
  mocks.search.mockImplementation(async (input) => filteredRows(input));
});

describe('IdeaLibraryScreen', () => {
  it('renders confirmed ideas without drafts and exposes every indicator as text', async () => {
    render(<IdeaLibraryScreen />);

    expect(await screen.findByRole('link', { name: /Neighborhood tool library/ })).toHaveAttribute(
      'href',
      '/ideas/tool-library',
    );
    expect(screen.queryByText('Unconfirmed draft')).not.toBeInTheDocument();
    expect(screen.getByText('Blocked')).toBeInTheDocument();
    expect(screen.getByText('Research')).toBeInTheDocument();
    expect(screen.getByText('2 open actions')).toBeInTheDocument();
  });

  it('changes query results only after the 150 ms debounce', async () => {
    render(<IdeaLibraryScreen />);
    await screen.findByText('2 ideas');

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search ideas' }), {
      target: { value: 'meeting' },
    });

    expect(mocks.search).not.toHaveBeenLastCalledWith(expect.objectContaining({ query: 'meeting' }));
    await waitFor(() => expect(mocks.search).toHaveBeenLastCalledWith(expect.objectContaining({ query: 'meeting' })));
    expect(await screen.findByRole('link', { name: /Meeting notes workflow/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Neighborhood tool library/ })).not.toBeInTheDocument();
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
    mocks.listRecent.mockResolvedValue([
      capture('newer', 300),
      { ...capture('oldest', 100), processingState: 'partially_confirmed' },
      { ...capture('ignored', 50), processingState: 'saved' },
    ]);
    render(<IdeaLibraryScreen />);

    expect(await screen.findByRole('link', { name: /2 captures ready to review/i })).toHaveAttribute(
      'href',
      '/review/oldest',
    );
  });

  it('ignores a stale search result and refreshes the current filters on focus', async () => {
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

    const callsBeforeFocus = mocks.search.mock.calls.length;
    fireEvent.focus(window);
    await waitFor(() => expect(mocks.search.mock.calls.length).toBeGreaterThan(callsBeforeFocus));
  });
});
