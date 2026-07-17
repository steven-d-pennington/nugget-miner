import { AppShell } from '@/components/AppShell';
import { SettingsScreen } from '@/features/settings/SettingsScreen';

export default function SettingsPage() {
  return (
    <AppShell backHref="/" showNavigation={false} title="Settings">
      <SettingsScreen />
    </AppShell>
  );
}
