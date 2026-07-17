'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: 'Capture', icon: 'capture' },
  { href: '/ideas', label: 'Ideas', icon: 'ideas' },
  { href: '/actions', label: 'Actions', icon: 'actions' },
] as const;

function isActive(pathname: string, href: (typeof tabs)[number]['href']) {
  return href === '/' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function TabIcon({ icon }: { icon: (typeof tabs)[number]['icon'] }) {
  if (icon === 'capture') {
    return (
      <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
        <rect height="11" rx="4" stroke="currentColor" strokeWidth="1.7" width="7" x="8.5" y="2.5" />
        <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5M8.5 21.5h7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      </svg>
    );
  }

  if (icon === 'ideas') {
    return (
      <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
        <path d="M9 18h6M9.75 21h4.5M8.2 15.4a7 7 0 1 1 7.6 0c-.55.36-.8.75-.8 1.1H9c0-.35-.25-.74-.8-1.1Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
        <path d="m10.2 10.3 1.2 1.2 2.6-3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <rect height="17" rx="2" stroke="currentColor" strokeWidth="1.7" width="17" x="3.5" y="3.5" />
      <path d="m8 12 2.6 2.6L16.5 9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="bottom-nav">
      <ul className="bottom-nav__list">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <li key={tab.href}>
              <Link
                aria-current={active ? 'page' : undefined}
                className="bottom-nav__link"
                href={tab.href}
              >
                <TabIcon icon={tab.icon} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
