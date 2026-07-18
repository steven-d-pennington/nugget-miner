'use client';

import { useState } from 'react';
import { exportLocalData } from '@/lib/export/exportLocalData';
import { NuggetMark } from './NuggetMark';
import { useAppUpdate } from './AppUpdateProvider';

type ExportStatus = 'idle' | 'exporting' | 'created' | 'error';

export function AppUpdatePrompt() {
  const { applyUpdate, captureLocked, status, updateMessage, updateReady } = useAppUpdate();
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');

  if (!updateReady || captureLocked) return null;

  async function createExport() {
    setExportStatus('exporting');
    try {
      await exportLocalData();
      setExportStatus('created');
    } catch {
      setExportStatus('error');
    }
  }

  const updating = status === 'updating';
  const exporting = exportStatus === 'exporting';

  return (
    <aside aria-labelledby="app-update-title" className="app-update" role="region">
      <div className="app-update__mark"><NuggetMark size={24} /></div>
      <div className="app-update__content">
        <h2 id="app-update-title">New version ready</h2>
        <p>Update Nugget when you’re ready. You can export a copy of your local data first.</p>
        {exportStatus === 'created' ? (
          <p aria-live="polite" className="app-update__success">Export created. Your data remains in Nugget.</p>
        ) : null}
        {exportStatus === 'error' ? (
          <p className="app-update__error" role="alert">The export could not be created. Your data remains in Nugget.</p>
        ) : null}
        {status === 'error' && updateMessage ? <p className="app-update__error" role="alert">{updateMessage}</p> : null}
        <div className="app-update__actions">
          <button className="button-primary" disabled={updating || exporting} onClick={() => void applyUpdate()} type="button">
            {updating ? 'Updating Nugget…' : 'Update now'}
          </button>
          <button className="button-quiet" disabled={updating || exporting} onClick={() => void createExport()} type="button">
            {exporting ? 'Creating export…' : exportStatus === 'error' ? 'Try export again' : 'Export data'}
          </button>
        </div>
      </div>
    </aside>
  );
}
