import { AppShell } from '@/components/AppShell';

export default function IdeasPage() {
  return (
    <AppShell title="Ideas">
      <section className="route-placeholder" aria-labelledby="ideas-heading">
        <div>
          <p className="route-placeholder__eyebrow">Your library</p>
          <h1 id="ideas-heading">Ideas</h1>
          <p className="route-placeholder__lede">
            Organized ideas will be searchable here after you process and confirm a capture.
          </p>
        </div>
        <p className="route-placeholder__note">
          The local idea library is being connected next. Existing recordings and saved idea data remain in this browser.
        </p>
      </section>
    </AppShell>
  );
}
