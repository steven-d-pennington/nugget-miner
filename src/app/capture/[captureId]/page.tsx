import { CaptureDetailScreen } from '@/features/capture/CaptureDetailScreen';

interface CapturePageProps {
  params: Promise<{ captureId: string }>;
  searchParams: Promise<{ stay?: string | string[] }>;
}

export default async function CapturePage({ params, searchParams }: CapturePageProps) {
  const [{ captureId }, query] = await Promise.all([params, searchParams]);
  return <CaptureDetailScreen captureId={captureId} stayOnCapture={query.stay === '1'} />;
}
