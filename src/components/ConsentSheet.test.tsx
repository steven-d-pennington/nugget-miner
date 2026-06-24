import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConsentSheet } from './ConsentSheet';

describe('ConsentSheet', () => {
  it('names the data, provider, purpose, and cancel-safe copy', () => {
    render(
      <ConsentSheet
        open
        dataLabel="audio recording"
        providerLabel="OpenAI-compatible transcription"
        purpose="generate a transcript"
        busy={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/audio recording/i)).toBeInTheDocument();
    expect(screen.getByText(/OpenAI-compatible transcription/i)).toBeInTheDocument();
    expect(screen.getByText(/generate a transcript/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send for processing/i })).toBeInTheDocument();
  });
});
