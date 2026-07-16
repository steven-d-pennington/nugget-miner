import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IdeaDetailScreen } from './IdeaDetailScreen';

const push = vi.fn();
const runMockExtraction = vi.fn();
const runCloudExtraction = vi.fn();
const updateText = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

vi.mock('@/lib/repositories', () => ({
  captureRepository: {
    getById: vi.fn(async () => ({
      id: 'capture-1',
      source: 'text',
      createdAt: 1,
      durationMs: 0,
      processingState: 'transcript_ready',
    })),
  },
  recordingRepository: {
    getByCaptureId: vi.fn(async () => undefined),
  },
  transcriptRepository: {
    getCurrent: vi.fn(async () => ({
      id: 'transcript-1',
      captureSessionId: 'capture-1',
      version: 1,
      text: 'Transcript text',
      provider: 'typed',
      source: 'typed',
      contentHash: 'hash',
      createdAt: 1,
      updatedAt: 1,
    })),
    updateText: (...args: unknown[]) => updateText(...args),
  },
}));

vi.mock('@/lib/services/ReviewService', () => ({
  ReviewService: {
    runMockExtraction: (...args: unknown[]) => runMockExtraction(...args),
    runCloudExtraction: (...args: unknown[]) => runCloudExtraction(...args),
  },
}));

beforeEach(() => {
  push.mockReset();
  runMockExtraction.mockReset();
  runCloudExtraction.mockReset();
  updateText.mockReset();
  updateText.mockResolvedValue(undefined);
  runMockExtraction.mockResolvedValue(undefined);
  runCloudExtraction.mockResolvedValue(undefined);
});

describe('IdeaDetailScreen extraction compatibility affordances', () => {
  it('renders mock and LLM extraction actions for a transcript-ready capture', async () => {
    render(<IdeaDetailScreen ideaId="capture-1" />);

    expect(await screen.findByRole('button', { name: /extract nuggets/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /extract with llm/i })).toBeInTheDocument();
  });

  it('requires consent before cloud extraction', async () => {
    render(<IdeaDetailScreen ideaId="capture-1" />);

    fireEvent.click(await screen.findByRole('button', { name: /extract with llm/i }));

    expect(screen.getByRole('dialog')).toHaveTextContent(/transcript text/i);
    expect(runCloudExtraction).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /send for processing/i }));

    await waitFor(() =>
      expect(runCloudExtraction).toHaveBeenCalledWith(
        expect.objectContaining({ captureSessionId: 'capture-1', requestConsent: expect.any(Function) }),
      ),
    );
    expect(push).toHaveBeenCalledWith('/review/capture-1');
  });
});
