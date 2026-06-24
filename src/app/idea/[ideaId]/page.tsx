import { IdeaDetailScreen } from '@/features/library/IdeaDetailScreen';

export default async function IdeaPage({ params }: { params: Promise<{ ideaId: string }> }) {
  const { ideaId } = await params;
  return <IdeaDetailScreen ideaId={ideaId} />;
}
