import { AppShell } from '@/components/AppShell';
import Link from 'next/link';

export default function SettingsPage() {
  return (
    <AppShell backHref="/" showNavigation={false} title="Settings">
      <section className="mx-auto grid max-w-3xl gap-8" aria-labelledby="settings-heading">
        <header>
          <p className="m-0 text-xs font-extrabold uppercase tracking-[0.14em] text-[#A66700]">Preferences and trust</p>
          <h1 className="mb-0 mt-2 text-4xl font-bold tracking-[-0.05em] text-[#101D36] sm:text-5xl" id="settings-heading">Settings</h1>
          <p className="mb-0 mt-4 max-w-2xl leading-7 text-[#6E6B67]">Shape how Nugget organizes your thoughts and review how local data and cloud processing work.</p>
        </header>

        <div className="grid border-b border-[#E8DDCE]">
          <section className="border-t border-[#E8DDCE] py-6" aria-labelledby="category-organization-heading">
            <p className="m-0 text-xs font-extrabold uppercase tracking-[0.12em] text-[#A66700]">Your vocabulary</p>
            <h2 className="mb-0 mt-2 text-xl font-bold text-[#101D36]" id="category-organization-heading">Category organization</h2>
            <p className="mb-0 mt-2 leading-6 text-[#6E6B67]">Give GPT-5.6 examples and boundaries for the themes that matter to you.</p>
            <Link className="mt-4 inline-flex min-h-12 items-center font-extrabold text-[#101D36] underline decoration-[#E5A11A] decoration-2 underline-offset-4" href="/settings/categories">Manage categories</Link>
          </section>
          <section className="border-t border-[#E8DDCE] py-6" aria-labelledby="processing-privacy-heading">
            <h2 className="m-0 text-xl font-bold text-[#101D36]" id="processing-privacy-heading">Processing and privacy</h2>
            <p className="mb-0 mt-2 leading-6 text-[#6E6B67]">Recordings and saved ideas stay in this browser. Audio or transcript content is sent for cloud processing only when processing is enabled or started.</p>
          </section>
          <section className="border-t border-[#E8DDCE] py-6" aria-labelledby="data-export-heading">
            <h2 className="m-0 text-xl font-bold text-[#101D36]" id="data-export-heading">Data export</h2>
            <p className="mb-0 mt-2 leading-6 text-[#6E6B67]">Download a copy of your local Nugget data. Export controls arrive in the next settings step.</p>
          </section>
          <section className="border-t border-[#E8DDCE] py-6" aria-labelledby="about-heading">
            <h2 className="m-0 text-xl font-bold text-[#101D36]" id="about-heading">About</h2>
            <p className="mb-0 mt-2 leading-6 text-[#6E6B67]">Nugget uses GPT-5.6 to separate rambles and organize each idea for your review.</p>
          </section>
        </div>
      </section>
    </AppShell>
  );
}
