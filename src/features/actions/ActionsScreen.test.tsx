import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ActionItem, Category, Idea } from '@/types';
import { ActionsScreen } from './ActionsScreen';

const listByStatus = vi.fn();
const setStatus = vi.fn();
const updateText = vi.fn();
const remove = vi.fn();
const listIdeas = vi.fn();
const listCategories = vi.fn();

vi.mock('@/lib/repositories', () => ({
  actionItemRepository: {
    listByStatus: (...args: unknown[]) => listByStatus(...args),
    setStatus: (...args: unknown[]) => setStatus(...args),
    updateText: (...args: unknown[]) => updateText(...args),
    remove: (...args: unknown[]) => remove(...args),
  },
  ideaRepository: { listConfirmed: (...args: unknown[]) => listIdeas(...args) },
  categoryRepository: { list: (...args: unknown[]) => listCategories(...args) },
}));

const category: Category = {
  id: 'personal',
  name: 'Personal',
  normalizedName: 'personal',
  description: 'Personal projects, home improvements, and individual learning.',
  isDefault: true,
  isFallback: false,
  sortOrder: 30,
  createdAt: 1,
  updatedAt: 1,
};

const idea: Idea = {
  id: 'idea-1',
  captureSessionId: 'capture-1',
  status: 'confirmed',
  title: 'Create a neighborhood tool-sharing library',
  summary: { id: 'summary-1', text: 'Share rarely used tools.', basis: 'inferred', sourceSpanIds: [] },
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
  confirmedAt: 1,
};

const openOlder: ActionItem = {
  id: 'open-older', ideaId: idea.id, text: 'Ask two neighbors', status: 'open', createdAt: 100, updatedAt: 900,
};
const openNewer: ActionItem = {
  id: 'open-newer', ideaId: idea.id, text: 'Draft the survey', status: 'open', createdAt: 200, updatedAt: 200,
};
const completedOlder: ActionItem = {
  id: 'done-older', ideaId: idea.id, text: 'List the available tools', status: 'completed', createdAt: 400, updatedAt: 500, completedAt: 500,
};
const completedNewer: ActionItem = {
  id: 'done-newer', ideaId: idea.id, text: 'Choose a pilot block', status: 'completed', createdAt: 300, updatedAt: 600, completedAt: 600,
};

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });
  return { promise, reject, resolve };
}

beforeEach(() => {
  vi.clearAllMocks();
  listByStatus.mockImplementation(async (status: string) => status === 'open' ? [openOlder, openNewer] : [completedOlder, completedNewer]);
  listIdeas.mockResolvedValue([idea]);
  listCategories.mockResolvedValue([category]);
  setStatus.mockResolvedValue(undefined);
  updateText.mockResolvedValue(undefined);
  remove.mockResolvedValue(undefined);
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

describe('ActionsScreen', () => {
  it('loads source context and sorts each status section by its required timestamp', async () => {
    render(<ActionsScreen />);

    const openList = await screen.findByRole('list', { name: 'Open actions' });
    const openItems = within(openList).getAllByRole('listitem');
    expect(openItems[0]).toHaveTextContent(openNewer.text);
    expect(openItems[1]).toHaveTextContent(openOlder.text);

    const completedList = screen.getByRole('list', { name: 'Completed actions' });
    const completedItems = within(completedList).getAllByRole('listitem');
    expect(completedItems[0]).toHaveTextContent(completedNewer.text);
    expect(completedItems[1]).toHaveTextContent(completedOlder.text);
    expect(screen.getAllByText(category.name).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: idea.title })[0]).toHaveAttribute('href', `/ideas/${idea.id}`);
    expect(listIdeas).toHaveBeenCalledWith(true);
  });

  it('keeps status unchanged and prevents repeat interaction until persistence succeeds', async () => {
    const pending = deferred<void>();
    setStatus.mockReturnValueOnce(pending.promise);
    render(<ActionsScreen />);
    const complete = await screen.findByRole('checkbox', { name: `Mark ${openNewer.text} completed` });

    fireEvent.click(complete);
    expect(setStatus).toHaveBeenCalledWith(openNewer.id, 'completed');
    expect(complete).not.toBeChecked();
    expect(complete).toBeDisabled();
    complete.click();
    expect(setStatus).toHaveBeenCalledTimes(1);

    await act(async () => pending.resolve());
    expect(await screen.findByRole('checkbox', { name: `Mark ${openNewer.text} open` })).toBeChecked();

    fireEvent.click(screen.getByRole('checkbox', { name: `Mark ${completedNewer.text} open` }));
    await waitFor(() => expect(setStatus).toHaveBeenCalledWith(completedNewer.id, 'open'));
    expect(await screen.findByRole('checkbox', { name: `Mark ${completedNewer.text} completed` })).not.toBeChecked();
  });

  it('keeps the prior status and announces preservation when status persistence fails', async () => {
    const pending = deferred<void>();
    setStatus.mockReturnValueOnce(pending.promise);
    render(<ActionsScreen />);
    const checkbox = await screen.findByRole('checkbox', { name: `Mark ${openOlder.text} completed` });

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(checkbox).toBeDisabled();
    await act(async () => pending.reject(new Error('Local storage unavailable.')));

    expect(await screen.findByRole('alert')).toHaveTextContent('Your previous status was kept. Local storage unavailable.');
    expect(screen.getByRole('checkbox', { name: `Mark ${openOlder.text} completed` })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: `Mark ${openOlder.text} completed` })).toBeEnabled();
  });

  it('edits action text inline and removes only after confirmation', async () => {
    render(<ActionsScreen />);
    const openList = await screen.findByRole('list', { name: 'Open actions' });
    const row = within(openList).getAllByRole('listitem')[0]!;

    fireEvent.click(within(row).getByRole('button', { name: 'Edit action' }));
    const input = within(row).getByLabelText('Action text');
    fireEvent.change(input, { target: { value: '  Draft a one-page interest survey  ' } });
    fireEvent.click(within(row).getByRole('button', { name: 'Save action' }));

    await waitFor(() => expect(updateText).toHaveBeenCalledWith(openNewer.id, 'Draft a one-page interest survey'));
    expect(await within(row).findByText('Draft a one-page interest survey')).toBeInTheDocument();

    fireEvent.click(within(row).getByRole('button', { name: 'Remove action' }));
    expect(window.confirm).toHaveBeenCalledWith('Remove action "Draft a one-page interest survey"?');
    await waitFor(() => expect(remove).toHaveBeenCalledWith(openNewer.id));
    await waitFor(() => expect(screen.queryByText('Draft a one-page interest survey')).not.toBeInTheDocument());
  });

  it('keeps blank edits local and retains an action when removal is canceled', async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    render(<ActionsScreen />);
    const row = within(await screen.findByRole('list', { name: 'Open actions' })).getAllByRole('listitem')[0]!;

    fireEvent.click(within(row).getByRole('button', { name: 'Edit action' }));
    fireEvent.change(within(row).getByLabelText('Action text'), { target: { value: '   ' } });
    fireEvent.click(within(row).getByRole('button', { name: 'Save action' }));
    expect(await within(row).findByRole('alert')).toHaveTextContent('Action text is required.');
    expect(updateText).not.toHaveBeenCalled();

    fireEvent.click(within(row).getByRole('button', { name: 'Cancel' }));
    fireEvent.click(within(row).getByRole('button', { name: 'Remove action' }));
    expect(remove).not.toHaveBeenCalled();
    expect(within(row).getByText(openNewer.text)).toBeInTheDocument();
  });

  it('keeps an action and announces preservation when removal fails', async () => {
    remove.mockRejectedValueOnce(new Error('Delete transaction failed.'));
    render(<ActionsScreen />);
    const row = within(await screen.findByRole('list', { name: 'Open actions' })).getAllByRole('listitem')[0]!;

    fireEvent.click(within(row).getByRole('button', { name: 'Remove action' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Delete transaction failed.');
    expect(within(row).getByText(openNewer.text)).toBeInTheDocument();
  });

  it('shows the truthful empty state and routes to Ideas', async () => {
    listByStatus.mockResolvedValue([]);
    render(<ActionsScreen />);

    expect(await screen.findByRole('heading', { name: 'No actions yet' })).toBeInTheDocument();
    expect(screen.getByText('Accept a suggested next step while reviewing an idea, and it will appear here.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse ideas' })).toHaveAttribute('href', '/ideas');
  });
});
