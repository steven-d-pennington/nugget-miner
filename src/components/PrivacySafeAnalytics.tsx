'use client';

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next';
import { sanitizeAnalyticsUrl } from '@/lib/privacy/analyticsUrl';

function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  const url = sanitizeAnalyticsUrl(event.url);
  return url ? { ...event, url } : null;
}

export function PrivacySafeAnalytics() {
  return <Analytics beforeSend={beforeSend} />;
}
