'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { captureRepository, categoryRepository, tagRepository } from '@/lib/repositories';
import { LibraryService, type IdeaLibraryRow as LibraryRow } from '@/lib/services/LibraryService';
import type { CaptureSession, Category, Tag } from '@/types';
import { IdeaFilters } from './IdeaFilters';
import { IdeaLibraryRow } from './IdeaLibraryRow';
import { LibraryViewToggle } from './LibraryViewToggle';
import { readLibraryView, type IdeaLibraryView, writeLibraryView } from './libraryViewPreference';

interface FilterState {
  query: string;
  categoryId?: string;
  tagIds: string[];
  includeArchived: boolean;
}

function parseTagIds(value: string | null) {
  return [...new Set(value?.split(',').map((tagId) => tagId.trim()).filter(Boolean) ?? [])];
}

function filtersFromParams(params: { get(name: string): string | null }): FilterState {
  return {
    query: params.get('q') ?? '',
    categoryId: params.get('category') ?? undefined,
    tagIds: parseTagIds(params.get('tags')),
    includeArchived: params.get('archived') === '1',
  };
}

function canonicalFilterQuery(filters: FilterState) {
  const params = new URLSearchParams();
  if (filters.query) params.set('q', filters.query);
  if (filters.categoryId) params.set('category', filters.categoryId);
  if (filters.tagIds.length) params.set('tags', filters.tagIds.join(','));
  if (filters.includeArchived) params.set('archived', '1');
  return params.toString();
}

function filtersEqual(left: FilterState, right: FilterState) {
  return left.query === right.query
    && left.categoryId === right.categoryId
    && left.includeArchived === right.includeArchived
    && left.tagIds.length === right.tagIds.length
    && left.tagIds.every((tagId, index) => tagId === right.tagIds[index]);
}

export function IdeaLibraryScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [categoryId, setCategoryId] = useState<string | undefined>(() => searchParams.get('category') ?? undefined);
  const [tagIds, setTagIds] = useState<string[]>(() => parseTagIds(searchParams.get('tags')));
  const [includeArchived, setIncludeArchived] = useState(() => searchParams.get('archived') === '1');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [rows, setRows] = useState<LibraryRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [readyCaptures, setReadyCaptures] = useState<CaptureSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [metadataFailure, setMetadataFailure] = useState<string>();
  const [searchFailure, setSearchFailure] = useState<string>();
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [view, setView] = useState<IdeaLibraryView>('cards');
  const searchParamsKey = searchParams.toString();
  const currentFilters: FilterState = { query, categoryId, tagIds, includeArchived };
  const filtersRef = useRef(currentFilters);
  filtersRef.current = currentFilters;
  const canonicalCurrentParams = canonicalFilterQuery(filtersFromParams(searchParams));

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 150);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setView(readLibraryView());
  }, []);

  useEffect(() => {
    const nextFilters = filtersFromParams(new URLSearchParams(searchParamsKey));
    if (filtersEqual(filtersRef.current, nextFilters)) return;
    setQuery(nextFilters.query);
    setDebouncedQuery(nextFilters.query);
    setCategoryId(nextFilters.categoryId);
    setTagIds(nextFilters.tagIds);
    setIncludeArchived(nextFilters.includeArchived);
  }, [searchParamsKey]);

  const applyFilters = useCallback((nextFilters: FilterState) => {
    setQuery(nextFilters.query);
    setCategoryId(nextFilters.categoryId);
    setTagIds(nextFilters.tagIds);
    setIncludeArchived(nextFilters.includeArchived);
    const nextParams = canonicalFilterQuery(nextFilters);
    if (nextParams !== canonicalCurrentParams) {
      router.replace(nextParams ? `/ideas?${nextParams}` : '/ideas', { scroll: false });
    }
  }, [canonicalCurrentParams, router]);

  const updateFilters = useCallback((patch: Partial<FilterState>) => {
    applyFilters({ ...filtersRef.current, ...patch });
  }, [applyFilters]);

  const changeView = useCallback((nextView: IdeaLibraryView) => {
    setView(nextView);
    writeLibraryView(nextView);
  }, []);

  useEffect(() => {
    const onFocus = () => setRefreshVersion((version) => version + 1);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  useEffect(() => {
    let active = true;
    setMetadataFailure(undefined);
    void Promise.all([
      categoryRepository.ensureDefaults(),
      tagRepository.list(),
      captureRepository.listReviewReadyOldestFirst(),
    ]).then(([nextCategories, nextTags, captures]) => {
      if (!active) return;
      setCategories(nextCategories);
      setTags(nextTags);
      setReadyCaptures(captures);
    }).catch((error: unknown) => {
      if (!active) return;
      setMetadataFailure(error instanceof Error ? error.message : 'Library organization metadata could not be refreshed.');
    });
    return () => { active = false; };
  }, [refreshVersion]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setSearchFailure(undefined);
    void LibraryService.search({
      query: debouncedQuery || undefined,
      categoryId,
      tagIds,
      includeArchived,
    }).then((nextRows) => {
      if (!active) return;
      setRows(nextRows);
      setLoading(false);
    }).catch((error: unknown) => {
      if (!active) return;
      setSearchFailure(error instanceof Error ? error.message : 'The local idea library could not be read.');
      setLoading(false);
    });
    return () => { active = false; };
  }, [categoryId, debouncedQuery, includeArchived, refreshVersion, tagIds]);

  const clearFilters = useCallback(() => {
    applyFilters({ query: '', categoryId: undefined, tagIds: [], includeArchived: false });
  }, [applyFilters]);

  const hasFilters = Boolean(query || categoryId || tagIds.length || includeArchived);
  const resultLabel = `${rows.length} ${rows.length === 1 ? 'idea' : 'ideas'}`;

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <header className="max-w-2xl">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#8A5700]">Your field notes</p>
        <h1 className="text-4xl font-extrabold tracking-[-0.035em] text-[#101D36] sm:text-5xl">Ideas</h1>
        <p className="mt-3 text-base leading-7 text-[#5F5B56]">Find the useful thoughts you confirmed, without digging through the original ramble.</p>
      </header>

      {readyCaptures.length ? (
        <Link
          className="group flex min-h-20 items-center gap-4 rounded-2xl border border-[#E7C779] bg-[#FFF2D4] px-5 py-4 text-[#101D36] no-underline shadow-[0_8px_22px_rgba(185,119,0,0.08)]"
          href={`/review/${readyCaptures[0]?.id}`}
        >
          <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#B97700] shadow-sm">
            <svg fill="none" height="22" viewBox="0 0 24 24" width="22">
              <path d="M6 12h3l2-5 3 10 2-5h2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            </svg>
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block text-base">{readyCaptures.length} {readyCaptures.length === 1 ? 'capture' : 'captures'} ready to review</strong>
            <span className="mt-0.5 block text-sm text-[#5F5B56]">Shape the oldest capture into ideas for your library.</span>
          </span>
          <span aria-hidden="true" className="text-xl text-[#B97700] transition-transform group-hover:translate-x-1 motion-reduce:transform-none">→</span>
        </Link>
      ) : null}

      {metadataFailure ? (
        <div className="rounded-2xl border border-[#E0B1A8] bg-white p-5" role="alert">
          <h2 className="font-extrabold text-[#101D36]">Library organization could not be refreshed</h2>
          <p className="mt-2 text-sm text-[#5F5B56]">Your ideas are still available, but category, tag, or review information may be out of date. {metadataFailure}</p>
          <button className="mt-3 min-h-12 rounded-xl bg-[#101D36] px-5 font-bold text-white" onClick={() => setRefreshVersion((version) => version + 1)} type="button">Try again</button>
        </div>
      ) : null}

      <IdeaFilters
        categories={categories}
        categoryId={categoryId}
        includeArchived={includeArchived}
        onCategoryChange={(nextCategoryId) => updateFilters({ categoryId: nextCategoryId })}
        onClear={clearFilters}
        onIncludeArchivedChange={(nextIncludeArchived) => updateFilters({ includeArchived: nextIncludeArchived })}
        onQueryChange={(nextQuery) => updateFilters({ query: nextQuery })}
        onTagToggle={(tagId) => updateFilters({ tagIds: tagIds.includes(tagId) ? tagIds.filter((id) => id !== tagId) : [...tagIds, tagId] })}
        query={query}
        tagIds={tagIds}
        tags={tags}
      />

      <section aria-labelledby="library-results-heading" aria-busy={loading}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-extrabold text-[#101D36]" id="library-results-heading">Library</h2>
          <LibraryViewToggle disabled={loading} onChange={changeView} value={view} />
          <p aria-live="polite" className="metadata text-xs font-semibold uppercase tracking-wider text-[#6E6B67]">{loading ? 'Loading ideas…' : resultLabel}</p>
        </div>

        {searchFailure ? (
          <div className="rounded-2xl border border-[#E0B1A8] bg-white p-6" role="alert">
            <h3 className="font-extrabold text-[#101D36]">Ideas could not be loaded</h3>
            <p className="mt-2 text-sm text-[#5F5B56]">{searchFailure}</p>
            <button className="mt-4 min-h-12 rounded-xl bg-[#101D36] px-5 font-bold text-white" onClick={() => setRefreshVersion((version) => version + 1)} type="button">Try again</button>
          </div>
        ) : !loading && rows.length === 0 ? (
          hasFilters ? (
            <div className="rounded-2xl border border-[#E8DDCE] bg-white px-6 py-10 text-center">
              <h3 className="text-xl font-extrabold text-[#101D36]">No ideas match these filters</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#5F5B56]">Try a broader search, another category, or clear the filters to see the full library.</p>
              <button className="mt-5 min-h-12 rounded-xl bg-[#101D36] px-5 font-bold text-white" onClick={clearFilters} type="button">Clear filters</button>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#E8DDCE] bg-white px-6 py-10 text-center">
              <span aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF2D4] text-2xl text-[#B97700]">◆</span>
              <h3 className="mt-4 text-xl font-extrabold text-[#101D36]">Your idea library is empty</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#5F5B56]">Record a thought and confirm the ideas worth keeping. They will collect here.</p>
              <Link className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-[#E5A11A] px-5 font-extrabold text-[#101D36] no-underline" href="/">Record your first idea</Link>
            </div>
          )
        ) : (
          <ul aria-label="Ideas" className={view === 'cards' ? 'idea-library idea-library--cards' : 'idea-library idea-library--compact'}>{rows.map((row) => <IdeaLibraryRow key={row.idea.id} row={row} view={view} />)}</ul>
        )}
      </section>
    </div>
  );
}
