import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeScreen } from './HomeScreen';

const mocks = vi.hoisted(() => ({
  listRecent: vi.fn(),
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
}));

vi.mock('@/components/AppShell', () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('./TextCaptureForm', () => ({ TextCaptureForm: () => <button type="button">Paste a ramble</button> }));
vi.mock('./RecorderPanel', () => ({
  RecorderPanel: ({ onRecordingChange }: { onRecordingChange: (active: boolean) => void }) => (
    <button onClick={() => onRecordingChange(true)} type="button">Record</button>
  ),
}));
vi.mock('@/lib/repositories', () => ({
  captureRepository: { listRecent: (...args: unknown[]) => mocks.listRecent(...args) },
  settingsRepository: {
    get: (...args: unknown[]) => mocks.getSettings(...args),
    update: (...args: unknown[]) => mocks.updateSettings(...args),
  },
}));

const unknownSettings = {
  key: 'app',
  automaticProcessing: false,
  cloudProcessingConsent: 'unknown',
  clientId: 'client',
  createdAt: 1,
  updatedAt: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listRecent.mockResolvedValue([]);
  mocks.getSettings.mockResolvedValue(unknownSettings);
  mocks.updateSettings.mockImplementation(async (patch) => ({ ...unknownSettings, ...patch }));
});

describe('HomeScreen capture hierarchy', () => {
  it('shows the exact truthful cloud invitation and secondary home content', async () => {
    render(<HomeScreen />);

    expect(screen.getByRole('button', { name: 'Record' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Organize captures automatically' })).toBeInTheDocument();
    expect(screen.getByText(/sent securely to OpenAI for transcription and GPT-5.6 organization/)).toBeInTheDocument();
    expect(screen.getByText(/Saved recordings and ideas remain in this browser/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Paste a ramble' })).toBeInTheDocument();
  });

  it('grants consent and enables automatic processing together', async () => {
    render(<HomeScreen />);
    fireEvent.click(await screen.findByRole('button', { name: 'Enable automatic organization' }));

    await waitFor(() => expect(mocks.updateSettings).toHaveBeenCalledWith({
      automaticProcessing: true,
      cloudProcessingConsent: 'granted',
    }));
  });

  it('Not now disables automation, preserves unknown consent, and dismisses this invitation', async () => {
    render(<HomeScreen />);
    fireEvent.click(await screen.findByRole('button', { name: 'Not now' }));

    await waitFor(() => expect(mocks.updateSettings).toHaveBeenCalledWith({ automaticProcessing: false }));
    expect(mocks.updateSettings).not.toHaveBeenCalledWith(expect.objectContaining({ cloudProcessingConsent: expect.anything() }));
    expect(screen.queryByRole('heading', { name: 'Organize captures automatically' })).not.toBeInTheDocument();
  });

  it('hides every secondary home surface while recording', async () => {
    render(<HomeScreen />);
    await screen.findByRole('heading', { name: 'Organize captures automatically' });

    fireEvent.click(screen.getByRole('button', { name: 'Record' }));

    expect(screen.queryByRole('button', { name: 'Paste a ramble' })).not.toBeInTheDocument();
    expect(screen.queryByText(/ready to review/)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Recent captures' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Organize captures automatically' })).not.toBeInTheDocument();
  });

  it('counts ready and partially confirmed captures and routes every recent item to /capture', async () => {
    mocks.listRecent.mockResolvedValue([
      { id: 'ready', source: 'audio', processingState: 'ready_for_review', createdAt: 1 },
      { id: 'partial', source: 'text', processingState: 'partially_confirmed', createdAt: 2 },
      { id: 'saved', source: 'audio', processingState: 'saved', createdAt: 3 },
    ]);
    render(<HomeScreen />);

    expect(await screen.findByRole('link', { name: /2 captures ready to review/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Audio capture.*Ready for review/ })).toHaveAttribute('href', '/capture/ready');
    expect(screen.getByRole('link', { name: /Pasted ramble.*Ready for review/ })).toHaveAttribute('href', '/capture/partial');
  });

  it('keeps the recording entry point usable when the home summary cannot load', async () => {
    mocks.listRecent.mockRejectedValueOnce(new Error('IndexedDB unavailable'));
    render(<HomeScreen />);

    await waitFor(() => expect(mocks.listRecent).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'Record' })).toBeInTheDocument();
  });
});
