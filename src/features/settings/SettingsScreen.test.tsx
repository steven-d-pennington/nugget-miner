import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsPage from '@/app/settings/page';
import { SettingsScreen } from './SettingsScreen';

const navigate = vi.fn();
const getSettings = vi.fn();
const updateSettings = vi.fn();
const buildFullExport = vi.fn();
const downloadText = vi.fn();
const deleteAll = vi.fn();
const estimateStorage = vi.fn();
const persistedStorage = vi.fn();
const persistStorage = vi.fn();
const seedDemo = vi.fn();
const navigateToIdeas = vi.fn();

vi.mock('@/components/AppShell', () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/lib/repositories', () => ({
  settingsRepository: { get: (...args: unknown[]) => getSettings(...args), update: (...args: unknown[]) => updateSettings(...args) },
}));
vi.mock('@/lib/export/fullExport', () => ({ buildFullExport: (...args: unknown[]) => buildFullExport(...args) }));
vi.mock('@/lib/export/download', () => ({ downloadText: (...args: unknown[]) => downloadText(...args) }));
vi.mock('@/lib/services/DataManagementService', () => ({ DataManagementService: { deleteAll: (...args: unknown[]) => deleteAll(...args) } }));
vi.mock('@/lib/demo/DemoDataService', () => ({ DemoDataService: { seed: (...args: unknown[]) => seedDemo(...args) } }));

const baseSettings = { key: 'app', automaticProcessing: false, cloudProcessingConsent: 'unknown', clientId: 'hidden', createdAt: 1, updatedAt: 1 } as const;

beforeEach(() => {
  vi.clearAllMocks();
  getSettings.mockResolvedValue(baseSettings);
  updateSettings.mockImplementation(async (patch) => ({ ...baseSettings, ...patch }));
  buildFullExport.mockResolvedValue({ schemaVersion: 'nugget-full-export-v1', exportedAt: '2026-07-16T12:00:00.000Z' });
  deleteAll.mockResolvedValue(undefined);
  estimateStorage.mockResolvedValue({ usage: 2_048, quota: 8_192 });
  persistedStorage.mockResolvedValue(false);
  persistStorage.mockResolvedValue(true);
  seedDemo.mockResolvedValue({ created: true, captureId: 'demo-capture' });
  Object.defineProperty(navigator, 'storage', {
    configurable: true,
    value: { estimate: estimateStorage, persisted: persistedStorage, persist: persistStorage },
  });
  navigate.mockReset();
  navigateToIdeas.mockReset();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({
    status: 'ok', secret: 'must-not-render', internalPath: '/server/private',
    transcription: { available: true, model: 'gpt-transcribe', apiKey: 'secret' },
    organization: { available: true, model: 'gpt-5.6-terra', baseUrl: '/private' },
  }) }));
});

describe('SettingsScreen', () => {
  it('preserves category navigation and renders truthful, sanitized processing evidence', async () => {
    render(<SettingsPage />);
    expect(screen.getByRole('link', { name: 'Manage categories' })).toHaveAttribute('href', '/settings/categories');
    expect(screen.getByText(/When processing runs, audio is sent securely for transcription/)).toBeInTheDocument();
    expect(screen.getByText('Recordings remain in this browser until you delete the capture or erase all local data.')).toBeInTheDocument();
    expect(await screen.findByText('gpt-5.6-terra (available)')).toBeInTheDocument();
    expect(screen.getByText('Built with GPT-5.6 and Codex')).toBeInTheDocument();
    expect(screen.getByText(/segment-v2, organize-v2/)).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent('must-not-render');
    expect(document.body).not.toHaveTextContent('/server/private');
    expect(document.body).not.toHaveTextContent('secret');
  });

  it('requires consent before enabling automatic processing and revokes without deleting data', async () => {
    render(<SettingsScreen />);
    const automatic = await screen.findByRole('checkbox', { name: 'Automatic organization' });
    fireEvent.click(automatic);
    expect(screen.getByRole('dialog', { name: 'Allow automatic cloud processing?' })).toBeInTheDocument();
    expect(updateSettings).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Allow and enable' }));
    await waitFor(() => expect(updateSettings).toHaveBeenCalledWith({ cloudProcessingConsent: 'granted', automaticProcessing: true }));

    const revoke = await screen.findByRole('button', { name: 'Revoke cloud processing consent' });
    fireEvent.click(revoke);
    await waitFor(() => expect(updateSettings).toHaveBeenCalledWith({ cloudProcessingConsent: 'denied', automaticProcessing: false }));
    expect(deleteAll).not.toHaveBeenCalled();
  });

  it('exports locally without another network call', async () => {
    render(<SettingsScreen navigateToCapture={navigate} />);
    await screen.findByRole('checkbox', { name: 'Automatic organization' });
    fireEvent.click(screen.getByRole('button', { name: 'Export all local data' }));
    await waitFor(() => expect(downloadText).toHaveBeenCalledWith(
      'nugget-full-export-2026-07-16.json',
      expect.stringContaining('nugget-full-export-v1'),
      'application/json',
    ));
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('loads a clearly disclosed local sample library without calling GPT-5.6', async () => {
    seedDemo
      .mockResolvedValueOnce({ created: true, captureId: 'demo-capture' })
      .mockResolvedValueOnce({ created: false, captureId: 'demo-capture' });
    render(<SettingsScreen navigateToIdeas={navigateToIdeas} />);

    expect(await screen.findByText('Adds three clearly labeled sample ideas to this browser so you can explore search, categories, actions, and export. It does not call GPT-5.6 and does not replace the live capture demo.')).toBeInTheDocument();
    const loadSample = screen.getByRole('button', { name: 'Load sample library' });
    fireEvent.click(loadSample);
    await waitFor(() => expect(seedDemo).toHaveBeenCalledTimes(1));
    expect(screen.getByText('Sample ideas added')).toBeInTheDocument();
    await waitFor(() => expect(navigateToIdeas).toHaveBeenCalledTimes(1));

    fireEvent.click(loadSample);
    await waitFor(() => expect(seedDemo).toHaveBeenCalledTimes(2));
    expect(screen.getByText('Sample ideas are already loaded')).toBeInTheDocument();
  });

  it('keeps the sample button label accurate while another local action is busy', async () => {
    let finishExport: (() => void) | undefined;
    buildFullExport.mockReturnValueOnce(new Promise((resolve) => { finishExport = () => resolve({ schemaVersion: 'nugget-full-export-v1', exportedAt: '2026-07-16T12:00:00.000Z' }); }));
    render(<SettingsScreen />);

    await screen.findByRole('button', { name: 'Load sample library' });
    fireEvent.click(screen.getByRole('button', { name: 'Export all local data' }));
    expect(screen.getByRole('button', { name: 'Load sample library' })).toBeDisabled();

    finishExport?.();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Load sample library' })).toBeEnabled());
  });

  it('requires exact ERASE plus a second destructive action', async () => {
    render(<SettingsScreen navigateToCapture={navigate} />);
    const input = screen.getByLabelText('Type ERASE exactly to continue');
    const continueButton = screen.getByRole('button', { name: 'Continue to erase' });
    fireEvent.change(input, { target: { value: 'erase' } });
    expect(continueButton).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Erase all local data now' })).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'ERASE' } });
    fireEvent.click(continueButton);
    expect(deleteAll).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Erase all local data now' }));
    await waitFor(() => expect(deleteAll).toHaveBeenCalledTimes(1));
    expect(screen.getByText('All local Nugget data was erased.')).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
    await waitFor(() => expect(navigate).toHaveBeenCalledWith());
  });

  it('stays in Settings and warns that data may remain when erase fails', async () => {
    deleteAll.mockRejectedValueOnce(new Error('blocked'));
    render(<SettingsScreen navigateToCapture={navigate} />);
    fireEvent.change(screen.getByLabelText('Type ERASE exactly to continue'), { target: { value: 'ERASE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue to erase' }));
    fireEvent.click(screen.getByRole('button', { name: 'Erase all local data now' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Something needs attention');
    expect(navigate).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
  });

  it('requests persistent browser storage only from the explicit reliability action', async () => {
    render(<SettingsScreen />);
    await screen.findByRole('button', { name: 'Improve offline storage reliability' });

    expect(persistStorage).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Improve offline storage reliability' }));
    await waitFor(() => expect(persistStorage).toHaveBeenCalledTimes(1));
    expect(screen.getByText('This browser granted persistent offline storage for Nugget.')).toBeInTheDocument();
  });
});
