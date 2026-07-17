import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from './AppShell';

const resumePending = vi.fn<() => Promise<void>>();
let pathname = '/';

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}));

vi.mock('@/lib/services/ProcessingService', () => ({
  ProcessingService: {
    resumePending: () => resumePending(),
  },
}));

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

beforeEach(() => {
  pathname = '/';
  resumePending.mockReset();
  resumePending.mockResolvedValue();
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: 'hidden',
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AppShell', () => {
  it('renders three primary tabs, the active route, and settings access', async () => {
    pathname = '/ideas';
    render(<AppShell title="Ideas">Library content</AppShell>);

    const primaryNavigation = screen.getByRole('navigation', { name: 'Primary' });
    const tabs = Array.from(primaryNavigation.querySelectorAll('a'));

    expect(tabs).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Capture' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Ideas' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Actions' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Open settings' })).toHaveAttribute('href', '/settings');
    expect(await screen.findByText('Library content')).toBeInTheDocument();
  });

  it('can hide navigation and expose a back link', () => {
    render(
      <AppShell backHref="/ideas" showNavigation={false} title="Settings">
        Settings content
      </AppShell>,
    );

    expect(screen.queryByRole('navigation', { name: 'Primary' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/ideas');
  });

  it('can hide all interactive chrome while capture work is locked', () => {
    render(
      <AppShell showHeader={false} showNavigation={false}>
        Requesting microphone access…
      </AppShell>,
    );

    expect(screen.queryByRole('link', { name: 'Nugget home' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Open settings' })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Primary' })).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Requesting microphone access…');
  });

  it('resumes pending work on mount, online, and visibility returning to visible', async () => {
    render(<AppShell>Capture</AppShell>);
    await waitFor(() => expect(resumePending).toHaveBeenCalledTimes(1));

    window.dispatchEvent(new Event('online'));
    await waitFor(() => expect(resumePending).toHaveBeenCalledTimes(2));

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));
    await waitFor(() => expect(resumePending).toHaveBeenCalledTimes(3));
  });

  it('does not overlap resumes and removes listeners on unmount', async () => {
    const firstRun = deferred();
    resumePending.mockReturnValueOnce(firstRun.promise);
    const { unmount } = render(<AppShell>Capture</AppShell>);

    await waitFor(() => expect(resumePending).toHaveBeenCalledTimes(1));
    window.dispatchEvent(new Event('online'));
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(resumePending).toHaveBeenCalledTimes(1);

    await act(async () => {
      firstRun.resolve();
      await firstRun.promise;
    });
    window.dispatchEvent(new Event('online'));
    await waitFor(() => expect(resumePending).toHaveBeenCalledTimes(2));

    unmount();
    window.dispatchEvent(new Event('online'));
    document.dispatchEvent(new Event('visibilitychange'));
    expect(resumePending).toHaveBeenCalledTimes(2);
  });

  it('contains queue failures because capture state owns their presentation', async () => {
    resumePending.mockRejectedValueOnce(new Error('offline'));
    render(<AppShell>Capture</AppShell>);

    await waitFor(() => expect(resumePending).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('main')).toHaveTextContent('Capture');
  });
});
