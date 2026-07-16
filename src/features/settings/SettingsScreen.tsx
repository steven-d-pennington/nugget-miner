'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { InstallAppButton } from '@/components/InstallAppButton';
import { downloadText } from '@/lib/export/download';
import { buildFullExport } from '@/lib/export/fullExport';
import { ORGANIZATION_PROMPT_VERSION } from '@/lib/llm/organizationPrompt';
import { SEGMENTATION_PROMPT_VERSION } from '@/lib/llm/segmentationPrompt';
import { DataManagementService } from '@/lib/services/DataManagementService';
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
}

async function loadSettingsRepository() {
  return (await import('@/lib/repositories')).settingsRepository;
}

export function SettingsScreen({ navigateToCapture = () => globalThis.location.assign('/') }: SettingsScreenProps = {}) {
  const [settings, setSettings] = useState<AppSettings>();
  const [health, setHealth] = useState<PublicHealth>();
  const [healthUnavailable, setHealthUnavailable] = useState(false);
  const [consentPrompt, setConsentPrompt] = useState(false);
  const [eraseText, setEraseText] = useState('');
  const [eraseArmed, setEraseArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    loadSettingsRepository()
      .then((repository) => repository.get())
      .then((value) => active && setSettings(value))
      .catch(() => active && setError('Settings could not be loaded.'));
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
    setError('');
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
    } catch {
      setError('Automatic organization could not be updated.');
    }
  }

  async function grantConsent() {
    try {
      await persist({ cloudProcessingConsent: 'granted', automaticProcessing: true });
      setConsentPrompt(false);
      setMessage('Cloud processing consent granted and automatic organization enabled.');
    } catch {
      setError('Cloud processing consent could not be updated.');
    }
  }

  async function revokeConsent() {
    try {
      await persist({ cloudProcessingConsent: 'denied', automaticProcessing: false });
      setMessage('Cloud processing consent revoked. Saved local data was not deleted.');
    } catch {
      setError('Cloud processing consent could not be revoked.');
    }
  }

  async function exportAll() {
    setBusy(true);
    setError('');
    try {
      const data = await buildFullExport();
      downloadText(`nugget-full-export-${data.exportedAt.slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json');
      setMessage('Your local Nugget export was downloaded.');
    } catch {
      setError('Your local data could not be exported. No data was changed.');
    } finally {
      setBusy(false);
    }
  }

  async function eraseAll() {
    setBusy(true);
    setError('');
    try {
      await DataManagementService.deleteAll();
      setMessage('All local Nugget data was erased.');
      globalThis.setTimeout(navigateToCapture, 300);
    } catch {
      setError('Erase failed. Some local data may still be present. Stay in Settings and try again.');
      setBusy(false);
    }
  }

  const consentLabel = settings?.cloudProcessingConsent ?? 'unknown';

  return (
    <section className="mx-auto grid max-w-3xl gap-8" aria-labelledby="settings-heading">
      <header>
        <p className="m-0 text-xs font-extrabold uppercase tracking-[0.14em] text-[#A66700]">Preferences and trust</p>
        <h1 className="mb-0 mt-2 text-4xl font-bold tracking-[-0.05em] text-[#101D36] sm:text-5xl" id="settings-heading">Settings</h1>
        <p className="mb-0 mt-4 max-w-2xl leading-7 text-[#6E6B67]">Shape how Nugget organizes your thoughts and review how local data and cloud processing work.</p>
      </header>

      {message ? <p className="m-0 border-l-4 border-[#247A55] bg-white p-4 text-[#101D36]" role="alert">{message}</p> : null}
      {error ? <p role="alert" className="m-0 border-l-4 border-red-700 bg-red-50 p-4 text-red-800">{error}</p> : null}

      <div className="grid border-b border-[#E8DDCE]">
        <section className="border-t border-[#E8DDCE] py-6" aria-labelledby="category-organization-heading">
          <p className="m-0 text-xs font-extrabold uppercase tracking-[0.12em] text-[#A66700]">Your vocabulary</p>
          <h2 className="mb-0 mt-2 text-xl font-bold text-[#101D36]" id="category-organization-heading">Category organization</h2>
          <p className="mb-0 mt-2 leading-6 text-[#6E6B67]">Give GPT-5.6 examples and boundaries for the themes that matter to you.</p>
          <Link className="mt-4 inline-flex min-h-12 items-center font-extrabold text-[#101D36] underline decoration-[#E5A11A] decoration-2 underline-offset-4" href="/settings/categories">Manage categories</Link>
        </section>

        <section className="border-t border-[#E8DDCE] py-6" aria-labelledby="processing-privacy-heading">
          <h2 className="m-0 text-xl font-bold text-[#101D36]" id="processing-privacy-heading">Processing and privacy</h2>
          <label className="mt-4 flex min-h-12 cursor-pointer items-center gap-3 font-bold text-[#101D36]">
            <input checked={settings?.automaticProcessing ?? false} disabled={!settings} onChange={(event) => void toggleAutomatic(event.target.checked)} type="checkbox" />
            Automatic organization
          </label>
          <p className="mb-0 mt-2 leading-6 text-[#6E6B67]">When processing runs, audio is sent securely for transcription and transcript text is sent securely for GPT-5.6 organization. Nugget does not cloud-sync your saved recordings or ideas.</p>
          <p className="mb-0 mt-2 leading-6 text-[#6E6B67]">Recordings remain in this browser until you delete the capture or erase all local data.</p>
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

        <section className="border-t border-[#E8DDCE] py-6" aria-labelledby="data-export-heading">
          <h2 className="m-0 text-xl font-bold text-[#101D36]" id="data-export-heading">Data export</h2>
          <p className="mb-0 mt-2 leading-6 text-[#6E6B67]">Download your captures, recordings, transcripts, ideas, organization, and settings as JSON. The export is built locally in this browser.</p>
          <button className="mt-4 min-h-12 rounded-full border border-[#E5A11A] px-5 font-extrabold text-[#101D36]" disabled={busy} onClick={() => void exportAll()} type="button">Export all local data</button>
        </section>

        <section className="border-t border-[#E8DDCE] py-6" aria-labelledby="erase-heading">
          <h2 className="m-0 text-xl font-bold text-red-800" id="erase-heading">Erase all local data</h2>
          <p className="mb-0 mt-2 leading-6 text-[#6E6B67]">This permanently removes every local capture, recording, transcript, idea, action, tag, and custom category from this browser.</p>
          <label className="mt-4 grid gap-2 font-bold text-[#101D36]" htmlFor="erase-confirmation">Type ERASE exactly to continue</label>
          <input className="mt-2 min-h-12 w-full border border-[#C9BBA9] bg-white px-3 text-[#101D36]" id="erase-confirmation" onChange={(event) => { setEraseText(event.target.value); setEraseArmed(false); }} value={eraseText} />
          {!eraseArmed ? <button className="mt-3 min-h-12 rounded-full border border-red-700 px-5 font-extrabold text-red-800 disabled:opacity-50" disabled={eraseText !== 'ERASE'} onClick={() => setEraseArmed(true)} type="button">Continue to erase</button> : (
            <div className="mt-4 border border-red-300 bg-red-50 p-4">
              <p className="m-0 font-bold text-red-900">This is the final confirmation. This action cannot be undone.</p>
              <button className="mt-3 min-h-12 rounded-full bg-red-800 px-5 font-extrabold text-white" disabled={busy} onClick={() => void eraseAll()} type="button">Erase all local data now</button>
            </div>
          )}
        </section>

        <section className="border-t border-[#E8DDCE] py-6" aria-labelledby="about-heading">
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
