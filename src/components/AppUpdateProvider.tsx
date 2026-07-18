'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type AppUpdateStatus = 'idle' | 'checking' | 'ready' | 'updating' | 'error';
export type UpdateCheckResult = 'ready' | 'up-to-date' | 'error';

export interface AppUpdateContextValue {
  releaseId: string;
  status: AppUpdateStatus;
  updateReady: boolean;
  captureLocked: boolean;
  updateMessage?: string;
  setCaptureLocked: (locked: boolean) => void;
  checkForUpdates: () => Promise<UpdateCheckResult>;
  applyUpdate: () => Promise<void>;
}

const defaultContext: AppUpdateContextValue = {
  releaseId: process.env.NEXT_PUBLIC_NUGGET_RELEASE ?? 'local-development',
  status: 'idle',
  updateReady: false,
  captureLocked: false,
  setCaptureLocked: () => undefined,
  checkForUpdates: async () => 'up-to-date',
  applyUpdate: async () => undefined,
};

const AppUpdateContext = createContext<AppUpdateContextValue>(defaultContext);

export interface AppUpdateProviderProps {
  children: ReactNode;
  reloadPage?: () => void;
  activationTimeoutMs?: number;
}

function reloadCurrentPage() {
  globalThis.location.reload();
}

export function AppUpdateProvider({
  children,
  reloadPage = reloadCurrentPage,
  activationTimeoutMs = 10_000,
}: AppUpdateProviderProps) {
  const [status, setStatus] = useState<AppUpdateStatus>('idle');
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [captureLocked, setCaptureLockedState] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string>();
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);
  const captureLockedRef = useRef(false);
  const checkPromiseRef = useRef<Promise<UpdateCheckResult> | null>(null);
  const activationTimerRef = useRef<number | undefined>(undefined);
  const activationRequestedRef = useRef(false);
  const reloadStartedRef = useRef(false);

  const markWaiting = useCallback((worker: ServiceWorker | null) => {
    if (!worker || !navigator.serviceWorker.controller) return false;
    waitingWorkerRef.current = worker;
    setWaitingWorker(worker);
    setStatus('ready');
    setUpdateMessage('New version ready.');
    return true;
  }, []);

  const checkForUpdates = useCallback(async (): Promise<UpdateCheckResult> => {
    if (checkPromiseRef.current) return checkPromiseRef.current;
    const registration = registrationRef.current;
    if (!registration) {
      setStatus('error');
      setUpdateMessage('Nugget could not check for updates. Check your connection and try again.');
      return 'error';
    }

    if (!waitingWorkerRef.current) {
      setStatus('checking');
      setUpdateMessage(undefined);
    }

    const run = (async (): Promise<UpdateCheckResult> => {
      try {
        await registration.update();
        if (markWaiting(registration.waiting ?? waitingWorkerRef.current)) return 'ready';
        setStatus('idle');
        setUpdateMessage(undefined);
        return 'up-to-date';
      } catch {
        if (waitingWorkerRef.current) {
          setStatus('ready');
          return 'ready';
        }
        setStatus('error');
        setUpdateMessage('Nugget could not check for updates. Check your connection and try again.');
        return 'error';
      }
    })();

    checkPromiseRef.current = run;
    void run.finally(() => {
      if (checkPromiseRef.current === run) checkPromiseRef.current = null;
    });
    return run;
  }, [markWaiting]);

  const setCaptureLocked = useCallback((locked: boolean) => {
    captureLockedRef.current = locked;
    setCaptureLockedState(locked);
    if (!locked && waitingWorkerRef.current && !activationRequestedRef.current) {
      setStatus('ready');
      setUpdateMessage('New version ready.');
    }
  }, []);

  const applyUpdate = useCallback(async () => {
    if (captureLockedRef.current) return;
    let worker = waitingWorkerRef.current;
    if (!worker) {
      await checkForUpdates();
      worker = waitingWorkerRef.current;
    }
    if (!worker) {
      setStatus('error');
      setUpdateMessage('The update is not ready yet. Check for updates and try again.');
      return;
    }

    activationRequestedRef.current = true;
    reloadStartedRef.current = false;
    setStatus('updating');
    setUpdateMessage('Updating Nugget…');
    try {
      worker.postMessage({ type: 'SKIP_WAITING' });
      if (activationTimerRef.current) window.clearTimeout(activationTimerRef.current);
      activationTimerRef.current = window.setTimeout(() => {
        activationRequestedRef.current = false;
        setStatus('error');
        setUpdateMessage('The update did not finish. Keep using Nugget or try the update again.');
      }, activationTimeoutMs);
    } catch {
      activationRequestedRef.current = false;
      setStatus('error');
      setUpdateMessage('The update did not finish. Keep using Nugget or try the update again.');
    }
  }, [activationTimeoutMs, checkForUpdates]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    const serviceWorkers = navigator.serviceWorker;
    let active = true;
    let registration: ServiceWorkerRegistration | null = null;
    let installingWorker: ServiceWorker | null = null;

    const onInstallingStateChange = () => {
      if (installingWorker?.state === 'installed') markWaiting(registration?.waiting ?? installingWorker);
    };
    const watchInstalling = () => {
      installingWorker?.removeEventListener('statechange', onInstallingStateChange);
      installingWorker = registration?.installing ?? null;
      installingWorker?.addEventListener('statechange', onInstallingStateChange);
    };
    const onUpdateFound = () => watchInstalling();
    const requestCheck = () => { void checkForUpdates(); };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') requestCheck();
    };
    const onControllerChange = () => {
      if (!activationRequestedRef.current || reloadStartedRef.current) return;
      reloadStartedRef.current = true;
      activationRequestedRef.current = false;
      if (activationTimerRef.current) window.clearTimeout(activationTimerRef.current);
      reloadPage();
    };

    serviceWorkers.addEventListener('controllerchange', onControllerChange);
    window.addEventListener('focus', requestCheck);
    window.addEventListener('online', requestCheck);
    document.addEventListener('visibilitychange', onVisibilityChange);

    void serviceWorkers.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then((nextRegistration) => {
        if (!active) return;
        registration = nextRegistration;
        registrationRef.current = nextRegistration;
        registration.addEventListener('updatefound', onUpdateFound);
        watchInstalling();
        markWaiting(registration.waiting);
        requestCheck();
      })
      .catch(() => {
        if (!active) return;
        setStatus('error');
        setUpdateMessage('Nugget could not check for updates. Check your connection and try again.');
      });

    return () => {
      active = false;
      registration?.removeEventListener('updatefound', onUpdateFound);
      installingWorker?.removeEventListener('statechange', onInstallingStateChange);
      serviceWorkers.removeEventListener('controllerchange', onControllerChange);
      window.removeEventListener('focus', requestCheck);
      window.removeEventListener('online', requestCheck);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (activationTimerRef.current) window.clearTimeout(activationTimerRef.current);
    };
  }, [checkForUpdates, markWaiting, reloadPage]);

  const value = useMemo<AppUpdateContextValue>(() => ({
    releaseId: process.env.NEXT_PUBLIC_NUGGET_RELEASE ?? 'local-development',
    status,
    updateReady: Boolean(waitingWorker),
    captureLocked,
    updateMessage,
    setCaptureLocked,
    checkForUpdates,
    applyUpdate,
  }), [applyUpdate, captureLocked, checkForUpdates, setCaptureLocked, status, updateMessage, waitingWorker]);

  return <AppUpdateContext.Provider value={value}>{children}</AppUpdateContext.Provider>;
}

export function useAppUpdate() {
  return useContext(AppUpdateContext);
}
