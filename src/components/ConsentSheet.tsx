'use client';

export interface ConsentSheetProps {
  open: boolean;
  dataLabel: string;
  providerLabel: string;
  purpose: string;
  busy?: boolean;
  onCancel(): void;
  onConfirm(): void;
}

export function ConsentSheet({ open, dataLabel, providerLabel, purpose, busy = false, onCancel, onConfirm }: ConsentSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" role="presentation">
      <section
        aria-labelledby="consent-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-[var(--radius)] border border-white/15 bg-surface p-6 shadow-2xl"
        role="dialog"
      >
        <p className="mb-2 inline-flex rounded-full border border-accent/40 px-3 py-1 text-sm text-accent">Cloud processing consent</p>
        <h2 id="consent-title" className="text-2xl font-semibold">Send for cloud processing?</h2>
        <div className="mt-4 space-y-3 text-muted">
          <p>
            Nugget will send this <strong className="text-text">{dataLabel}</strong> to{' '}
            <strong className="text-text">{providerLabel}</strong> to {purpose}.
          </p>
          <p>Cancel sends nothing. The result returned by the provider is stored only in this browser&apos;s local IndexedDB.</p>
          <p>Nugget does not put provider keys in the browser and does not persist request payloads on server routes.</p>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button className="rounded-full border border-white/20 px-5 py-3 font-semibold disabled:opacity-50" disabled={busy} onClick={onCancel} type="button">
            Cancel
          </button>
          <button className="rounded-full bg-accent px-5 py-3 font-semibold text-black disabled:opacity-50" disabled={busy} onClick={onConfirm} type="button">
            {busy ? 'Sending…' : 'Send for processing'}
          </button>
        </div>
      </section>
    </div>
  );
}
