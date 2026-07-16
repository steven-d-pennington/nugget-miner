import Link from 'next/link';
import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { NuggetMark } from './NuggetMark';
import { ProcessingQueueRunner } from './ProcessingQueueRunner';

export interface AppShellProps {
  title?: string;
  backHref?: string;
  children: ReactNode;
  showHeader?: boolean;
  showNavigation?: boolean;
}

function BackIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22">
      <path d="m15 18-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22">
      <path d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M19.1 13.3a7.7 7.7 0 0 0 0-2.6l1.65-1.28-1.8-3.12-1.94.79a7.5 7.5 0 0 0-2.25-1.3L14.48 3.7h-3.6l-.29 2.09a7.5 7.5 0 0 0-2.24 1.3L6.4 6.3 4.6 9.42l1.65 1.28a7.7 7.7 0 0 0 0 2.6L4.6 14.58l1.8 3.12 1.95-.79a7.5 7.5 0 0 0 2.24 1.3l.29 2.09h3.6l.28-2.09a7.5 7.5 0 0 0 2.25-1.3l1.94.79 1.8-3.12-1.65-1.28Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

export function AppShell({
  title,
  backHref,
  children,
  showHeader = true,
  showNavigation = true,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <ProcessingQueueRunner />
      {showHeader ? <header className="app-shell__header">
        <div className="app-shell__header-inner">
          {backHref ? (
            <Link aria-label="Back" className="app-shell__icon-link" href={backHref}>
              <BackIcon />
            </Link>
          ) : (
            <span aria-hidden="true" className="app-shell__header-spacer" />
          )}

          <Link aria-label="Nugget home" className="app-shell__brand" href="/">
            <NuggetMark size={22} />
            <span className="app-shell__brand-name wordmark">Nugget</span>
            {title ? <span className="app-shell__page-title">{title}</span> : null}
          </Link>

          <Link aria-label="Open settings" className="app-shell__icon-link" href="/settings">
            <SettingsIcon />
          </Link>
        </div>
      </header> : null}

      <main className="app-shell__main">{children}</main>
      {showNavigation ? <BottomNav /> : null}
    </div>
  );
}
