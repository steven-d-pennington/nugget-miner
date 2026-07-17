import { AppShell } from '@/components/AppShell';
import { CategorySettingsScreen } from '@/features/settings/CategorySettingsScreen';

export default function CategorySettingsPage() {
  return (
    <AppShell backHref="/settings" showNavigation={false} title="Categories">
      <CategorySettingsScreen />
    </AppShell>
  );
}
