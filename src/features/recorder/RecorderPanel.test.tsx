import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecorderPanel } from './RecorderPanel';
import type { RecordingDraft } from '@/types';

const push = vi.fn();
const saveRecording = vi.fn();

const draft: RecordingDraft = {
  blob: new Blob(['audio'], { type: 'audio/webm' }),
  mimeType: 'audio/webm',
  durationMs: 1200,
  sizeBytes: 5,
  waveformPreview: [0.1],
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/hooks/useRecorder', () => ({
  useRecorder: () => ({
    state: 'idle',
    elapsedMs: 1200,
    level: 0,
    draft,
    error: null,
    start: vi.fn(),
    stop: vi.fn(),
    discard: vi.fn(),
  }),
}));

vi.mock('@/lib/providers/transcription/cloudProvider', () => ({
  cloudTranscriptionProvider: {
    getConfig: vi.fn(async () => ({ available: true, providerLabel: 'OpenAI-compatible transcription', model: 'whisper-test' })),
  },
}));

vi.mock('./saveRecording', () => ({
  saveRecording: (...args: unknown[]) => saveRecording(...args),
}));

beforeEach(() => {
  push.mockReset();
  saveRecording.mockReset();
  saveRecording.mockResolvedValue({ idea: { id: 'idea-1' } });
});

describe('RecorderPanel real transcription affordance', () => {
  it('shows mock and real transcription actions for a stopped draft', async () => {
    render(<RecorderPanel />);

    expect(screen.getByText('Saved locally first')).toBeInTheDocument();
    expect(screen.getByText(/configured cloud provider/i)).toBeInTheDocument();
    expect(screen.queryByText('Local-only')).not.toBeInTheDocument();
    expect(screen.queryByText(/everything stays on your device/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save & mock transcribe/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /save & real transcribe/i })).toBeInTheDocument();
  });

  it('opens consent before real transcription and cancel sends nothing', async () => {
    render(<RecorderPanel />);

    fireEvent.click(await screen.findByRole('button', { name: /save & real transcribe/i }));

    expect(screen.getByRole('dialog')).toHaveTextContent(/audio recording/i);
    expect(screen.getByRole('dialog')).toHaveTextContent(/OpenAI-compatible transcription/i);
    expect(saveRecording).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(saveRecording).not.toHaveBeenCalled();
  });
});
