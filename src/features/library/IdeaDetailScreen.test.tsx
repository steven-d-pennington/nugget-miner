import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GroundedText, Idea } from '@/types';
import { IdeaDetailScreen } from './IdeaDetailScreen';

const getIdea = vi.fn();
const updateIdea = vi.fn();
const setArchived = vi.fn();
const listCategories = vi.fn();
const listTags = vi.fn();
const findOrCreateTags = vi.fn();
const listActions = vi.fn();
const getCapture = vi.fn();
const getRecording = vi.fn();
const getTranscript = vi.fn();
const downloadText = vi.fn();

vi.mock('@/lib/repositories', () => ({
  ideaRepository: {
    getById: (...args: unknown[]) => getIdea(...args),
    update: (...args: unknown[]) => updateIdea(...args),
    setArchived: (...args: unknown[]) => setArchived(...args),
  },
  categoryRepository: { list: (...args: unknown[]) => listCategories(...args) },
  tagRepository: {
    list: (...args: unknown[]) => listTags(...args),
    findOrCreate: (...args: unknown[]) => findOrCreateTags(...args),
  },
  actionItemRepository: { listByIdea: (...args: unknown[]) => listActions(...args) },
  captureRepository: { getById: (...args: unknown[]) => getCapture(...args) },
  recordingRepository: { getByCaptureId: (...args: unknown[]) => getRecording(...args) },
  transcriptRepository: { getCurrent: (...args: unknown[]) => getTranscript(...args) },
}));

vi.mock('@/lib/export/download', () => ({
  downloadText: (...args: unknown[]) => downloadText(...args),
  slugifyIdeaFilename: () => 'neighborhood-tool-library',
}));

function grounded(id: string, text: string, basis: GroundedText['basis'] = 'inferred'): GroundedText {
  return { id, text, basis, sourceSpanIds: basis === 'explicit' ? ['span-1'] : [] };
}

const categories = [
  { id: 'personal', name: 'Personal', normalizedName: 'personal', description: 'Personal projects and home ideas.', isDefault: true, isFallback: false, sortOrder: 1, createdAt: 1, updatedAt: 1 },
  { id: 'work', name: 'Work', normalizedName: 'work', description: 'Professional projects and workplace ideas.', isDefault: true, isFallback: false, sortOrder: 2, createdAt: 1, updatedAt: 1 },
];
const tags = [
  { id: 'tag-community', name: 'community', normalizedName: 'community', createdAt: 1 },
  { id: 'tag-sharing', name: 'sharing', normalizedName: 'sharing', createdAt: 2 },
];

const idea: Idea = {
  id: 'idea-1',
  captureSessionId: 'capture-1',
  extractionRunId: 'run-1',
  status: 'confirmed',
  title: 'Create a neighborhood tool-sharing library',
  summary: grounded('summary', 'A simple way for neighbors to lend tools.', 'explicit'),
  purpose: grounded('purpose', 'Reduce duplicate purchases.'),
  goals: [grounded('goal', 'Test with ten households.')],
  problem: { statement: grounded('problem', 'Tools sit unused.'), type: 'Coordination' },
  blockers: [grounded('blocker', 'Need a host.')],
  questions: [grounded('question', 'Who owns maintenance?')],
  suggestedActions: [grounded('suggestion', 'Draft a survey.', 'suggested')],
  research: {
    needed: true,
    assessment: grounded('research', 'Compare lending tools.'),
    suggestedQueries: ['tool library software'],
    suggestedResourceTypes: ['Community case studies'],
  },
  categoryId: 'personal',
  tagIds: ['tag-community'],
  sourceSpans: [{ id: 'span-1', startChar: 0, endChar: 11, quote: 'source idea' }],
  createdAt: 1_752_662_400_000,
  updatedAt: 1_752_666_000_000,
  confirmedAt: 1_752_666_000_000,
};

beforeEach(() => {
  vi.clearAllMocks();
  getIdea.mockResolvedValue({ ...idea });
  listCategories.mockResolvedValue(categories);
  listTags.mockResolvedValue(tags);
  listActions.mockResolvedValue([
    { id: 'action-open', ideaId: idea.id, text: 'Ask two neighbors.', status: 'open', createdAt: 1, updatedAt: 1 },
    { id: 'action-done', ideaId: idea.id, text: 'List available tools.', status: 'completed', createdAt: 1, updatedAt: 2, completedAt: 2 },
  ]);
  getCapture.mockResolvedValue({ id: 'capture-1', source: 'audio', processingState: 'confirmed', processingPreference: 'manual', processingAttempt: 1, durationMs: 12_000, createdAt: 1, updatedAt: 1 });
  getRecording.mockResolvedValue(undefined);
  getTranscript.mockResolvedValue({ id: 'transcript-1', captureSessionId: 'capture-1', version: 1, text: 'The complete source transcript.', provider: 'openai', source: 'transcription', contentHash: 'hash', createdAt: 1, updatedAt: 1 });
  findOrCreateTags.mockResolvedValue(tags);
  updateIdea.mockImplementation(async (_id, input) => ({ ...idea, ...input, updatedAt: idea.updatedAt + 1 }));
  setArchived.mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn(async () => undefined) },
  });
});

describe('IdeaDetailScreen', () => {
  it('renders the complete organized idea, provenance, linked actions, and collapsed source', async () => {
    render(<IdeaDetailScreen ideaId="idea-1" />);

    expect(await screen.findByDisplayValue(idea.title)).toBeInTheDocument();
    expect(screen.getByLabelText('Summary')).toHaveValue(idea.summary.text);
    expect(screen.getByLabelText('Purpose')).toHaveValue(idea.purpose?.text);
    expect(screen.getByLabelText('Goal 1')).toHaveValue('Test with ten households.');
    expect(screen.getByLabelText('Problem statement')).toHaveValue('Tools sit unused.');
    expect(screen.getByLabelText('Blocker 1')).toHaveValue('Need a host.');
    expect(screen.getByLabelText('Question 1')).toHaveValue('Who owns maintenance?');
    expect(screen.getByLabelText('Research assessment')).toHaveValue('Compare lending tools.');
    expect(screen.getByLabelText('Suggested action 1')).toHaveValue('Draft a survey.');
    expect(screen.getByText('Explicit')).toBeInTheDocument();
    expect(screen.getByText('Ask two neighbors.')).toBeInTheDocument();
    expect(screen.getByText('List available tools.')).toHaveClass('line-through');
    expect(screen.getByRole('link', { name: 'Open Actions' })).toHaveAttribute('href', '/actions');

    const source = screen.getByText('Source recording').closest('details');
    expect(source).not.toHaveAttribute('open');
    expect(within(source!).getByText('The complete source transcript.')).toBeInTheDocument();
  });

  it('persists title, category, and tag edits through the canonical repository update', async () => {
    render(<IdeaDetailScreen ideaId="idea-1" />);
    fireEvent.change(await screen.findByLabelText('Title'), { target: { value: 'Neighborhood lending pilot' } });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'work' } });
    fireEvent.click(screen.getByRole('button', { name: '+ sharing' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(findOrCreateTags).toHaveBeenCalledWith(['community', 'sharing']));
    expect(updateIdea).toHaveBeenCalledWith(
      'idea-1',
      expect.objectContaining({
        title: 'Neighborhood lending pilot',
        categoryId: 'work',
        tagIds: ['tag-community', 'tag-sharing'],
        status: 'confirmed',
      }),
    );
    expect(await screen.findByText('Changes saved on this device.')).toBeInTheDocument();
  });

  it('requires confirmation before archiving an idea with open actions', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(<IdeaDetailScreen ideaId="idea-1" />);

    const archive = await screen.findByRole('button', { name: 'Archive idea' });
    fireEvent.click(archive);
    expect(confirm).toHaveBeenCalledWith('Archive this idea with 1 open action?');
    expect(setArchived).not.toHaveBeenCalled();

    fireEvent.click(archive);
    await waitFor(() => expect(setArchived).toHaveBeenCalledWith('idea-1', true));
    expect(await screen.findByRole('button', { name: 'Restore idea' })).toBeInTheDocument();
  });

  it('archives immediately when there are no open actions', async () => {
    listActions.mockResolvedValue([
      { id: 'action-done', ideaId: idea.id, text: 'List available tools.', status: 'completed', createdAt: 1, updatedAt: 2, completedAt: 2 },
    ]);
    const confirm = vi.spyOn(window, 'confirm');
    render(<IdeaDetailScreen ideaId="idea-1" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Archive idea' }));
    await waitFor(() => expect(setArchived).toHaveBeenCalledWith('idea-1', true));
    expect(confirm).not.toHaveBeenCalled();
  });

  it('copies the summary and downloads Markdown and JSON without the full transcript', async () => {
    render(<IdeaDetailScreen ideaId="idea-1" />);
    await screen.findByDisplayValue(idea.title);

    fireEvent.click(screen.getByRole('button', { name: 'Copy summary' }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith(idea.summary.text));

    fireEvent.click(screen.getByRole('button', { name: 'Export Markdown' }));
    fireEvent.click(screen.getByRole('button', { name: 'Export JSON' }));
    expect(downloadText).toHaveBeenNthCalledWith(
      1,
      'neighborhood-tool-library.md',
      expect.not.stringContaining('The complete source transcript.'),
      'text/markdown;charset=utf-8',
    );
    expect(downloadText).toHaveBeenNthCalledWith(
      2,
      'neighborhood-tool-library.json',
      expect.stringContaining('"schemaVersion": "nugget-idea-export-v1"'),
      'application/json;charset=utf-8',
    );
    expect(downloadText.mock.calls[1]?.[1]).not.toContain('The complete source transcript.');
  });

  it('shows a truthful not-found state for a draft or missing idea', async () => {
    getIdea.mockResolvedValue({ ...idea, status: 'draft' });
    render(<IdeaDetailScreen ideaId="idea-1" />);
    expect(await screen.findByRole('heading', { name: 'Idea not found' })).toBeInTheDocument();
    expect(screen.getByText(/waiting for confirmation/i)).toBeInTheDocument();
  });
});
