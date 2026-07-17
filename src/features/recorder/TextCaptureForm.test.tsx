import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TextCaptureForm } from './TextCaptureForm';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  getSettings: vi.fn(),
  saveText: vi.fn(),
  process: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/lib/repositories', () => ({
  settingsRepository: { get: (...args: unknown[]) => mocks.getSettings(...args) },
}));
vi.mock('@/lib/services/CaptureService', () => ({
  CaptureService: { saveText: (...args: unknown[]) => mocks.saveText(...args) },
}));
vi.mock('@/lib/services/ProcessingService', () => ({
  ProcessingService: { process: (...args: unknown[]) => mocks.process(...args) },
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function enterRamble(text = 'Plan a neighborhood tool-sharing library.') {
  fireEvent.click(screen.getByRole('button', { name: 'Paste a ramble' }));
  fireEvent.change(screen.getByLabelText('Ramble text'), { target: { value: text } });
  fireEvent.click(screen.getByRole('button', { name: 'Save ramble' }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSettings.mockResolvedValue({ automaticProcessing: false, cloudProcessingConsent: 'unknown' });
  mocks.saveText.mockResolvedValue({ capture: { id: 'text-capture-1' } });
  mocks.process.mockResolvedValue(undefined);
});

describe('TextCaptureForm', () => {
  it('starts collapsed and keeps pasted capture secondary', () => {
    render(<TextCaptureForm />);
    const toggle = screen.getByRole('button', { name: 'Paste a ramble' });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByLabelText('Ramble text')).not.toBeInTheDocument();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByLabelText('Ramble text')).toBeInTheDocument();
  });

  it('waits for durable text persistence before routing or processing', async () => {
    mocks.getSettings.mockResolvedValue({ automaticProcessing: true, cloudProcessingConsent: 'granted' });
    const save = deferred<{ capture: { id: string } }>();
    mocks.saveText.mockReturnValue(save.promise);
    render(<TextCaptureForm />);

    enterRamble();
    await waitFor(() => expect(mocks.saveText).toHaveBeenCalledWith({
      text: 'Plan a neighborhood tool-sharing library.',
      processingPreference: 'automatic',
    }));
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.process).not.toHaveBeenCalled();

    save.resolve({ capture: { id: 'text-capture-1' } });
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/capture/text-capture-1'));
    expect(mocks.process).toHaveBeenCalledWith('text-capture-1');
    expect(mocks.push.mock.invocationCallOrder[0]).toBeLessThan(mocks.process.mock.invocationCallOrder[0]!);
  });

  it('preserves the typed ramble when durable persistence fails', async () => {
    mocks.saveText.mockRejectedValueOnce(new DOMException('Storage quota exceeded.', 'QuotaExceededError'));
    render(<TextCaptureForm />);

    enterRamble('Keep this thought available for another save attempt.');

    expect(await screen.findByRole('alert')).toHaveTextContent('Your text is still here.');
    expect(screen.getByLabelText('Ramble text')).toHaveValue('Keep this thought available for another save attempt.');
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.process).not.toHaveBeenCalled();
  });

  it.each(['unknown', 'denied'] as const)('does not process text without granted consent (%s)', async (consent) => {
    mocks.getSettings.mockResolvedValue({ automaticProcessing: true, cloudProcessingConsent: consent });
    render(<TextCaptureForm />);

    enterRamble();

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith('/capture/text-capture-1'));
    expect(mocks.saveText).toHaveBeenCalledWith({
      text: 'Plan a neighborhood tool-sharing library.',
      processingPreference: 'manual',
    });
    expect(mocks.process).not.toHaveBeenCalled();
  });

  it('handles rejected fire-and-forget text processing after navigation', async () => {
    mocks.getSettings.mockResolvedValue({ automaticProcessing: true, cloudProcessingConsent: 'granted' });
    mocks.process.mockRejectedValue(new Error('offline'));
    render(<TextCaptureForm />);

    enterRamble();

    await waitFor(() => expect(mocks.process).toHaveBeenCalledWith('text-capture-1'));
    expect(mocks.push).toHaveBeenCalledWith('/capture/text-capture-1');
  });
});
