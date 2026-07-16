import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CanonicalReviewSnapshot } from '@/lib/services/ReviewService';
import type { Category, GroundedText, Idea, Tag } from '@/types';
import { ReviewScreen } from './ReviewScreen';

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  confirm: vi.fn(),
  discard: vi.fn(),
  reprocess: vi.fn(),
  listTags: vi.fn(),
  findOrCreateTags: vi.fn(),
}));

vi.mock('@/components/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

vi.mock('@/lib/services/ReviewService', () => ({
  ReviewService: {
    load: (...args: unknown[]) => mocks.load(...args),
    confirm: (...args: unknown[]) => mocks.confirm(...args),
    discard: (...args: unknown[]) => mocks.discard(...args),
    reprocess: (...args: unknown[]) => mocks.reprocess(...args),
  },
}));

vi.mock('@/lib/repositories', () => ({
  tagRepository: {
    list: (...args: unknown[]) => mocks.listTags(...args),
    findOrCreate: (...args: unknown[]) => mocks.findOrCreateTags(...args),
  },
}));

const category: Category = {
  id: 'category-personal',
  name: 'Personal',
  normalizedName: 'personal',
  description: 'Personal projects, interests, errands, and ideas outside of work.',
  isDefault: true,
  isFallback: false,
  sortOrder: 30,
  createdAt: 1,
  updatedAt: 1,
};

const communityTag: Tag = {
  id: 'tag-community',
  name: 'community',
  normalizedName: 'community',
  createdAt: 1,
};

function grounded(id: string, text: string, basis: GroundedText['basis'] = 'inferred'): GroundedText {
  return { id, text, basis, sourceSpanIds: [] };
}

function idea(index: number): Idea {
  return {
    id: `idea-${index}`,
    captureSessionId: 'capture-1',
    extractionRunId: 'run-1',
    status: 'draft',
    title: `Idea ${index}`,
    summary: grounded(`summary-${index}`, `Summary ${index}`),
    goals: [],
    blockers: [],
    questions: [],
    suggestedActions: [grounded(`action-${index}`, `Action ${index}`, 'suggested')],
    research: { needed: false, suggestedQueries: [], suggestedResourceTypes: [] },
    categoryId: category.id,
    tagIds: [communityTag.id],
    sourceSpans: [],
    createdAt: index,
    updatedAt: index,
  };
}

function snapshot(overrides: Partial<CanonicalReviewSnapshot> = {}): CanonicalReviewSnapshot {
  return {
    capture: {
      id: 'capture-1',
      source: 'text',
      processingState: 'ready_for_review',
      processingPreference: 'manual',
      processingAttempt: 0,
      durationMs: 0,
      createdAt: 1,
      updatedAt: 1,
    },
    transcript: {
      id: 'transcript-1',
      captureSessionId: 'capture-1',
      version: 1,
      text: 'Three separate ideas in one untrusted transcript.',
      provider: 'typed',
      source: 'typed',
      contentHash: 'hash-1',
      createdAt: 1,
      updatedAt: 1,
    },
    ideas: [idea(1), idea(2), idea(3)],
    categories: [category],
    tags: [communityTag],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.load.mockResolvedValue(snapshot());
  mocks.listTags.mockResolvedValue([communityTag]);
  mocks.findOrCreateTags.mockImplementation(async (names: string[]) =>
    names.map((name, index) => ({
      id: name.trim().toLocaleLowerCase().replace(/\s+/g, '-') || `tag-${index}`,
      name: name.trim().replace(/\s+/g, ' '),
      normalizedName: name.trim().toLocaleLowerCase().replace(/\s+/g, ' '),
      createdAt: 1,
    })),
  );
  mocks.confirm.mockResolvedValue(undefined);
  mocks.discard.mockResolvedValue(undefined);
  mocks.reprocess.mockResolvedValue(undefined);
});

describe('ReviewScreen multi-idea confirmation', () => {
  it('renders the exact three-candidate heading, position, and source URL', async () => {
    render(<ReviewScreen captureId="capture-1" />);

    expect(await screen.findByRole('heading', { name: '3 ideas found' })).toBeInTheDocument();
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View source capture' })).toHaveAttribute(
      'href',
      '/capture/capture-1?stay=1',
    );
  });

  it('preserves independent edits while switching candidates', async () => {
    render(<ReviewScreen captureId="capture-1" />);
    const title = await screen.findByLabelText('Title');
    fireEvent.change(title, { target: { value: 'Edited first idea' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next idea' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Edited second idea' } });
    fireEvent.click(screen.getByRole('button', { name: 'Previous idea' }));

    expect(screen.getByLabelText('Title')).toHaveValue('Edited first idea');
    fireEvent.click(screen.getByRole('button', { name: 'Next idea' }));
    expect(screen.getByLabelText('Title')).toHaveValue('Edited second idea');
  });

  it('normalizes tags, retains original accepted action IDs, and confirms one then all as distinct ideas', async () => {
    render(<ReviewScreen captureId="capture-1" />);
    await screen.findByRole('heading', { name: '3 ideas found' });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Add to Actions when confirmed' }));
    fireEvent.change(screen.getByLabelText('Tags'), { target: { value: '  Weekend   Build  ' } });
    fireEvent.keyDown(screen.getByLabelText('Tags'), { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(mocks.confirm).toHaveBeenCalledTimes(1));
    expect(mocks.findOrCreateTags).toHaveBeenCalledWith(['community', 'Weekend Build']);
    expect(mocks.confirm).toHaveBeenNthCalledWith(
      1,
      'idea-1',
      expect.objectContaining({ tagIds: ['community', 'weekend-build'] }),
      ['action-1'],
    );
    expect(await screen.findByRole('button', { name: 'Confirm all ready ideas (2)' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm all ready ideas (2)' }));

    await waitFor(() => expect(mocks.confirm).toHaveBeenCalledTimes(3));
    expect(mocks.confirm.mock.calls.map((call) => call[0])).toEqual(['idea-1', 'idea-2', 'idea-3']);
    expect(await screen.findByRole('heading', { name: 'All ideas reviewed' })).toBeInTheDocument();
  });

  it('stops confirm-all at the first failure, preserves the failed edit, and retries the remainder in order', async () => {
    mocks.confirm
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('quota write failed'))
      .mockResolvedValue(undefined);
    render(<ReviewScreen captureId="capture-1" />);
    await screen.findByRole('heading', { name: '3 ideas found' });
    fireEvent.click(screen.getByRole('button', { name: 'Next idea' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Edited second idea' } });
    fireEvent.click(screen.getByRole('button', { name: 'Previous idea' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm all ready ideas (3)' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This device is low on storage',
    );
    expect(screen.getByRole('alert')).not.toHaveTextContent('quota write failed');
    expect(mocks.confirm).toHaveBeenCalledTimes(2);
    expect(screen.getByLabelText('Title')).toHaveValue('Edited second idea');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(mocks.confirm).toHaveBeenCalledTimes(4));
    expect(mocks.confirm.mock.calls.slice(2).map((call) => call[0])).toEqual(['idea-2', 'idea-3']);
    expect(mocks.confirm.mock.calls[2]?.[1]).toEqual(
      expect.objectContaining({ title: 'Edited second idea' }),
    );
    expect(await screen.findByRole('heading', { name: 'All ideas reviewed' })).toBeInTheDocument();
  });

  it('keeps discard failure feedback and retry operable inside the modal without losing edits', async () => {
    mocks.discard.mockRejectedValueOnce(new Error('delete failed')).mockResolvedValueOnce(undefined);
    render(<ReviewScreen captureId="capture-1" />);
    await screen.findByRole('heading', { name: '3 ideas found' });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Keep this edit' } });
    fireEvent.click(screen.getByRole('button', { name: 'Discard idea' }));
    fireEvent.click(screen.getByRole('button', { name: 'Discard draft idea' }));

    const dialog = screen.getByRole('dialog');
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Something needs attention');
    expect(within(dialog).getByRole('alert')).not.toHaveTextContent('delete failed');
    const retry = within(dialog).getByRole('button', { name: 'Retry discard' });
    expect(retry).toHaveFocus();
    expect(screen.getByLabelText('Title')).toHaveValue('Keep this edit');
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    fireEvent.click(retry);
    await waitFor(() => expect(mocks.discard).toHaveBeenCalledTimes(2));
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
  });

  it('renders a truthful completed state after discarding the last candidate', async () => {
    mocks.load.mockResolvedValue(snapshot({ ideas: [idea(1)] }));
    render(<ReviewScreen captureId="capture-1" />);
    await screen.findByRole('heading', { name: '1 idea found' });
    fireEvent.click(screen.getByRole('button', { name: 'Discard idea' }));
    fireEvent.click(screen.getByRole('button', { name: 'Discard draft idea' }));

    expect(await screen.findByRole('heading', { name: 'All ideas reviewed' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'No clear ideas found' })).not.toBeInTheDocument();
  });

  it('distinguishes zero extraction, completed review, missing capture, transcript, and repository failures', async () => {
    const { unmount } = render(<ReviewScreen captureId="capture-1" />);
    await screen.findByRole('heading', { name: '3 ideas found' });
    unmount();

    mocks.load.mockResolvedValueOnce(snapshot({ ideas: [] }));
    render(<ReviewScreen captureId="capture-1" />);
    expect(await screen.findByRole('heading', { name: 'No clear ideas found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit transcript' })).toHaveAttribute('href', '/capture/capture-1?stay=1');
    expect(screen.getByRole('button', { name: 'Reprocess' })).toBeInTheDocument();
    unmount();

    mocks.load.mockResolvedValueOnce(
      snapshot({ ideas: [], capture: { ...snapshot().capture, processingState: 'confirmed' } }),
    );
    render(<ReviewScreen captureId="capture-1" />);
    expect(await screen.findByRole('heading', { name: 'All ideas reviewed' })).toBeInTheDocument();
    unmount();

    for (const [message, heading] of [
      ['Capture not found.', 'Capture not found'],
      ['A transcript is required before review.', 'Transcript unavailable'],
      ['IndexedDB unavailable', 'Unable to load review'],
    ]) {
      mocks.load.mockRejectedValueOnce(new Error(message));
      render(<ReviewScreen captureId="capture-1" />);
      expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
      unmount();
    }
  });

  it('keeps untrusted transcript content as text when reprocessing fails', async () => {
    const malicious = '<img src=x onerror="not-code"> transcript';
    mocks.load.mockResolvedValueOnce(
      snapshot({ ideas: [], transcript: { ...snapshot().transcript, text: malicious } }),
    );
    mocks.reprocess.mockRejectedValueOnce(new Error('organization failed'));
    const { container } = render(<ReviewScreen captureId="capture-1" />);
    await screen.findByRole('heading', { name: 'No clear ideas found' });
    fireEvent.click(screen.getByRole('button', { name: 'Reprocess' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Something needs attention');
    expect(screen.getByRole('alert')).not.toHaveTextContent('organization failed');
    expect(screen.getByText(malicious)).toBeInTheDocument();
    expect(container.querySelector('.review-empty__transcript img')).toBeNull();
  });
});
