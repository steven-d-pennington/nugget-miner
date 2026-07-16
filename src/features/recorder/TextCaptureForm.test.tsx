import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { db, resetClientDatabaseForTests } from '@/lib/db';
import { settingsRepository } from '@/lib/repositories';
import { TextCaptureForm } from './TextCaptureForm';

afterEach(async () => {
  vi.restoreAllMocks();
  await resetClientDatabaseForTests();
});

describe('TextCaptureForm', () => {
  it('starts collapsed and exposes the secondary text input on request', () => {
    render(<TextCaptureForm onSaved={vi.fn()} />);

    const toggle = screen.getByRole('button', { name: 'Paste a ramble' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByLabelText('Ramble text')).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByLabelText('Ramble text')).toBeInTheDocument();
  });

  it('persists a real capture and transcript with the stored processing preference', async () => {
    await settingsRepository.update({ automaticProcessing: true });
    const onSaved = vi.fn();
    render(<TextCaptureForm onSaved={onSaved} />);

    fireEvent.click(screen.getByRole('button', { name: 'Paste a ramble' }));
    const textarea = screen.getByLabelText('Ramble text');
    fireEvent.change(textarea, { target: { value: 'Plan a neighborhood tool-sharing library.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save and organize' }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(await db.captureSessions.count()).toBe(1);
    expect(await db.transcripts.count()).toBe(1);
    await expect(db.captureSessions.toCollection().first()).resolves.toMatchObject({
      source: 'text',
      processingPreference: 'automatic',
      processingState: 'queued',
    });
    await expect(db.transcripts.toCollection().first()).resolves.toMatchObject({
      text: 'Plan a neighborhood tool-sharing library.',
      source: 'typed',
    });
    expect(textarea).toHaveValue('');
  });

  it('shows validation feedback inline without creating or clearing a capture', async () => {
    render(<TextCaptureForm onSaved={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Paste a ramble' }));
    const textarea = screen.getByLabelText('Ramble text');
    fireEvent.change(textarea, { target: { value: ' a ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save and organize' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter at least three non-whitespace characters.');
    expect(textarea).toHaveValue(' a ');
    expect(await db.captureSessions.count()).toBe(0);
    expect(await db.transcripts.count()).toBe(0);
  });

  it('preserves the ramble when durable persistence fails', async () => {
    vi.spyOn(db.transcripts, 'add').mockRejectedValueOnce(
      new DOMException('Storage quota exceeded.', 'QuotaExceededError'),
    );
    render(<TextCaptureForm onSaved={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Paste a ramble' }));
    const textarea = screen.getByLabelText('Ramble text');
    const ramble = 'Keep this typed thought available so I can try saving it again.';
    fireEvent.change(textarea, { target: { value: ramble } });
    fireEvent.click(screen.getByRole('button', { name: 'Save and organize' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Your text is still here.');
    expect(textarea).toHaveValue(ramble);
    expect(await db.captureSessions.count()).toBe(0);
    expect(await db.transcripts.count()).toBe(0);
  });
});
