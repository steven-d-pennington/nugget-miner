'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { InstallAppButton } from '@/components/InstallAppButton';
import { DemoDataService } from '@/lib/demo/DemoDataService';
import { exportLocalData } from '@/lib/export/exportLocalData';
import { ORGANIZATION_PROMPT_VERSION } from '@/lib/llm/organizationPrompt';
import { SEGMENTATION_PROMPT_VERSION } from '@/lib/llm/segmentationPrompt';
import { DataManagementService } from '@/lib/services/DataManagementService';
import { requestPersistentStorage, storageHealth, type StorageHealth } from '@/lib/storage/storageHealth';
import { userErrorMessage, type UserErrorMessage } from '@/lib/userErrorMessage';
import { ORGANIZATION_SCHEMA_VERSION } from '@/lib/validation/organizationResult';
import { SEGMENTATION_SCHEMA_VERSION } from '@/lib/validation/segmentationResult';
import type { AppSettings } from '@/types';

interface PublicHealth {
  transcription: { available: boolean; model: string };
  organization: { available: boolean; model: string };
}

function parseHealth(value: unknown): PublicHealth | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  const readProvider = (entry: unknown) => {
    if (!entry || typeof entry !== 'object') return undefined;
    const provider = entry as Record<string, unknown>;
    return typeof provider.available === 'boolean' && typeof provider.model === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/.test(provider.model)
      ? { available: provider.available, model: provider.model }
      : undefined;
  };
  const transcription = readProvider(record.transcription);
  const organization = readProvider(record.organization);
  return transcription && organization ? { transcription, organization } : undefined;
}

interface SettingsScreenProps {
  navigateToCapture?: () => void;
  navigateToIdeas?: () => void;
}

interface SettingsError {
  message: UserErrorMessage;
  retry?: () => void;
}

async function loadSettingsRepository() {
  return (await import('@/lib/repositories')).settingsRepository;
}

export function SettingsScreen({
  navigateToCapture = () => globalThis.location.assign('/'),
  navigateToIdeas = () => globalThis.location.assign('/ideas'),
}: SettingsScreenProps = {}) {
  const [settings, setSettings] = useState<AppSettings>();
  const [health, setHealth] = useState<PublicHealth>();
  const [healthUnavailable, setHealthUnavailable] = useState(false);
  const [consentPrompt, setConsentPrompt] = useState(false);
  const [eraseText, setEraseText] = useState('');
  const [eraseArmed, setEraseArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [storage, setStorage] = useState<StorageHealth>();
  const [storageBusy, setStorageBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<SettingsError>();

  function showError(cause: unknown, retry?: () => void) {
    setMessage(undefined);
    setError({ message: userErrorMessage(cause), retry });
  }

  async function refreshSettings() {
    try {
      setSettings(await (await loadSettingsRepository()).get());
    } catch (cause) {
      showError(cause, () => void refreshSettings());
    }
  }

  async function refreshStorageHealth() {
    try {
      setStorage(await storageHealth());
    } catch (cause) {
      showError(cause, () => void refreshStorageHealth());
    }
  }

  useEffect(() => {
    let active = true;
    void refreshSettings();
    void refreshStorageHealth();
    fetch('/api/health')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Health unavailable')))
      .then((value) => {
        if (!active) return;
        const parsed = parseHealth(value);
        if (parsed) setHealth(parsed);
        else setHealthUnavailable(true);
      })
      .catch(() => active && setHealthUnavailable(true));
    return () => { active = false; };
  }, []);

  async function persist(patch: { automaticProcessing?: boolean; cloudProcessingConsent?: AppSettings['cloudProcessingConsent'] }) {
    setError(undefined);
    const updated = await (await loadSettingsRepository()).update(patch);
    setSettings(updated);
    return updated;
  }

  async function toggleAutomatic(enabled: boolean) {
    if (enabled && settings?.cloudProcessingConsent !== 'granted') {
      setConsentPrompt(true);
      return;
    }
    try {
      await persist({ automaticProcessing: enabled });
    } catch (cause) {
      showError(cause, () => void toggleAutomatic(enabled));
    }
  }

  async function grantConsent() {
    try {
      await persist({ cloudProcessingConsent: 'granted', automaticProcessing: true });
      setConsentPrompt(false);
      setMessage('Cloud processing consent granted and automatic organization enabled.');
    } catch (cause) {
      showError(cause, () => void grantConsent());
    }
  }

  async function revokeConsent() {
    try {
      await persist({ cloudProcessingConsent: 'denied', automaticProcessing: false });
      setMessage('Cloud processing consent revoked. Saved local data was not deleted.');
    } catch (cause) {
      showError(cause, () => void revokeConsent());
    }
  }

  async function exportAll() {
    setBusy(true);
    setError(undefined);
    try {
      await exportLocalData();
      setMessage('Your local Nugget export was downloaded.');
    } catch (cause) {
      showError(cause, () => void exportAll());
    } finally {
      setBusy(false);
    }
  }

  async function loadSampleLibrary() {
    setBusy(true);
    setSampleLoading(true);
    setError(undefined);
    try {
      const result = await DemoDataService.seed();
      setMessage(result.created ? 'Sample ideas added' : 'Sample ideas are already loaded');
      globalThis.setTimeout(navigateToIdeas, 300);
    } catch (cause) {
      showError(cause, () => void loadSampleLibrary());
    } finally {
      setSampleLoading(false);
      setBusy(false);
    }
  }

  async function eraseAll() {
    setBusy(true);
    setError(undefined);
    try {
      await DataManagementService.deleteAll();
      setMessage('All local Nugget data was erased.');
      globalThis.setTimeout(navigateToCapture, 300);
    } catch (cause) {
      showError(cause, () => void eraseAll());
      setBusy(false);
    }
  }

  async function improveOfflineStorage() {
    setStorageBusy(true);
    setError(undefined);
    try {
      const persisted = await requestPersistentStorage();
      await refreshStorageHealth();
      setMessage(
        persisted
          ? 'This browser granted persistent offline storage for Nugget.'
          : 'This browser did not grant persistent storage. Your existing local data remains in this browser.',
      );
    } catch (cause) {
      showError(cause, () => void improveOfflineStorage());
    } finally {
      setStorageBusy(false);
    }
  }

  const consentLabel = settings?.cloudProcessingConsent ?? 'unknown';

  return (
    <section className="mx-auto grid max-w-3xl gap-8" aria-labelledby="settings-heading">
      <header className="screen-heading">
        <p className="screen-heading__eyebrow">Preferences and trust</p>
        <h1 className="screen-heading__title" id="settings-heading">Settings</h1>
        <p className="screen-heading__lede">Shape how Nugget organizes your thoughts and review how local data and cloud processing work.</p>
      </header>

      {message ? <p aria-live="polite" className="m-0 border-l-4 border-[#247A55] bg-white p-4 text-[#101D36]">{message}</p> : null}
      {error ? (
        <div className="m-0 border-l-4 border-red-700 bg-red-50 p-4 text-red-800" role="alert">
          <strong>{error.message.title}</strong>
          <p>{error.message.detail}</p>
          {error.retry && error.message.actionLabel ? <button className="button-quiet" onClick={error.retry} type="button">{error.message.actionLabel}</button> : null}
        </div>
      ) : null}

      <div className="grid border-b border-[#E8DDCE]">
        <section className="utility-section" aria-labelledby="category-organization-heading">
          <p className="m-0 text-xs font-extrabold uppercase tracking-[0.12em] text-[#A66700]">Your vocabulary</p>
          <h2 className="mb-0 mt-2 text-xl font-bold text-[#101D36]" id="category-organization-heading">Category organization</h2>
          <p className="mb-0 mt-2 leading-6 text-[#6E6B67]">Give GPT-5.6 examples and boundaries for the themes that matter to you.</p>
          <Link className="mt-4 inline-flex min-h-12 items-center font-extrabold text-[#101D36] underline decoration-[#E5A11A] decoration-2 underline-offset-4" href="/settings/categories">Manage categories</Link>
        </section>

        <section className="utility-section" aria-labelledby="processing-privacy-heading">
          <h2 className="m-0 text-xl font-bold text-[#101D36]" id="processing-privacy-heading">Processing and privacy</h2>
          <label className="mt-4 flex min-h-12 cursor-pointer items-center gap-3 font-bold text-[#101D36]">
            <input checked={settings?.automaticProcessing ?? false} disabled={!settings} onChange={(event) => void toggleAutomatic(event.target.checked)} type="checkbox" />
            Automatic organization
          </label>
          <p className="mb-0 mt-2 leading-6 text-[#6E6B67]">When processing runs, audio is sent securely for transcription and transcript text is sent securely for GPT-5.6 organization. Nugget does not cloud-sync your saved recordings or ideas.</p>
          <p className="mb-0 mt-2 leading-6 text-[#6E6B67]">Recordings remain in this browser until you delete the capture or erase all local data.</p>
          <p className="mb-0 mt-2 leading-6 text-[#6E6B67]">Anonymous page-view analytics go to Vercel. They do not include recordings, transcripts, idea content, or local record identifiers.</p>
          <p className="mb-0 mt-3 text-sm text-[#6E6B67]">Cloud processing consent: <strong className="capitalize text-[#101D36]">{consentLabel}</strong></p>
          {settings?.cloudProcessingConsent === 'granted' ? <button className="mt-3 min-h-12 font-extrabold text-[#101D36] underline decoration-[#E5A11A] decoration-2 underline-offset-4" onClick={() => void revokeConsent()} type="button">Revoke cloud processing consent</button> : null}
          {consentPrompt ? (
            <div aria-labelledby="consent-title" className="mt-5 border border-[#E8DDCE] bg-white p-5" role="dialog">
              <h3 className="m-0 text-lg font-bold text-[#101D36]" id="consent-title">Allow automatic cloud processing?</h3>
              <p className="leading-6 text-[#6E6B67]">Each saved recording may send audio for transcription and its transcript for GPT-5.6 organization. Saved results remain in this browser.</p>
              <div className="flex flex-wrap gap-3">
                <button className="min-h-12 rounded-full bg-[#E5A11A] px-5 font-extrabold text-[#101D36]" onClick={() => void grantConsent()} type="button">Allow and enable</button>
                <button className="min-h-12 px-5 font-extrabold text-[#101D36]" onClick={() => setConsentPrompt(false)} type="button">Not now</button>
              </div>
            </div>
          ) : null}
        </section>

        <InstallAppButton />

        <section className="utility-section" aria-labelledby="offline-storage-heading">
          <h2 className="m-0 text-xl font-bold text-[#101D36]" id="offline-storage-heading">Offline storage</h2>
          <p className="mb-0 mt-2 leading-6 text-[#6E6B67]">{storage ? storage.persisted ? 'This browser has granted persistent storage for Nugget.' : 'Persistent offline storage is not enabled. Nugget stores recordings and saved data locally in this browser.' : 'Checking browser storage availability…'}</p>
          {storage?.usage !== undefined && storage.quota !== undefined ? <p className="mb-0 mt-2 text-sm text-[#6E6B67]">Browser storage in use: {Math.round(storage.usage / 1_024)} KB of {Math.round(storage.quota / 1_024)} KB.</p> : null}
          <button className="mt-4 min-h-12 rounded-full border border-[#E5A11A] px-5 font-extrabold text-[#101D36]" disabled={storageBusy} onClick={() => void improveOfflineStorage()} type="button">
            {storageBusy ? 'Improving offline storage reliability…' : 'Improve offline storage reliability'}
          </button>
        </section>

        <section className="utility-section" aria-labelledby="data-export-heading">
          <h2 className="m-0 text-xl font-bold text-[#101D36]" id="data-export-heading">Data export</h2>
          <p className="mb-0 mt-2 leading-6 text-[#6E6B67]">Download your captures, recordings, transcripts, ideas, organization, and settings as JSON. The export is built locally in this browser.</p>
          <button className="mt-4 min-h-12 rounded-full border border-[#E5A11A] px-5 font-extrabold text-[#101D36]" disabled={busy} onClick={() => void exportAll()} type="button">Export all local data</button>
        </section>

        <section className="utility-section" aria-labelledby="sample-library-heading">
          <p className="m-0 text-xs font-extrabold uppercase tracking-[0.12em] text-[#A66700]">Local demo data</p>
          <h2 className="mb-0 mt-2 text-xl font-bold text-[#101D36]" id="sample-library-heading">Sample library</h2>
          <p className="mb-0 mt-2 leading-6 text-[#6E6B67]">Adds three clearly labeled sample ideas to this browser so you can explore search, categories, actions, and export. It does not call GPT-5.6 and does not replace the live capture demo.</p>
          <button className="mt-4 min-h-12 rounded-full border border-[#E5A11A] px-5 font-extrabold text-[#101D36]" disabled={busy} onClick={() => void loadSampleLibrary()} type="button">
            {sampleLoading ? 'Loading sample library…' : 'Load sample library'}
          </button>
        </section>

        <section className="utility-section danger-zone" aria-labelledby="erase-heading">
          <h2 className="m-0 text-xl font-bold text-red-800" id="erase-heading">Erase all local data</h2>
          <p className="mb-0 mt-2 leading-6 text-[#6E6B67]">This permanently removes every local capture, recording, transcript, idea, action, tag, and custom category from this browser.</p>
          <label className="mt-4 grid gap-2 font-bold text-[#101D36]" htmlFor="erase-confirmation">Type ERASE exactly to continue</label>
          <input className="mt-2 min-h-12 w-full border border-[#C9BBA9] bg-white px-3 text-[#101D36]" id="erase-confirmation" onChange={(event) => { setEraseText(event.target.value); setEraseArmed(false); }} value={eraseText} />
          {!eraseArmed ? <button className="mt-3 min-h-12 rounded-full border border-red-700 px-5 font-extrabold text-red-800 disabled:opacity-50" disabled={eraseText !== 'ERASE'} onClick={() => setEraseArmed(true)} type="button">Continue to erase</button> : (
            <div className="danger-zone">
              <p className="m-0 font-bold text-red-900">This is the final confirmation. This action cannot be undone.</p>
              <button className="mt-3 min-h-12 rounded-full bg-red-800 px-5 font-extrabold text-white" disabled={busy} onClick={() => void eraseAll()} type="button">Erase all local data now</button>
            </div>
          )}
        </section>

        <section className="utility-section" aria-labelledby="about-heading">
          <h2 className="m-0 text-xl font-bold text-[#101D36]" id="about-heading">About</h2>
          <p className="mb-0 mt-2 font-bold text-[#101D36]">Built with GPT-5.6 and Codex</p>
          <dl className="mt-4 grid gap-2 text-sm text-[#6E6B67]">
            <div><dt className="inline font-bold text-[#101D36]">App version: </dt><dd className="inline">{process.env.NEXT_PUBLIC_APP_VERSION ?? 'Hackathon MVP'}</dd></div>
            <div><dt className="inline font-bold text-[#101D36]">Transcription: </dt><dd className="inline">{health ? `${health.transcription.model} (${health.transcription.available ? 'available' : 'unavailable'})` : healthUnavailable ? 'Unavailable' : 'Checking…'}</dd></div>
            <div><dt className="inline font-bold text-[#101D36]">Organization: </dt><dd className="inline">{health ? `${health.organization.model} (${health.organization.available ? 'available' : 'unavailable'})` : healthUnavailable ? 'Unavailable' : 'Checking…'}</dd></div>
            <div><dt className="inline font-bold text-[#101D36]">Prompt versions: </dt><dd className="inline">{SEGMENTATION_PROMPT_VERSION}, {ORGANIZATION_PROMPT_VERSION}</dd></div>
            <div><dt className="inline font-bold text-[#101D36]">Schema versions: </dt><dd className="inline">{SEGMENTATION_SCHEMA_VERSION}, {ORGANIZATION_SCHEMA_VERSION}</dd></div>
          </dl>
        </section>
      </div>
    </section>
  );
}
