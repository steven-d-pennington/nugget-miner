'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { categoryRepository } from '@/lib/repositories';
import type { Category } from '@/types';
import { CategoryEditor } from './CategoryEditor';

interface DeleteState {
  category: Category;
  replacementId: string;
}

function ideaCountLabel(count: number) {
  return `${count} ${count === 1 ? 'idea' : 'ideas'}`;
}

export function CategorySettingsScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Map<string, number>>(new Map());
  const [editing, setEditing] = useState<Category | 'new'>();
  const [deleting, setDeleting] = useState<DeleteState>();
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);

  const fallback = useMemo(() => categories.find((category) => category.isFallback), [categories]);

  async function refresh() {
    const [nextCategories, nextCounts] = await Promise.all([
      categoryRepository.ensureDefaults(),
      categoryRepository.countIdeasByCategory(),
    ]);
    setCategories(nextCategories);
    setCounts(nextCounts);
  }

  useEffect(() => {
    let active = true;
    Promise.all([categoryRepository.ensureDefaults(), categoryRepository.countIdeasByCategory()])
      .then(([nextCategories, nextCounts]) => {
        if (!active) return;
        setCategories(nextCategories);
        setCounts(nextCounts);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Categories could not be loaded.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (deleting) cancelDeleteRef.current?.focus();
  }, [deleting]);

  async function saveCategory(input: { name: string; description: string }) {
    setBusy(true);
    setNotice(undefined);
    try {
      if (editing === 'new') {
        const created = await categoryRepository.create(input);
        setNotice(`${created.name} category added.`);
      } else if (editing) {
        const updated = await categoryRepository.update(editing.id, input);
        setNotice(`${updated.name} category updated.`);
      }
      await refresh();
      setEditing(undefined);
    } finally {
      setBusy(false);
    }
  }

  function openDelete(category: Category) {
    if (category.isFallback) return;
    setNotice(undefined);
    setDeleting({ category, replacementId: fallback?.id ?? '' });
  }

  async function confirmDelete() {
    if (!deleting?.replacementId) {
      setError('Choose a replacement category before deleting.');
      return;
    }
    const replacement = categories.find((category) => category.id === deleting.replacementId);
    if (!replacement) {
      setError('Choose a valid replacement category before deleting.');
      return;
    }
    const affected = counts.get(deleting.category.id) ?? 0;
    setBusy(true);
    setError(undefined);
    try {
      await categoryRepository.removeAndReassign(deleting.category.id, replacement.id);
      setDeleting(undefined);
      setEditing(undefined);
      await refresh();
      setNotice(`Reassigned ${ideaCountLabel(affected)} to ${replacement.name} and deleted ${deleting.category.name}.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Category could not be deleted.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p aria-live="polite" className="text-[#6E6B67]">Loading categories…</p>;

  return (
    <section aria-labelledby="categories-heading" className="mx-auto grid max-w-3xl gap-8 pb-8">
      <header className="grid gap-3">
        <p className="m-0 text-xs font-extrabold uppercase tracking-[0.14em] text-[#A66700]">Teach the classifier</p>
        <h1 className="m-0 text-4xl font-bold tracking-[-0.05em] text-[#101D36] sm:text-5xl" id="categories-heading">Categories</h1>
        <p className="m-0 max-w-2xl leading-7 text-[#6E6B67]">Define the main themes Nugget uses to organize each idea. Clear examples and boundaries help GPT-5.6 choose one category with confidence.</p>
      </header>

      {error ? <p className="m-0 border-l-4 border-[#B73535] bg-[#FFF5F3] p-4 text-[#862525]" role="alert">{error}</p> : null}
      {notice ? <p aria-live="polite" className="m-0 border-l-4 border-[#247A55] bg-[#F2FAF6] p-4 text-[#176844]">{notice}</p> : null}

      {editing ? (
        <CategoryEditor
          busy={busy}
          category={editing === 'new' ? undefined : editing}
          onCancel={() => setEditing(undefined)}
          onSave={saveCategory}
        />
      ) : (
        <button className="button-primary w-fit" onClick={() => { setError(undefined); setEditing('new'); }} type="button">Add category</button>
      )}

      <ol aria-label="Configured categories" className="m-0 grid list-none gap-0 p-0">
        {categories.map((category, index) => {
          const count = counts.get(category.id) ?? 0;
          return (
            <li className={`relative border-t border-[#E8DDCE] py-6 pl-5 ${index === categories.length - 1 ? 'border-b' : ''}`} key={category.id}>
              <span aria-hidden="true" className="absolute bottom-6 left-0 top-6 w-1 rounded-full bg-[#E5A11A]" />
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="m-0 text-xl font-bold tracking-[-0.025em] text-[#101D36]">{category.name}</h2>
                    {category.isDefault ? <span className="rounded-full border border-[#E8DDCE] px-2 py-1 text-xs font-bold text-[#6E6B67]">Default</span> : null}
                    {category.isFallback ? <span className="rounded-full border border-[#E5A11A] bg-[#FFF2D4] px-2 py-1 text-xs font-bold text-[#825300]">Fallback—cannot be deleted</span> : null}
                  </div>
                  <p className="mb-0 mt-3 max-w-2xl text-sm leading-6 text-[#4F4D49]">{category.description}</p>
                  <p className="metadata mb-0 mt-3 text-xs text-[#6E6B67]">{ideaCountLabel(count)} using this category</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="button-quiet" disabled={busy} onClick={() => { setError(undefined); setEditing(category); }} type="button">Edit category</button>
                  {!category.isFallback ? (
                    <button className="min-h-12 rounded-full px-4 font-extrabold text-[#97352D] underline decoration-[#E0B1A8] underline-offset-4" disabled={busy} onClick={() => openDelete(category)} type="button">Delete category</button>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {deleting ? (
        <div aria-labelledby="delete-category-heading" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-[#101D36]/45 p-4" role="dialog">
          <div className="w-full max-w-lg rounded-2xl border border-[#E8DDCE] bg-[#FBF8F2] p-6 shadow-2xl">
            <p className="m-0 text-xs font-extrabold uppercase tracking-[0.14em] text-[#97352D]">Reassignment required</p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.035em] text-[#101D36]" id="delete-category-heading">Delete {deleting.category.name}?</h2>
            <p className="leading-7 text-[#4F4D49]">{ideaCountLabel(counts.get(deleting.category.id) ?? 0)} use this category. Choose where those ideas should move before deletion.</p>
            <label className="font-extrabold text-[#101D36]" htmlFor="replacement-category">Replacement category</label>
            <select className="mt-2 min-h-12 w-full rounded-xl border border-[#CFC2B1] bg-white px-4 text-[#101D36]" disabled={busy} id="replacement-category" onChange={(event) => setDeleting({ ...deleting, replacementId: event.target.value })} required value={deleting.replacementId}>
              <option value="">Choose a category</option>
              {categories.filter((category) => category.id !== deleting.category.id).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button className="button-quiet" disabled={busy} onClick={() => setDeleting(undefined)} ref={cancelDeleteRef} type="button">Cancel</button>
              <button className="min-h-12 rounded-full border border-[#972828] bg-[#B73535] px-5 font-extrabold text-white disabled:opacity-60" disabled={busy || !deleting.replacementId} onClick={() => void confirmDelete()} type="button">{busy ? 'Deleting…' : 'Reassign and delete'}</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
