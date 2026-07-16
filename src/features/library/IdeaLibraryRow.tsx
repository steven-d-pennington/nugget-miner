import Link from 'next/link';
import type { IdeaLibraryRow as LibraryRow } from '@/lib/services/LibraryService';

const categoryColors: Record<string, string> = {
  work: '#315CBF',
  school: '#7651A8',
  personal: '#5E8568',
  family: '#D18A19',
  misc: '#687487',
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function Indicator({ children, icon }: { children: React.ReactNode; icon: 'blocked' | 'research' | 'actions' }) {
  const path = icon === 'blocked'
    ? <path d="M12 8v4m0 4h.01M10.3 3.8 2.6 17.1A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.9L13.7 3.8a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    : icon === 'research'
      ? <><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" /><path d="m16 16 4 4M11 8v6m-3-3h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></>
      : <><path d="M5 5.5h14v13H5z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" /><path d="m8 12 2 2 5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></>;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4F4C48]">
      <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">{path}</svg>
      {children}
    </span>
  );
}

export function IdeaLibraryRow({ row }: { row: LibraryRow }) {
  const edgeColor = categoryColors[row.category.normalizedName] ?? '#B97700';

  return (
    <li>
      <Link
        className="group block rounded-r-2xl border border-l-[5px] border-[#E8DDCE] bg-white px-5 py-5 text-[#101D36] no-underline shadow-[0_10px_26px_rgba(16,29,54,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(16,29,54,0.1)] motion-reduce:transform-none"
        href={`/ideas/${row.idea.id}`}
        style={{ borderLeftColor: edgeColor }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#6E6B67]">
              <span>{row.category.name}</span>
              {row.idea.id.startsWith('demo-') ? <span className="rounded-full bg-[#FFF2D4] px-2 py-0.5 text-[#8A5700]">Sample</span> : null}
            </div>
            <h2 className="text-lg font-extrabold leading-snug tracking-[-0.015em] group-hover:text-[#8A5700]">{row.idea.title}</h2>
          </div>
          <svg aria-hidden="true" className="mt-1 shrink-0 text-[#B97700] transition-transform group-hover:translate-x-1 motion-reduce:transform-none" fill="none" height="20" viewBox="0 0 24 24" width="20">
            <path d="m9 5 7 7-7 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
          </svg>
        </div>

        <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-[#5F5B56]">{row.idea.summary.text}</p>

        {row.tags.length ? (
          <div aria-label="Tags" className="mt-3 flex flex-wrap gap-2">
            {row.tags.slice(0, 3).map((tag) => (
              <span className="rounded-full bg-[#F6F0E6] px-2.5 py-1 text-xs font-semibold text-[#4F4C48]" key={tag.id}>#{tag.name}</span>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#EFE6DA] pt-3">
          {row.hasBlockers ? <Indicator icon="blocked">Blocked</Indicator> : null}
          {row.needsResearch ? <Indicator icon="research">Research</Indicator> : null}
          {row.openActionCount > 0 ? (
            <Indicator icon="actions">{row.openActionCount} open {row.openActionCount === 1 ? 'action' : 'actions'}</Indicator>
          ) : null}
          <time className="ml-auto text-xs text-[#6E6B67]" dateTime={new Date(row.idea.updatedAt).toISOString()}>
            Updated {dateFormatter.format(row.idea.updatedAt)}
          </time>
        </div>
      </Link>
    </li>
  );
}
