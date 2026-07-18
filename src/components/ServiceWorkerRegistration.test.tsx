import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InstallAppButton, InstallAppProvider } from './InstallAppButton';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('InstallAppButton', () => {
  it('shows an install button only after the browser offers installation and hides it after acceptance', async () => {
    const view = render(
      <InstallAppProvider>
        <div />
      </InstallAppProvider>,
    );

    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    }) as BeforeInstallPromptEvent;

    act(() => {
      window.dispatchEvent(event);
    });

    view.rerender(
      <InstallAppProvider>
        <InstallAppButton />
      </InstallAppProvider>,
    );

    expect(screen.getByRole('button', { name: 'Install Nugget' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Install Nugget' }));

    await waitFor(() => expect(prompt).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Install Nugget' })).not.toBeInTheDocument());
  });

  it('hides an available install button when the app is installed', () => {
    render(
      <InstallAppProvider>
        <InstallAppButton />
      </InstallAppProvider>,
    );
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'dismissed' as const }),
    }) as BeforeInstallPromptEvent;

    act(() => {
      window.dispatchEvent(event);
    });
    expect(screen.getByRole('button', { name: 'Install Nugget' })).toBeInTheDocument();

    act(() => {
      fireEvent(window, new Event('appinstalled'));
    });

    expect(screen.queryByRole('button', { name: 'Install Nugget' })).not.toBeInTheDocument();
  });
});
