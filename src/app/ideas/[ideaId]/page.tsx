import { AppShell } from '@/components/AppShell';
import { IdeaDetailScreen } from '@/features/library/IdeaDetailScreen';

export default async function IdeaPage({ params }: { params: Promise<{ ideaId: string }> }) {
  const { ideaId } = await params;
  return (
    <AppShell backHref="/ideas" title="Idea">
      <IdeaDetailScreen ideaId={ideaId} />
    </AppShell>
  );
}

