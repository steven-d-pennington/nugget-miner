import { Suspense } from 'react';
import { AppShell } from '@/components/AppShell';
import { IdeaLibraryScreen } from '@/features/library/IdeaLibraryScreen';

export default function IdeasPage() {
  return (
    <AppShell title="Ideas">
      <Suspense fallback={<p aria-live="polite">Loading your ideas…</p>}>
        <IdeaLibraryScreen />
      </Suspense>
    </AppShell>
  );
}
