'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import type { Category } from '@/types';

const NAME_MAX = 40;
const DESCRIPTION_MIN = 20;
const DESCRIPTION_MAX = 800;

interface CategoryEditorProps {
  category?: Category;
  busy: boolean;
  onCancel: () => void;
  onSave: (input: { name: string; description: string }) => Promise<void>;
}

export function CategoryEditor({ category, busy, onCancel, onSave }: CategoryEditorProps) {
  const nameId = useId();
  const descriptionId = useId();
  const descriptionHelpId = useId();
  const [name, setName] = useState(category?.name ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [error, setError] = useState<string>();

  useEffect(() => {
    setName(category?.name ?? '');
    setDescription(category?.description ?? '');
    setError(undefined);
  }, [category]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    if (!trimmedName) {
      setError('Category name is required.');
      return;
    }
    if (trimmedDescription.length < DESCRIPTION_MIN) {
      setError(`Category description must be at least ${DESCRIPTION_MIN} characters.`);
      return;
    }
    try {
      await onSave({ name: trimmedName, description: trimmedDescription });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Category could not be saved.');
    }
  }

  return (
    <form className="grid gap-5 border-y border-[#E8DDCE] bg-white px-4 py-5 sm:rounded-2xl sm:border" onSubmit={(event) => void submit(event)}>
      <div>
        <p className="m-0 text-xs font-extrabold uppercase tracking-[0.14em] text-[#A66700]">Classifier contract</p>
        <h2 className="mt-2 text-2xl font-bold tracking-[-0.035em] text-[#101D36]">{category ? `Edit ${category.name}` : 'Add category'}</h2>
      </div>

      <div className="grid gap-2">
        <div className="flex items-end justify-between gap-3">
          <label className="font-extrabold text-[#101D36]" htmlFor={nameId}>Name</label>
          <span className="metadata text-xs text-[#6E6B67]">{name.length}/{NAME_MAX}</span>
        </div>
        <input
          autoFocus
          className="min-h-12 rounded-xl border border-[#CFC2B1] bg-white px-4 text-[#101D36]"
          disabled={busy}
          id={nameId}
          maxLength={NAME_MAX}
          onChange={(event) => setName(event.target.value)}
          required
          value={name}
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-end justify-between gap-3">
          <label className="font-extrabold text-[#101D36]" htmlFor={descriptionId}>Description</label>
          <span aria-live="polite" className="metadata text-xs text-[#6E6B67]">{description.length}/{DESCRIPTION_MAX}</span>
        </div>
        <textarea
          aria-describedby={descriptionHelpId}
          className="min-h-48 resize-y rounded-xl border border-[#CFC2B1] bg-white px-4 py-3 leading-7 text-[#101D36]"
          disabled={busy}
          id={descriptionId}
          maxLength={DESCRIPTION_MAX}
          minLength={DESCRIPTION_MIN}
          onChange={(event) => setDescription(event.target.value)}
          required
          value={description}
        />
        <p className="m-0 text-sm leading-6 text-[#6E6B67]" id={descriptionHelpId}>
          Include examples that belong here and boundaries that distinguish this category from the others. Nugget sends this description to GPT-5.6 during classification.
        </p>
      </div>

      {error ? <p className="m-0 border-l-4 border-[#B73535] bg-[#FFF5F3] p-3 text-[#862525]" role="alert">{error}</p> : null}

      <div className="flex flex-wrap justify-end gap-3">
        <button className="button-quiet" disabled={busy} onClick={onCancel} type="button">Cancel</button>
        <button className="button-primary" disabled={busy} type="submit">{busy ? 'Saving…' : 'Save category'}</button>
      </div>
    </form>
  );
}
