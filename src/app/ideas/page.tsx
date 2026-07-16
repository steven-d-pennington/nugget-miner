import { AppShell } from '@/components/AppShell';
import { ConfirmedIdeasPreview } from '@/features/library/ConfirmedIdeasPreview';

export default function IdeasPage() {
  return (
    <AppShell title="Ideas">
      <ConfirmedIdeasPreview />
    </AppShell>
  );
}
