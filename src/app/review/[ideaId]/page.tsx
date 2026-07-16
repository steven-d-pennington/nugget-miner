import { ReviewScreen } from '@/features/review/ReviewScreen';

export default async function ReviewPage({ params }: { params: Promise<{ ideaId: string }> }) {
  const { ideaId: captureId } = await params;
  return <ReviewScreen captureId={captureId} />;
}
