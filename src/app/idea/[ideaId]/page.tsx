import { redirect } from 'next/navigation';

export default async function LegacyIdeaPage({ params }: { params: Promise<{ ideaId: string }> }) {
  const { ideaId } = await params;
  redirect(`/capture/${ideaId}`);
}
