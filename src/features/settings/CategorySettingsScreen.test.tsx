import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Category } from '@/types';
import SettingsPage from '@/app/settings/page';
import { CategorySettingsScreen } from './CategorySettingsScreen';

const ensureDefaults = vi.fn();
const countIdeasByCategory = vi.fn();
const create = vi.fn();
const update = vi.fn();
const removeAndReassign = vi.fn();

vi.mock('@/lib/repositories', () => ({
  categoryRepository: {
    ensureDefaults: (...args: unknown[]) => ensureDefaults(...args),
    countIdeasByCategory: (...args: unknown[]) => countIdeasByCategory(...args),
    create: (...args: unknown[]) => create(...args),
    update: (...args: unknown[]) => update(...args),
    removeAndReassign: (...args: unknown[]) => removeAndReassign(...args),
  },
}));

vi.mock('@/components/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const work: Category = {
  id: 'work',
  name: 'Work',
  normalizedName: 'work',
  description: 'Professional projects and paid responsibilities. Excludes formal coursework.',
  isDefault: true,
  isFallback: false,
  sortOrder: 10,
  createdAt: 1,
  updatedAt: 1,
};

const community: Category = {
  id: 'community',
  name: 'Community',
  normalizedName: 'community',
  description: 'Neighborhood projects and volunteering. Excludes private household errands.',
  isDefault: false,
  isFallback: false,
  sortOrder: 20,
  createdAt: 1,
  updatedAt: 1,
};

const misc: Category = {
  id: 'misc',
  name: 'Misc',
  normalizedName: 'misc',
  description: 'Ideas too ambiguous to fit another configured category after comparison.',
  isDefault: true,
  isFallback: true,
  sortOrder: 30,
  createdAt: 1,
  updatedAt: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  ensureDefaults.mockResolvedValue([work, community, misc]);
  countIdeasByCategory.mockResolvedValue(new Map([[work.id, 1], [community.id, 3]]));
  create.mockImplementation(async (input: { name: string; description: string }) => ({
    ...community,
    id: 'new-category',
    normalizedName: input.name.toLowerCase(),
    ...input,
  }));
  update.mockImplementation(async (_id: string, input: { name: string; description: string }) => ({ ...community, ...input }));
  removeAndReassign.mockResolvedValue(undefined);
});

describe('CategorySettingsScreen', () => {
  it('renders every classifier contract, all-status idea counts, and fallback safety text', async () => {
    render(<CategorySettingsScreen />);

    expect(await screen.findByRole('heading', { name: 'Work' })).toBeInTheDocument();
    expect(screen.getByText(work.description)).toBeInTheDocument();
    expect(screen.getByText('1 idea using this category')).toBeInTheDocument();
    expect(screen.getByText('3 ideas using this category')).toBeInTheDocument();
    expect(screen.getAllByText('Default')).toHaveLength(2);
    expect(screen.getByText('Fallback—cannot be deleted')).toBeInTheDocument();

    const miscRow = screen.getByRole('heading', { name: 'Misc' }).closest('li');
    expect(miscRow).not.toBeNull();
    expect(within(miscRow!).queryByRole('button', { name: 'Delete category' })).not.toBeInTheDocument();
    expect(countIdeasByCategory).toHaveBeenCalledTimes(1);
  });

  it('creates a category with guidance, live limits, and local short-description validation', async () => {
    render(<CategorySettingsScreen />);
    fireEvent.click(await screen.findByRole('button', { name: 'Add category' }));

    expect(screen.getByText(/Include examples that belong here and boundaries/)).toHaveTextContent('Nugget sends this description to GPT-5.6 during classification.');
    const name = screen.getByLabelText('Name');
    const description = screen.getByLabelText('Description');
    expect(name).toHaveAttribute('maxlength', '40');
    expect(description).toHaveAttribute('maxlength', '800');

    fireEvent.change(name, { target: { value: 'Side projects' } });
    fireEvent.change(description, { target: { value: 'Too short' } });
    expect(screen.getByText('9/800')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save category' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Category description must be at least 20 characters.');
    expect(create).not.toHaveBeenCalled();

    fireEvent.change(description, { target: { value: 'Independent experiments outside paid work and formal coursework.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save category' }));
    await waitFor(() => expect(create).toHaveBeenCalledWith({
      name: 'Side projects',
      description: 'Independent experiments outside paid work and formal coursework.',
    }));
    expect(await screen.findByText('Side projects category added.')).toBeInTheDocument();
  });

  it('shows normalized duplicate repository errors and persists category edits', async () => {
    create.mockRejectedValueOnce(new Error('Category name already exists.'));
    render(<CategorySettingsScreen />);
    fireEvent.click(await screen.findByRole('button', { name: 'Add category' }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: ' work ' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Duplicate name with otherwise valid category guidance.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save category' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Category name already exists.');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    const communityRow = screen.getByRole('heading', { name: 'Community' }).closest('li');
    fireEvent.click(within(communityRow!).getByRole('button', { name: 'Edit category' }));
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Neighborhood projects, mutual aid, and volunteering. Excludes personal errands.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save category' }));

    await waitFor(() => expect(update).toHaveBeenCalledWith(community.id, {
      name: community.name,
      description: 'Neighborhood projects, mutual aid, and volunteering. Excludes personal errands.',
    }));
    expect(await screen.findByText('Community category updated.')).toBeInTheDocument();
  });

  it('surfaces canonical repository limit errors without dismissing the editor', async () => {
    create.mockRejectedValueOnce(new Error('Category name must be 40 characters or fewer.'));
    render(<CategorySettingsScreen />);
    fireEvent.click(await screen.findByRole('button', { name: 'Add category' }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Valid local name' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'A valid description with examples and clear category boundaries.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save category' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Category name must be 40 characters or fewer.');
    expect(screen.getByRole('heading', { name: 'Add category' })).toBeInTheDocument();
  });

  it('defaults deletion replacement to Misc and announces the complete reassignment', async () => {
    render(<CategorySettingsScreen />);
    const communityRow = (await screen.findByRole('heading', { name: 'Community' })).closest('li');
    fireEvent.click(within(communityRow!).getByRole('button', { name: 'Delete category' }));

    const dialog = screen.getByRole('dialog', { name: 'Delete Community?' });
    expect(within(dialog).getByText('3 ideas use this category. Choose where those ideas should move before deletion.')).toBeInTheDocument();
    const replacement = within(dialog).getByLabelText('Replacement category');
    expect(replacement).toHaveValue(misc.id);
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();

    fireEvent.change(replacement, { target: { value: '' } });
    expect(within(dialog).getByRole('button', { name: 'Reassign and delete' })).toBeDisabled();
    fireEvent.change(replacement, { target: { value: misc.id } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reassign and delete' }));
    await waitFor(() => expect(removeAndReassign).toHaveBeenCalledWith(community.id, misc.id));
    expect(await screen.findByText('Reassigned 3 ideas to Misc and deleted Community.')).toBeInTheDocument();
  });

  it('isolates the background, traps focus, closes on Escape, and restores the exact trigger', async () => {
    const { container } = render(<CategorySettingsScreen />);
    const communityRow = (await screen.findByRole('heading', { name: 'Community' })).closest('li');
    const trigger = within(communityRow!).getByRole('button', { name: 'Delete category' });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog', { name: 'Delete Community?' });
    const backgroundContent = screen.getByTestId('category-settings-content');
    expect(backgroundContent).toHaveAttribute('inert');
    expect(backgroundContent).toHaveAttribute('aria-hidden', 'true');
    expect(container).toHaveAttribute('inert');
    expect(container).toHaveAttribute('aria-hidden', 'true');

    const replacement = within(dialog).getByLabelText('Replacement category');
    const deleteButton = within(dialog).getByRole('button', { name: 'Reassign and delete' });
    deleteButton.focus();
    fireEvent.keyDown(deleteButton, { key: 'Tab' });
    expect(replacement).toHaveFocus();
    fireEvent.keyDown(replacement, { key: 'Tab', shiftKey: true });
    expect(deleteButton).toHaveFocus();

    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Delete Community?' })).not.toBeInTheDocument());
    expect(container).not.toHaveAttribute('inert');
    expect(container).not.toHaveAttribute('aria-hidden');
    expect(trigger).toHaveFocus();
  });

  it('keeps replacement focus and dialog state while the selection changes', async () => {
    render(<CategorySettingsScreen />);
    const communityRow = (await screen.findByRole('heading', { name: 'Community' })).closest('li');
    fireEvent.click(within(communityRow!).getByRole('button', { name: 'Delete category' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete Community?' });
    const replacement = within(dialog).getByLabelText('Replacement category');

    replacement.focus();
    fireEvent.change(replacement, { target: { value: work.id } });
    expect(replacement).toHaveValue(work.id);
    expect(replacement).toHaveFocus();
    fireEvent.change(replacement, { target: { value: misc.id } });
    expect(replacement).toHaveValue(misc.id);
    expect(replacement).toHaveFocus();
    expect(within(dialog).getByRole('button', { name: 'Reassign and delete' })).toBeEnabled();
  });
});

describe('SettingsPage', () => {
  it('organizes settings and links to category management', () => {
    render(<SettingsPage />);

    expect(screen.getByRole('heading', { name: 'Category organization' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Processing and privacy' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Data export' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'About' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Manage categories' })).toHaveAttribute('href', '/settings/categories');
  });
});
