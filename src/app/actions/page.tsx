import { AppShell } from '@/components/AppShell';

export default function ActionsPage() {
  return (
    <AppShell title="Actions">
      <section className="route-placeholder" aria-labelledby="actions-heading">
        <div>
          <p className="route-placeholder__eyebrow">Next steps</p>
          <h1 id="actions-heading">Actions</h1>
          <p className="route-placeholder__lede">
            Confirmed suggestions will collect here without losing their connection to the original idea.
          </p>
        </div>
        <p className="route-placeholder__note">
          Action retrieval and completion controls are being connected next. Confirming the same suggestion will not create duplicates.
        </p>
      </section>
    </AppShell>
  );
}
