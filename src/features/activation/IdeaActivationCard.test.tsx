import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Idea } from '@/types';
import { IdeaActivationCard } from './IdeaActivationCard';

const getBrief = vi.fn();
const saveBrief = vi.fn();
const updatePrompt = vi.fn();
const getSettings = vi.fn();
const updateSettings = vi.fn();
const downloadText = vi.fn();

vi.mock('@/lib/repositories', () => ({
  activationBriefRepository: {
    get: (...args: unknown[]) => getBrief(...args),
    save: (...args: unknown[]) => saveBrief(...args),
    updatePrompt: (...args: unknown[]) => updatePrompt(...args),
  },
  settingsRepository: {
    get: (...args: unknown[]) => getSettings(...args),
    update: (...args: unknown[]) => updateSettings(...args),
  },
}));

vi.mock('@/lib/export/download', () => ({
  downloadText: (...args: unknown[]) => downloadText(...args),
  slugifyIdeaFilename: () => 'test-idea',
}));

const idea = {
  id: 'idea-1', captureSessionId: 'capture-1', status: 'confirmed', title: 'Build a neighborhood library',
  summary: { id: 'summary', text: 'Help neighbors share rarely used tools.', basis: 'explicit', sourceSpanIds: [] },
  goals: [], blockers: [], questions: [], suggestedActions: [],
  research: { needed: false, suggestedQueries: [], suggestedResourceTypes: [] },
  categoryId: 'personal', tagIds: [], sourceSpans: [], createdAt: 1, updatedAt: 1,
} as Idea;
const category = { id: 'personal', name: 'Personal', normalizedName: 'personal', description: 'Personal projects.', isDefault: true, isFallback: false, sortOrder: 1, createdAt: 1, updatedAt: 1 };
const transcript = { id: 'transcript-1', captureSessionId: 'capture-1', version: 1, text: 'PRIVATE SOURCE TRANSCRIPT', provider: 'openai', source: 'transcription' as const, contentHash: 'hash', createdAt: 1, updatedAt: 1 };

function renderCard() {
  return render(<IdeaActivationCard actions={[]} category={category} idea={idea} tags={[]} transcript={transcript} />);
}

function savedRecord(input: Record<string, unknown>) {
  return { ...input, id: 'idea-1:plan', createdAt: 1, updatedAt: 1 };
}

beforeEach(() => {
  vi.clearAllMocks();
  getBrief.mockResolvedValue(undefined);
  saveBrief.mockImplementation(async (input) => savedRecord(input));
  getSettings.mockResolvedValue({ key: 'app', cloudProcessingConsent: 'unknown', automaticProcessing: false, clientId: '00000000-0000-4000-8000-000000000001', createdAt: 1, updatedAt: 1 });
  updateSettings.mockResolvedValue({ key: 'app', cloudProcessingConsent: 'granted', automaticProcessing: false, clientId: '00000000-0000-4000-8000-000000000001', createdAt: 1, updatedAt: 2 });
});

describe('IdeaActivationCard', () => {
  it('creates a useful local plan without including the transcript by default', async () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Choose what to do' }));
    fireEvent.click(screen.getByRole('button', { name: /Create a plan/ }));
    await screen.findByRole('button', { name: 'Create locally' });

    expect(screen.getByRole('checkbox', { name: /Include source transcript/ })).not.toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Create locally' }));

    await waitFor(() => expect(saveBrief).toHaveBeenCalled());
    const input = saveBrief.mock.calls[0]![0];
    expect(input).toMatchObject({ ideaId: 'idea-1', intent: 'plan', includeTranscript: false, provider: 'local' });
    expect(input.brief.prompt).toContain('Help neighbors share rarely used tools.');
    expect(input.brief.prompt).not.toContain('PRIVATE SOURCE TRANSCRIPT');
    expect(await screen.findByText('Draft created and saved on this device.')).toBeInTheDocument();
  });

  it('names the exact cloud data before generating a GPT-5.6 brief', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      result: {
        needsClarification: false,
        clarifyingQuestions: [],
        brief: {
          title: 'Neighborhood library exploration', objective: 'Explore the idea.',
          context: 'A neighborhood tool library.', assumptions: [], constraints: [],
          deliverables: ['Options'], successCriteria: ['A direction is selected'], prompt: 'Explore this idea.',
        },
      },
      provider: 'openai', model: 'gpt-5.6-terra', responseId: 'resp_1', promptVersion: 'activate-v1', schemaVersion: 'activation-v1',
    }), { status: 200, headers: { 'content-type': 'application/json' } }));

    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Choose what to do' }));
    fireEvent.click(screen.getByRole('button', { name: /Explore this idea/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Enhance with GPT-5.6' }));

    const consent = await screen.findByRole('dialog', { name: 'Send for cloud processing?' });
    expect(consent).toHaveTextContent('organized idea');
    expect(consent).not.toHaveTextContent('source transcript');
    fireEvent.click(screen.getByRole('button', { name: 'Send for processing' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const request = JSON.parse(String((fetchMock.mock.calls[0]![1] as RequestInit).body));
    expect(request.idea).not.toHaveProperty('transcript');
    await waitFor(() => expect(saveBrief).toHaveBeenCalledWith(expect.objectContaining({ provider: 'openai', model: 'gpt-5.6-terra' })));
    expect(await screen.findByDisplayValue('Explore this idea.')).toBeInTheDocument();
  });

  it('keeps a failed cloud attempt recoverable with the local fallback', async () => {
    getSettings.mockResolvedValue({ key: 'app', cloudProcessingConsent: 'granted', automaticProcessing: false, clientId: '00000000-0000-4000-8000-000000000001', createdAt: 1, updatedAt: 1 });
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));

    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'Choose what to do' }));
    fireEvent.click(screen.getByRole('button', { name: /Prepare for an AI agent/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Enhance with GPT-5.6' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('could not connect');
    fireEvent.click(screen.getByRole('button', { name: 'Create locally instead' }));
    await waitFor(() => expect(saveBrief).toHaveBeenCalledWith(expect.objectContaining({ intent: 'agent', provider: 'local' })));
  });
});
