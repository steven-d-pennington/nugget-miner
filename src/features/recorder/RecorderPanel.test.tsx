import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RecordingDraft } from '@/types';
import { RecorderPanel } from './RecorderPanel';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  saveRecording: vi.fn(),
  process: vi.fn(),
  getSettings: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  discard: vi.fn(),
  clearSavedDraft: vi.fn(),
  recorder: {} as Record<string, unknown>,
}));

const draft: RecordingDraft = {
  blob: new Blob(['audio'], { type: 'audio/webm' }),
  mimeType: 'audio/webm',
  durationMs: 62_000,
  sizeBytes: 5,
  waveformPreview: [0.1],
};

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/hooks/useRecorder', () => ({ useRecorder: () => mocks.recorder }));
vi.mock('@/hooks/useWakeLock', () => ({ useWakeLock: vi.fn() }));
vi.mock('@/lib/repositories', () => ({
  settingsRepository: { get: (...args: unknown[]) => mocks.getSettings(...args) },
}));
vi.mock('@/lib/services/CaptureService', () => ({
  CaptureService: { saveRecording: (...args: unknown[]) => mocks.saveRecording(...args) },
}));
vi.mock('@/lib/services/ProcessingService', () => ({
  ProcessingService: { process: (...args: unknown[]) => mocks.process(...args) },
}));

function setRecorder(state: 'idle' | 'requesting-permission' | 'recording' = 'idle') {
  Object.assign(mocks.recorder, {
    state,
    elapsedMs: state === 'recording' ? 62_000 : 0,
    level: 0.55,
    draft: null,
    error: null,
    start: mocks.start,
    stop: mocks.stop,
    discard: mocks.discard,
    clearSavedDraft: mocks.clearSavedDraft,
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.clearAllMocks();
  setRecorder();
  mocks.getSettings.mockResolvedValue({ automaticProcessing: false, cloudProcessingConsent: 'unknown' });
  mocks.saveRecording.mockResolvedValue({ capture: { id: 'capture-1' } });
  mocks.process.mockResolvedValue(undefined);
  mocks.stop.mockImplementation(async () => {
    Object.assign(mocks.recorder, { state: 'idle', draft, elapsedMs: draft.durationMs });
    return draft;
  });
});

describe('RecorderPanel mobile capture', () => {
  it('offers exactly one primary Record control while idle', () => {
    render(<RecorderPanel />);

    expect(screen.getAllByRole('button', { name: 'Record' })).toHaveLength(1);
    expect(screen.getByRole('heading', { name: "What's on your mind?" })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save recording/i })).not.toBeInTheDocument();
  });

  it('shows only recording feedback and Stop & save while active', () => {
    setRecorder('recording');
    render(<RecorderPanel />);

    expect(screen.getByText('Listening…')).toBeInTheDocument();
    expect(screen.getByLabelText('Recording time 01:02')).toHaveTextContent('01:02');
    expect(screen.getByRole('meter', { name: 'Live microphone level' })).toHaveAttribute('aria-valuenow', '55');
    expect(screen.getByRole('button', { name: 'Stop & save' })).toBeInTheDocument();
    expect(screen.getByText('Saved on this device when you stop')).toBeInTheDocument();
    expect(screen.queryByText(/transcript/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/idea/i)).not.toBeInTheDocument();
  });

  it('locks capture while permission is pending and offers an owned cancellation path', async () => {
    setRecorder('requesting-permission');
    const onCaptureLockChange = vi.fn();
    render(<RecorderPanel onCaptureLockChange={onCaptureLockChange} />);

    expect(screen.getByRole('heading', { name: 'Requesting microphone access…' })).toBeInTheDocument();
    expect(screen.getByText(/Choose Allow in your browser/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Record' })).not.toBeInTheDocument();
    await waitFor(() => expect(onCaptureLockChange).toHaveBeenLastCalledWith(true));

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mocks.discard).toHaveBeenCalledTimes(1);
  });

  it('waits for durable storage before clearing, routing, or processing', async () => {
    setRecorder('recording');
    mocks.getSettings.mockResolvedValue({ automaticProcessing: true, cloudProcessingConsent: 'granted' });
    const save = deferred<{ capture: { id: string } }>();
    mocks.saveRecording.mockReturnValue(save.promise);
    render(<RecorderPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Stop & save' }));
    await waitFor(() => expect(mocks.saveRecording).toHaveBeenCalledWith({ draft, processingPreference: 'automatic' }));
    expect(mocks.clearSavedDraft).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.process).not.toHaveBeenCalled();

    save.resolve({ capture: { id: 'capture-1' } });
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/capture/capture-1'));
    expect(mocks.clearSavedDraft).toHaveBeenCalledTimes(1);
    expect(mocks.process).toHaveBeenCalledWith('capture-1');
    expect(mocks.clearSavedDraft.mock.invocationCallOrder[0]).toBeLessThan(mocks.push.mock.invocationCallOrder[0]!);
    expect(mocks.push.mock.invocationCallOrder[0]).toBeLessThan(mocks.process.mock.invocationCallOrder[0]!);
  });

  it('retains and retries the same stopped draft without stopping twice', async () => {
    setRecorder('recording');
    mocks.saveRecording.mockRejectedValueOnce(new DOMException('Quota exceeded', 'QuotaExceededError'));
    render(<RecorderPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Stop & save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('This device is low on storage');
    expect(screen.getByRole('alert')).not.toHaveTextContent('Quota exceeded');
    expect(screen.getByRole('button', { name: 'Retry save' })).toBeInTheDocument();
    expect(mocks.clearSavedDraft).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();

    mocks.saveRecording.mockResolvedValueOnce({ capture: { id: 'capture-retry' } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry save' }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/capture/capture-retry'));
    expect(mocks.stop).toHaveBeenCalledTimes(1);
    expect(mocks.saveRecording).toHaveBeenNthCalledWith(1, { draft, processingPreference: 'manual' });
    expect(mocks.saveRecording).toHaveBeenNthCalledWith(2, { draft, processingPreference: 'manual' });
  });

  it.each(['unknown', 'denied'] as const)('does not process without granted consent (%s)', async (consent) => {
    setRecorder('recording');
    mocks.getSettings.mockResolvedValue({ automaticProcessing: true, cloudProcessingConsent: consent });
    render(<RecorderPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Stop & save' }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/capture/capture-1'));
    expect(mocks.saveRecording).toHaveBeenCalledWith({ draft, processingPreference: 'manual' });
    expect(mocks.process).not.toHaveBeenCalled();
  });

  it('handles a rejected fire-and-forget processing call after navigation', async () => {
    setRecorder('recording');
    mocks.getSettings.mockResolvedValue({ automaticProcessing: true, cloudProcessingConsent: 'granted' });
    mocks.process.mockRejectedValue(new Error('offline'));
    render(<RecorderPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Stop & save' }));
    await waitFor(() => expect(mocks.process).toHaveBeenCalledWith('capture-1'));
    expect(mocks.push).toHaveBeenCalledWith('/capture/capture-1');
  });
});
