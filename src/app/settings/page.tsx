import { AppShell } from '@/components/AppShell';

export default function SettingsPage() {
  return (
    <AppShell backHref="/" showNavigation={false} title="Settings">
      <section className="route-placeholder" aria-labelledby="settings-heading">
        <div>
          <p className="route-placeholder__eyebrow">Privacy and preferences</p>
          <h1 id="settings-heading">Settings</h1>
          <p className="route-placeholder__lede">
            Recordings and saved ideas are stored in this browser. Nugget sends audio or transcript content for cloud processing only when that processing is enabled or started.
          </p>
        </div>
        <p className="route-placeholder__note">
          Category definitions, processing preferences, export, and local-data controls are being connected in the next settings pass.
        </p>
      </section>
    </AppShell>
  );
}
