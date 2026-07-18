import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppUpdateProvider, useAppUpdate } from './AppUpdateProvider';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => { resolve = nextResolve; });
  return { promise, resolve };
}

function fakeWorker(initialState: ServiceWorkerState = 'installed') {
  const worker = new EventTarget() as ServiceWorker & { state: ServiceWorkerState };
  Object.defineProperty(worker, 'state', { configurable: true, writable: true, value: initialState });
  Object.defineProperty(worker, 'postMessage', { configurable: true, value: vi.fn() });
  return worker;
}

function fakeServiceWorkers(options: {
  controller?: boolean;
  installing?: ServiceWorker;
  waiting?: ServiceWorker;
  update?: () => Promise<void>;
} = {}) {
  const registration = new EventTarget() as ServiceWorkerRegistration;
  const updateMock = vi.fn(options.update ?? (() => Promise.resolve()));
  Object.defineProperties(registration, {
    installing: { configurable: true, value: options.installing ?? null },
    waiting: { configurable: true, value: options.waiting ?? null },
    update: { configurable: true, value: updateMock },
  });

  const container = new EventTarget() as ServiceWorkerContainer & {
    controller: ServiceWorker | null;
    register: ReturnType<typeof vi.fn>;
  };
  container.controller = options.controller === false ? null : fakeWorker('activated');
  container.register = vi.fn().mockResolvedValue(registration);

  const testNavigator = Object.create(navigator) as Navigator;
  Object.defineProperty(testNavigator, 'serviceWorker', { configurable: true, value: container });
  vi.stubGlobal('navigator', testNavigator);
  return { container, registration, updateMock };
}

function Harness() {
  const update = useAppUpdate();
  return (
    <div>
      <span data-testid="status">{update.status}</span>
      <span data-testid="ready">{String(update.updateReady)}</span>
      <span data-testid="locked">{String(update.captureLocked)}</span>
      <button onClick={() => update.setCaptureLocked(!update.captureLocked)} type="button">Toggle lock</button>
      <button onClick={() => void update.applyUpdate()} type="button">Apply update</button>
      <button onClick={() => void update.checkForUpdates()} type="button">Check update</button>
    </div>
  );
}

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'production');
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('AppUpdateProvider', () => {
  it('does not register outside production', () => {
    const { container } = fakeServiceWorkers();
    vi.stubEnv('NODE_ENV', 'development');

    render(<AppUpdateProvider><Harness /></AppUpdateProvider>);

    expect(container.register).not.toHaveBeenCalled();
  });

  it('registers at root and exposes an already-waiting update', async () => {
    const waiting = fakeWorker();
    const { container } = fakeServiceWorkers({ waiting });

    render(<AppUpdateProvider><Harness /></AppUpdateProvider>);

    await waitFor(() => expect(container.register).toHaveBeenCalledWith('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    }));
    await waitFor(() => expect(screen.getByTestId('ready')).toHaveTextContent('true'));
    expect(screen.getByTestId('status')).toHaveTextContent('ready');
  });

  it('does not treat the first installation as an available update', async () => {
    const installing = fakeWorker('installing');
    fakeServiceWorkers({ controller: false, installing });

    render(<AppUpdateProvider><Harness /></AppUpdateProvider>);
    await act(async () => {
      Object.defineProperty(installing, 'state', { configurable: true, writable: true, value: 'installed' });
      installing.dispatchEvent(new Event('statechange'));
    });

    expect(screen.getByTestId('ready')).toHaveTextContent('false');
  });

  it('retains a waiting update while locked and activates it after unlocking', async () => {
    const waiting = fakeWorker();
    fakeServiceWorkers({ waiting });
    render(<AppUpdateProvider><Harness /></AppUpdateProvider>);
    await waitFor(() => expect(screen.getByTestId('ready')).toHaveTextContent('true'));

    fireEvent.click(screen.getByRole('button', { name: 'Toggle lock' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply update' }));
    expect(waiting.postMessage).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Toggle lock' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apply update' }));
    expect(waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });

  it('reloads exactly once when the requested worker takes control', async () => {
    const waiting = fakeWorker();
    const { container } = fakeServiceWorkers({ waiting });
    const reloadPage = vi.fn();
    render(<AppUpdateProvider reloadPage={reloadPage}><Harness /></AppUpdateProvider>);
    await waitFor(() => expect(screen.getByTestId('ready')).toHaveTextContent('true'));

    fireEvent.click(screen.getByRole('button', { name: 'Apply update' }));
    container.dispatchEvent(new Event('controllerchange'));
    container.dispatchEvent(new Event('controllerchange'));

    expect(reloadPage).toHaveBeenCalledTimes(1);
  });

  it('coalesces update checks triggered while one is still running', async () => {
    const updating = deferred<void>();
    const { updateMock } = fakeServiceWorkers({ update: () => updating.promise });
    render(<AppUpdateProvider><Harness /></AppUpdateProvider>);
    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));

    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new Event('online'));
    document.dispatchEvent(new Event('visibilitychange'));
    expect(updateMock).toHaveBeenCalledTimes(1);

    await act(async () => updating.resolve());
    window.dispatchEvent(new Event('focus'));
    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(2));
  });

  it('returns to a retryable error when activation does not complete', async () => {
    vi.useFakeTimers();
    const waiting = fakeWorker();
    fakeServiceWorkers({ waiting });
    render(<AppUpdateProvider activationTimeoutMs={25}><Harness /></AppUpdateProvider>);
    await act(async () => { await Promise.resolve(); });

    fireEvent.click(screen.getByRole('button', { name: 'Apply update' }));
    await act(async () => vi.advanceTimersByTime(25));

    expect(screen.getByTestId('status')).toHaveTextContent('error');
  });
});
