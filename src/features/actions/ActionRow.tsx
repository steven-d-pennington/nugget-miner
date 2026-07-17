'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ActionItem, Category, Idea } from '@/types';

export interface EnrichedAction {
  action: ActionItem;
  idea: Idea;
  category: Category;
}

interface ActionRowProps {
  row: EnrichedAction;
  busy: boolean;
  onRemove: (row: EnrichedAction) => Promise<void>;
  onStatusChange: (row: EnrichedAction, completed: boolean) => Promise<void>;
  onTextChange: (row: EnrichedAction, text: string) => Promise<void>;
}

export function ActionRow({ row, busy, onRemove, onStatusChange, onTextChange }: ActionRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(row.action.text);
  const [editError, setEditError] = useState<string>();

  useEffect(() => {
    if (!editing) setDraft(row.action.text);
  }, [editing, row.action.text]);

  async function saveEdit() {
    if (!draft.trim()) {
      setEditError('Action text is required.');
      return;
    }
    setEditError(undefined);
    try {
      await onTextChange(row, draft);
      setEditing(false);
    } catch {
      setEditError('The action could not be updated. Your original text was preserved.');
    }
  }

  async function confirmRemove() {
    if (!window.confirm(`Remove action "${row.action.text}"?`)) return;
    try {
      await onRemove(row);
    } catch {
      // The screen announces mutation failures and leaves the row in place.
    }
  }

  const completed = row.action.status === 'completed';

  return (
    <li className="rounded-r-2xl border border-l-[5px] border-[#E8DDCE] border-l-[#D69A24] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(16,29,54,0.05)] sm:px-5">
      <div className="flex items-start gap-3">
        <label className="flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-xl focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#315CBF]">
          <input
            aria-label={`Mark ${row.action.text} ${completed ? 'open' : 'completed'}`}
            checked={completed}
            className="h-5 w-5 accent-[#E5A11A]"
            disabled={busy}
            onChange={(event) => void onStatusChange(row, event.currentTarget.checked).catch(() => undefined)}
            type="checkbox"
          />
        </label>

        <div className="min-w-0 flex-1">
          {editing ? (
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-[0.12em] text-[#6E6B67]" htmlFor={`action-${row.action.id}`}>Action text</label>
              <input
                autoFocus
                className="mt-2 min-h-12 w-full rounded-xl border border-[#CDBFAE] bg-[#FBF8F2] px-3 text-base text-[#101D36] outline-none focus:border-[#315CBF] focus:ring-2 focus:ring-[#315CBF]/20"
                disabled={busy}
                id={`action-${row.action.id}`}
                onChange={(event) => { setDraft(event.currentTarget.value); setEditError(undefined); }}
                value={draft}
              />
              {editError ? <p className="mt-2 text-sm font-semibold text-[#A43C32]" role="alert">{editError}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="min-h-12 rounded-xl bg-[#101D36] px-4 font-bold text-white disabled:opacity-60" disabled={busy} onClick={() => void saveEdit()} type="button">Save action</button>
                <button className="min-h-12 rounded-xl border border-[#CDBFAE] bg-white px-4 font-bold text-[#101D36] disabled:opacity-60" disabled={busy} onClick={() => { setDraft(row.action.text); setEditError(undefined); setEditing(false); }} type="button">Cancel</button>
              </div>
            </div>
          ) : (
            <p className={`text-base font-bold leading-6 text-[#101D36] ${completed ? 'line-through decoration-[#6E6B67] decoration-2' : ''}`}>{row.action.text}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="rounded-full bg-[#FFF2D4] px-2.5 py-1 text-xs font-extrabold text-[#6F4600]">{row.category.name}</span>
            <Link className="inline-flex min-h-12 items-center font-bold text-[#315CBF] underline decoration-[#A9BCE8] underline-offset-4" href={`/ideas/${row.idea.id}`}>{row.idea.title}</Link>
          </div>

          {!editing ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <button className="min-h-12 rounded-xl px-3 text-sm font-bold text-[#101D36] underline decoration-[#CDBFAE] underline-offset-4 disabled:opacity-60" disabled={busy} onClick={() => setEditing(true)} type="button">Edit action</button>
              <button className="min-h-12 rounded-xl px-3 text-sm font-bold text-[#97352D] underline decoration-[#E0B1A8] underline-offset-4 disabled:opacity-60" disabled={busy} onClick={() => void confirmRemove()} type="button">Remove action</button>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}
