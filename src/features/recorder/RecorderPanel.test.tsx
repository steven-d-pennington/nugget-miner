import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RecordingDraft } from '@/types';
import { RecorderPanel } from './RecorderPanel';

const push = vi.fn();
const saveRecording = vi.fn();
const getSettings = vi.fn();

const draft: RecordingDraft = {
  blob: new Blob(['audio'], { type: 'audio/webm' }),
  mimeType: 'audio/webm',
  durationMs: 1_200,
  sizeBytes: 5,
  waveformPreview: [0.1],
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/hooks/useRecorder', () => ({
  useRecorder: () => ({
    state: 'idle',
    elapsedMs: 1_200,
    level: 0,
    draft,
    error: null,
    start: vi.fn(),
    stop: vi.fn(),
    discard: vi.fn(),
  }),
}));

vi.mock('@/lib/repositories', () => ({
  settingsRepository: { get: (...args: unknown[]) => getSettings(...args) },
}));

vi.mock('@/lib/services/CaptureService', () => ({
  CaptureService: { saveRecording: (...args: unknown[]) => saveRecording(...args) },
}));

beforeEach(() => {
  push.mockReset();
  saveRecording.mockReset();
  getSettings.mockReset();
  getSettings.mockResolvedValue({ automaticProcessing: false });
  saveRecording.mockResolvedValue({ capture: { id: 'capture-1' } });
});

describe('RecorderPanel durable save bridge', () => {
  it('offers one local-first save action without synchronous provider choices', () => {
    render(<RecorderPanel />);

    expect(screen.getByText('Saved locally first')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your recording is saved in this browser before processing. Real transcription sends audio to the configured cloud provider after consent.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save recording/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /transcribe/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Local-only')).not.toBeInTheDocument();
    expect(screen.queryByText(/everything stays on your device/i)).not.toBeInTheDocument();
  });

  it('uses the stored processing preference and routes only after local save resolves', async () => {
    getSettings.mockResolvedValue({ automaticProcessing: true });
    render(<RecorderPanel />);

    fireEvent.click(screen.getByRole('button', { name: /save recording/i }));

    await waitFor(() =>
      expect(saveRecording).toHaveBeenCalledWith({ draft, processingPreference: 'automatic' }),
    );
    expect(push).toHaveBeenCalledWith('/idea/capture-1');
  });

  it('routes a durable recording even when the noncritical refresh callback fails', async () => {
    const onSaved = vi.fn().mockRejectedValueOnce(new Error('Recent captures could not refresh.'));
    render(<RecorderPanel onSaved={onSaved} />);

    fireEvent.click(screen.getByRole('button', { name: /save recording/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/idea/capture-1'));
    expect(saveRecording).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Recent captures could not refresh.')).not.toBeInTheDocument();
  });
});
