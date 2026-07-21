'use client';

import { useState } from 'react';
import type { Category, Tag } from '@/types';

interface IdeaFiltersProps {
  query: string;
  categoryId?: string;
  tagIds: string[];
  scope: 'active' | 'archived';
  categories: Category[];
  tags: Tag[];
  onQueryChange: (query: string) => void;
  onCategoryChange: (categoryId?: string) => void;
  onTagToggle: (tagId: string) => void;
  onScopeChange: (scope: 'active' | 'archived') => void;
  onClear: () => void;
}

export function IdeaFilters({
  query,
  categoryId,
  tagIds,
  scope,
  categories,
  tags,
  onQueryChange,
  onCategoryChange,
  onTagToggle,
  onScopeChange,
  onClear,
}: IdeaFiltersProps) {
  const hasFilters = Boolean(query || categoryId || tagIds.length);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(tagIds.length > 0);

  return (
    <section aria-label="Idea filters" className="space-y-4">
      <div aria-label="Idea status" className="grid grid-cols-2 rounded-xl border border-[#D8CCBB] bg-[#F6F0E6] p-1" role="group">
        {(['active', 'archived'] as const).map((option) => (
          <button
            aria-pressed={scope === option}
            className={`min-h-12 rounded-lg px-4 text-sm font-extrabold transition-colors ${scope === option ? 'bg-white text-[#101D36] shadow-sm' : 'text-[#6E6B67] hover:text-[#101D36]'}`}
            key={option}
            onClick={() => onScopeChange(option)}
            type="button"
          >
            {option === 'active' ? 'Active' : 'Archived'}
          </button>
        ))}
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-[#101D36]" htmlFor="idea-search">
          Search ideas
        </label>
        <div className="relative">
          <svg aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6E6B67]" fill="none" height="20" viewBox="0 0 24 24" width="20">
            <circle cx="10.8" cy="10.8" r="6.3" stroke="currentColor" strokeWidth="1.8" />
            <path d="m15.5 15.5 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
          </svg>
          <input
            className="min-h-12 w-full rounded-xl border border-[#D8CCBB] bg-white py-3 pl-12 pr-4 text-base text-[#101D36] shadow-[0_6px_18px_rgba(16,29,54,0.05)] placeholder:text-[#77736D]"
            id="idea-search"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Title, summary, or tag"
            type="search"
            value={query}
          />
        </div>
      </div>

      <div aria-label="Categories" className="-mx-4 overflow-x-auto px-4 pb-1">
        <div className="flex min-w-max gap-2">
          <button
            aria-pressed={!categoryId}
            className={`min-h-12 rounded-full border px-5 text-sm font-bold transition-colors ${!categoryId ? 'border-[#101D36] bg-[#101D36] text-white' : 'border-[#D8CCBB] bg-white text-[#101D36] hover:border-[#E5A11A]'}`}
            onClick={() => onCategoryChange(undefined)}
            type="button"
          >
            All
          </button>
          {categories.map((category) => (
            <button
              aria-pressed={categoryId === category.id}
              className={`min-h-12 rounded-full border px-5 text-sm font-bold transition-colors ${categoryId === category.id ? 'border-[#101D36] bg-[#101D36] text-white' : 'border-[#D8CCBB] bg-white text-[#101D36] hover:border-[#E5A11A]'}`}
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              type="button"
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3 border-y border-[#E8DDCE] py-3">
        <details className="group" onToggle={(event) => setMoreFiltersOpen(event.currentTarget.open)} open={moreFiltersOpen}>
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-lg px-2 text-sm font-bold text-[#101D36] marker:content-none">
            More filters
            {tagIds.length ? <span className="rounded-full bg-[#FFF2D4] px-2 py-0.5 text-xs">{tagIds.length}</span> : null}
            <svg aria-hidden="true" className="transition-transform group-open:rotate-180" fill="none" height="16" viewBox="0 0 16 16" width="16">
              <path d="m4 6 4 4 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
          </summary>
          <div className="mt-2 flex max-w-xl flex-wrap gap-2 px-2 pb-2">
            {tags.length ? tags.map((tag) => (
              <button
                aria-pressed={tagIds.includes(tag.id)}
                className={`min-h-12 rounded-lg border px-4 text-sm ${tagIds.includes(tag.id) ? 'border-[#E5A11A] bg-[#FFF2D4] font-bold text-[#101D36]' : 'border-[#D8CCBB] bg-white text-[#4F4C48]'}`}
                key={tag.id}
                onClick={() => onTagToggle(tag.id)}
                type="button"
              >
                #{tag.name}
              </button>
            )) : <p className="py-2 text-sm text-[#6E6B67]">Tags appear here after you confirm tagged ideas.</p>}
          </div>
        </details>

        {hasFilters ? (
          <button className="min-h-12 rounded-lg px-3 text-sm font-bold text-[#8A5700] underline decoration-[#E5A11A] decoration-2 underline-offset-4" onClick={onClear} type="button">
            Clear filters
          </button>
        ) : null}
      </div>
    </section>
  );
}
