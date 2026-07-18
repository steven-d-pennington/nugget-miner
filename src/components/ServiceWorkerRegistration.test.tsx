import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InstallAppButton, InstallAppProvider } from './InstallAppButton';
import { buildServiceWorkerSource } from '@/lib/pwa/serviceWorkerSource';
import { ServiceWorkerRegistration } from './ServiceWorkerRegistration';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function mockServiceWorker() {
  const register = vi.fn().mockResolvedValue({});
  const testNavigator = Object.create(navigator) as Navigator;
  Object.defineProperty(testNavigator, 'serviceWorker', {
    configurable: true,
    enumerable: true,
    value: { register },
  });
  vi.stubGlobal('navigator', testNavigator);
  return register;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('ServiceWorkerRegistration', () => {
  it('does not register a service worker outside production', () => {
    const register = mockServiceWorker();
    vi.stubEnv('NODE_ENV', 'development');

    render(<ServiceWorkerRegistration />);

    expect(register).not.toHaveBeenCalled();
  });

  it('registers the application service worker once in production', async () => {
    const register = mockServiceWorker();
    vi.stubEnv('NODE_ENV', 'production');

    render(<ServiceWorkerRegistration />);

    await waitFor(() => expect(register).toHaveBeenCalledWith('/sw.js'));
    expect(register).toHaveBeenCalledTimes(1);
  });

  it('pre-caches only the application shell and excludes API responses', () => {
    const source = buildServiceWorkerSource('test-release');
    const shell = source.match(/const SHELL = \[([\s\S]*?)\];/)?.[1] ?? '';

    expect(shell).not.toContain('/api/');
    expect(shell).not.toMatch(/audio|transcript|export/i);
    expect(source).toContain("request.method !== 'GET'");
    expect(source).toContain('url.origin !== self.location.origin');
    expect(source).toContain("url.pathname.startsWith('/api/')");
    expect(source).toContain('if (response.ok)');
    expect(source).toContain('.catch(() => undefined)');
  });
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
