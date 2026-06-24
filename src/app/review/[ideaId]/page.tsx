import { ReviewScreen } from '@/features/review/ReviewScreen';

export default async function ReviewPage({ params }: { params: Promise<{ ideaId: string }> }) {
  const { ideaId } = await params;
  return <ReviewScreen ideaId={ideaId} />;
}
