import { AppShell } from '@/components/AppShell';
import { ActionsScreen } from '@/features/actions/ActionsScreen';

export default function ActionsPage() {
  return (
    <AppShell title="Actions">
      <ActionsScreen />
    </AppShell>
  );
}
