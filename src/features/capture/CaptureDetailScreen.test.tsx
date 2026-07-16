import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioPlayer } from '@/components/AudioPlayer';
import type { CaptureSession, Recording, Transcript } from '@/types';
import { CaptureDetailScreen } from './CaptureDetailScreen';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  getCapture: vi.fn(),
  getRecording: vi.fn(),
  getTranscript: vi.fn(),
  transition: vi.fn(),
  updateText: vi.fn(),
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
  enqueue: vi.fn(),
  process: vi.fn(),
  reprocess: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));

vi.mock('@/components/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

vi.mock('@/lib/repositories', () => ({
  captureRepository: {
    getById: (...args: unknown[]) => mocks.getCapture(...args),
    transition: (...args: unknown[]) => mocks.transition(...args),
  },
  recordingRepository: { getByCaptureId: (...args: unknown[]) => mocks.getRecording(...args) },
  transcriptRepository: {
    getCurrent: (...args: unknown[]) => mocks.getTranscript(...args),
    updateText: (...args: unknown[]) => mocks.updateText(...args),
  },
  settingsRepository: {
    get: (...args: unknown[]) => mocks.getSettings(...args),
    update: (...args: unknown[]) => mocks.updateSettings(...args),
  },
}));

vi.mock('@/lib/services/ProcessingService', () => ({
  ProcessingService: {
    enqueue: (...args: unknown[]) => mocks.enqueue(...args),
    process: (...args: unknown[]) => mocks.process(...args),
  },
}));

vi.mock('@/lib/services/ReviewService', () => ({
  ReviewService: { reprocess: (...args: unknown[]) => mocks.reprocess(...args) },
}));

function capture(overrides: Partial<CaptureSession> = {}): CaptureSession {
  return {
    id: 'capture-1',
    source: 'text',
    processingState: 'transcript_ready',
    processingPreference: 'manual',
    processingAttempt: 0,
    durationMs: 0,
    createdAt: 1_700_000_000_000,
    updatedAt: 1_700_000_000_000,
    ...overrides,
  };
}

function transcript(overrides: Partial<Transcript> = {}): Transcript {
  return {
    id: 'transcript-1',
    captureSessionId: 'capture-1',
    version: 1,
    text: 'Original transcript',
    provider: 'typed',
    source: 'typed',
    contentHash: 'hash-1',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

function recording(): Recording {
  return {
    id: 'recording-1',
    captureSessionId: 'capture-1',
    blob: new Blob(['audio'], { type: 'audio/webm' }),
    mimeType: 'audio/webm',
    sizeBytes: 5,
    durationMs: 4_200,
    waveformPreview: [],
    createdAt: 1,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  mocks.getCapture.mockResolvedValue(capture());
  mocks.getRecording.mockResolvedValue(undefined);
  mocks.getTranscript.mockResolvedValue(transcript());
  mocks.transition.mockResolvedValue(undefined);
  mocks.updateText.mockResolvedValue(transcript({ id: 'transcript-2', version: 2, text: 'Edited transcript', source: 'edited' }));
  mocks.getSettings.mockResolvedValue({ cloudProcessingConsent: 'granted', automaticProcessing: false });
  mocks.updateSettings.mockResolvedValue(undefined);
  mocks.enqueue.mockResolvedValue(undefined);
  mocks.process.mockResolvedValue(undefined);
  mocks.reprocess.mockResolvedValue(undefined);
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:recording'),
    revokeObjectURL: vi.fn(),
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('CaptureDetailScreen', () => {
  it('renders exact missing and repository failure states', async () => {
    mocks.getCapture.mockResolvedValueOnce(undefined);
    const { unmount } = render(<CaptureDetailScreen captureId="missing" />);
    expect(await screen.findByRole('heading', { name: 'Capture not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Capture' })).toHaveAttribute('href', '/');
    unmount();

    mocks.getCapture.mockRejectedValueOnce(new Error('IndexedDB unavailable'));
    render(<CaptureDetailScreen captureId="broken" />);
    expect(await screen.findByRole('heading', { name: 'Unable to load capture' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('IndexedDB unavailable');
  });

  it('renders durable typed and audio sources without mislabeling missing audio', async () => {
    const { unmount } = render(<CaptureDetailScreen captureId="capture-1" />);
    expect(await screen.findByRole('heading', { name: 'Recording saved' })).toBeInTheDocument();
    expect(screen.getByText(/Typed capture/)).toBeInTheDocument();
    expect(screen.queryByText('No local recording found.')).not.toBeInTheDocument();
    unmount();

    mocks.getCapture.mockResolvedValue(capture({ source: 'audio' }));
    render(<CaptureDetailScreen captureId="capture-1" />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/Audio playback is unavailable/);
    expect(screen.queryByText(/Typed capture/)).not.toBeInTheDocument();
  });

  it('renders playback, metadata, and the four text-and-icon stages for audio', async () => {
    mocks.getCapture.mockResolvedValue(capture({ source: 'audio', processingState: 'transcribing' }));
    mocks.getRecording.mockResolvedValue(recording());
    mocks.getTranscript.mockResolvedValue(undefined);
    render(<CaptureDetailScreen captureId="capture-1" />);

    expect(await screen.findByLabelText('Saved recording playback')).toBeInTheDocument();
    expect(screen.getByText(/0:04 · audio\/webm/)).toBeInTheDocument();
    const progress = screen.getByRole('list', { name: 'Processing progress' });
    expect(progress).toHaveTextContent('Saved');
    expect(progress).toHaveTextContent('Transcribing current step');
    expect(progress).toHaveTextContent('Organizing');
    expect(progress).toHaveTextContent('Ready for review');
  });

  it('marks the recoverable failed stage and says the source remains safe', async () => {
    mocks.getCapture.mockResolvedValue(capture({
      processingState: 'failed',
      recoverableStage: 'organization',
      lastError: { stage: 'organization', code: 'bad_output', message: 'Organization failed.', retryable: true, occurredAt: 1 },
    }));
    render(<CaptureDetailScreen captureId="capture-1" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Organization failed. Your saved transcript remains safe');
    expect(screen.getByText('Organizing').closest('li')).toHaveTextContent('failed here');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled();
  });

  it('requires specific consent, cancel sends nothing, and confirm persists consent before enqueue and process', async () => {
    const order: string[] = [];
    mocks.getSettings.mockResolvedValue({ cloudProcessingConsent: 'unknown', automaticProcessing: false });
    mocks.updateSettings.mockImplementation(async () => { order.push('consent'); });
    mocks.enqueue.mockImplementation(async () => { order.push('enqueue'); });
    mocks.process.mockImplementation(async () => { order.push('process'); });
    render(<CaptureDetailScreen captureId="capture-1" />);

    fireEvent.click(await screen.findByRole('button', { name: 'Process now' }));
    const firstDialog = await screen.findByRole('dialog');
    expect(firstDialog).toHaveTextContent(/transcript text/);
    expect(firstDialog).toHaveTextContent(/OpenAI/);
    expect(firstDialog).toHaveTextContent(/GPT-5.6/);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mocks.enqueue).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Process now' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Send for processing' }));
    await waitFor(() => expect(mocks.process).toHaveBeenCalledWith('capture-1'));
    expect(order).toEqual(['consent', 'enqueue', 'process']);
  });

  it('reopens consent for a persisted nonretryable consent failure', async () => {
    mocks.getCapture.mockResolvedValue(capture({
      processingState: 'failed',
      lastError: { stage: 'organization', code: 'cloud_consent_required', message: 'Consent required.', retryable: false, occurredAt: 1 },
    }));
    render(<CaptureDetailScreen captureId="capture-1" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent(/OpenAI/);
    expect(mocks.enqueue).not.toHaveBeenCalled();
  });

  it('queues offline without processing', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    mocks.enqueue.mockImplementation(async () => {
      mocks.getCapture.mockResolvedValue(capture({ processingState: 'queued' }));
    });
    render(<CaptureDetailScreen captureId="capture-1" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Process now' }));
    await waitFor(() => expect(mocks.enqueue).toHaveBeenCalledWith('capture-1'));
    expect(mocks.process).not.toHaveBeenCalled();
    expect(await screen.findByRole('button', { name: 'Waiting for connection' })).toBeDisabled();
  });

  it('reports settings failures with preservation copy', async () => {
    mocks.getSettings.mockRejectedValueOnce(new Error('Settings unavailable'));
    render(<CaptureDetailScreen captureId="capture-1" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Process now' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Settings unavailable.*saved transcript remains safe/i);
    expect(mocks.enqueue).not.toHaveBeenCalled();
  });

  it('does not process an unsaved transcript and saves one new version without reprocessing', async () => {
    render(<CaptureDetailScreen captureId="capture-1" />);
    const editor = await screen.findByLabelText('Transcript text');
    fireEvent.change(editor, { target: { value: 'Edited transcript' } });
    expect(screen.getByRole('button', { name: 'Save transcript changes first' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Save transcript edit' }));
    await waitFor(() => expect(mocks.updateText).toHaveBeenCalledWith('capture-1', 'Edited transcript'));
    expect(mocks.transition).toHaveBeenCalledWith('capture-1', 'transcript_ready', { transcriptId: 'transcript-2' });
    expect(mocks.reprocess).not.toHaveBeenCalled();
    expect(await screen.findByText(/will not be reprocessed/)).toBeInTheDocument();
  });

  it('updates once, transitions, and only then reprocesses on the explicit choice', async () => {
    const order: string[] = [];
    mocks.updateText.mockImplementation(async () => { order.push('update'); return transcript({ id: 'transcript-2', version: 2, text: 'Edited transcript' }); });
    mocks.transition.mockImplementation(async () => { order.push('transition'); });
    mocks.reprocess.mockImplementation(async () => { order.push('reprocess'); });
    render(<CaptureDetailScreen captureId="capture-1" />);
    fireEvent.change(await screen.findByLabelText('Transcript text'), { target: { value: 'Edited transcript' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save and reprocess' }));

    await waitFor(() => expect(mocks.reprocess).toHaveBeenCalledWith('capture-1'));
    expect(order).toEqual(['update', 'transition', 'reprocess']);
    expect(mocks.updateText).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Confirmed ideas are preserved/)).toBeInTheDocument();
  });

  it('reprocesses unchanged already-saved text without creating a duplicate transcript version', async () => {
    render(<CaptureDetailScreen captureId="capture-1" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Save and reprocess' }));
    await waitFor(() => expect(mocks.reprocess).toHaveBeenCalledWith('capture-1'));
    expect(mocks.updateText).not.toHaveBeenCalled();
    expect(mocks.transition).toHaveBeenCalledWith('capture-1', 'transcript_ready', { transcriptId: 'transcript-1' });
  });

  it('redirects ready captures once unless stay=1 and leaves later final states navigable', async () => {
    mocks.getCapture.mockResolvedValue(capture({ processingState: 'ready_for_review' }));
    const { unmount } = render(<CaptureDetailScreen captureId="capture-1" />);
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/review/capture-1'));
    expect(mocks.replace).toHaveBeenCalledTimes(1);
    unmount();

    mocks.replace.mockClear();
    render(<CaptureDetailScreen captureId="capture-1" stayOnCapture />);
    expect(await screen.findByRole('link', { name: 'Review ideas' })).toHaveAttribute('href', '/review/capture-1');
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('does not poll a manual transcript_ready capture', async () => {
    vi.useFakeTimers();
    render(<CaptureDetailScreen captureId="capture-1" />);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(screen.getByRole('heading', { name: 'Recording saved' })).toBeInTheDocument();
    const initialReads = mocks.getCapture.mock.calls.length;
    await act(async () => { vi.advanceTimersByTime(3_000); await Promise.resolve(); });
    expect(mocks.getCapture).toHaveBeenCalledTimes(initialReads);
  });

  it('polls only an observed active lifecycle without overlap and preserves dirty text', async () => {
    vi.useFakeTimers();
    mocks.getCapture.mockResolvedValue(capture({ processingState: 'queued' }));
    let resolveRead: ((value: CaptureSession) => void) | undefined;
    render(<CaptureDetailScreen captureId="capture-1" />);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    fireEvent.change(screen.getByLabelText('Transcript text'), { target: { value: 'Unsaved local edit' } });
    mocks.getCapture.mockImplementationOnce(() => new Promise((resolve) => { resolveRead = resolve; }));
    const before = mocks.getCapture.mock.calls.length;
    await act(async () => { vi.advanceTimersByTime(2_100); await Promise.resolve(); });
    expect(mocks.getCapture).toHaveBeenCalledTimes(before + 1);
    expect(screen.getByLabelText('Transcript text')).toHaveValue('Unsaved local edit');
    await act(async () => { resolveRead?.(capture({ processingState: 'organizing' })); await Promise.resolve(); });
    expect(screen.getByLabelText('Transcript text')).toHaveValue('Unsaved local edit');
  });

  it('refreshes an active lifecycle on visibility and cleans its listener on unmount', async () => {
    mocks.getCapture.mockResolvedValue(capture({ processingState: 'queued' }));
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const { unmount } = render(<CaptureDetailScreen captureId="capture-1" />);
    await screen.findByRole('button', { name: 'Queued' });
    await waitFor(() => expect(add).toHaveBeenCalledWith('visibilitychange', expect.any(Function)));
    const before = mocks.getCapture.mock.calls.length;
    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    await waitFor(() => expect(mocks.getCapture.mock.calls.length).toBeGreaterThan(before));
    unmount();
    expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });
});

describe('AudioPlayer object URL lifecycle', () => {
  it('revokes replaced and unmounted Blob URLs and exposes an accessible name', () => {
    const first = recording();
    const second = { ...recording(), id: 'recording-2', blob: new Blob(['new']) };
    const { rerender, unmount } = render(<AudioPlayer recording={first} />);
    expect(screen.getByLabelText('Saved recording playback')).toBeInTheDocument();
    rerender(<AudioPlayer recording={second} />);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:recording');
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
