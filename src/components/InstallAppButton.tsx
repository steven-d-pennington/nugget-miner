'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallAppContextValue {
  install: () => Promise<void>;
  installPrompt?: BeforeInstallPromptEvent;
  showIosGuidance: boolean;
}

const InstallAppContext = createContext<InstallAppContextValue | null>(null);

function isStandalone() {
  const displayModeStandalone = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  const navigatorStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return displayModeStandalone || navigatorStandalone;
}

function isIosDevice() {
  const userAgent = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function InstallAppProvider({ children }: { children: ReactNode }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent>();
  const [showIosGuidance, setShowIosGuidance] = useState(false);

  useEffect(() => {
    const syncIosGuidance = () => setShowIosGuidance(isIosDevice() && !isStandalone());
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setShowIosGuidance(false);
    };
    const onInstalled = () => {
      setInstallPrompt(undefined);
      setShowIosGuidance(false);
    };

    syncIosGuidance();
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function install() {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') setInstallPrompt(undefined);
    } catch {
      // The browser controls this prompt. Keep Nugget usable when it fails.
    }
  }

  return (
    <InstallAppContext.Provider value={{ install, installPrompt, showIosGuidance }}>
      {children}
    </InstallAppContext.Provider>
  );
}

export function InstallAppButton() {
  const installState = useContext(InstallAppContext);

  if (!installState || (!installState.installPrompt && !installState.showIosGuidance)) return null;

  return (
    <section aria-labelledby="install-app-heading" className="install-app">
      <div className="install-app__card">
        <p className="install-app__eyebrow">Keep Nugget close</p>
        <h2 id="install-app-heading">Install Nugget</h2>
        {installState.installPrompt ? (
          <>
            <p id="install-app-description">Add Nugget to your home screen for a focused, app-like capture space.</p>
            <button aria-describedby="install-app-description" className="button-primary" onClick={() => void installState.install()} type="button">Install Nugget</button>
          </>
        ) : (
          <p>On this iPhone or iPad, choose Share, then Add to Home Screen.</p>
        )}
      </div>
    </section>
  );
}
