import type { Metadata, Viewport } from 'next';
import { Fraunces, IBM_Plex_Mono, Manrope } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { InstallAppProvider } from '@/components/InstallAppButton';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import './globals.css';

const wordmark = Fraunces({
  subsets: ['latin'],
  variable: '--font-wordmark',
  weight: ['600', '700'],
});

const ui = Manrope({
  subsets: ['latin'],
  variable: '--font-ui',
});

const metadataFont = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-metadata',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Nugget',
  description:
    'Capture rambles locally, then organize them into useful ideas with optional cloud processing.',
  applicationName: 'Nugget',
};

export const viewport: Viewport = {
  themeColor: '#fbf8f2',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${wordmark.variable} ${ui.variable} ${metadataFont.variable}`}>
        <InstallAppProvider>
          <ServiceWorkerRegistration />
          {children}
        </InstallAppProvider>
        <Analytics />
      </body>
    </html>
  );
}
