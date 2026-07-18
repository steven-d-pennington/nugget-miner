import { buildServiceWorkerSource } from '@/lib/pwa/serviceWorkerSource';

export const dynamic = 'force-dynamic';

export function GET() {
  const releaseId = process.env.NEXT_PUBLIC_NUGGET_RELEASE ?? 'local-development';
  return new Response(buildServiceWorkerSource(releaseId), {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'application/javascript; charset=utf-8',
      'Service-Worker-Allowed': '/',
    },
  });
}
