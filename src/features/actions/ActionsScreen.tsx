'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { actionItemRepository, categoryRepository, ideaRepository } from '@/lib/repositories';
import type { ActionItem } from '@/types';
import { ActionRow, type EnrichedAction } from './ActionRow';

function compareOpen(left: EnrichedAction, right: EnrichedAction) {
  return right.action.createdAt - left.action.createdAt || right.action.updatedAt - left.action.updatedAt;
}

function compareCompleted(left: EnrichedAction, right: EnrichedAction) {
  return (right.action.completedAt ?? 0) - (left.action.completedAt ?? 0)
    || right.action.createdAt - left.action.createdAt;
}

function replaceAction(rows: EnrichedAction[], action: ActionItem) {
  return rows.map((row) => row.action.id === action.id ? { ...row, action } : row);
}

export function ActionsScreen() {
  const [rows, setRows] = useState<EnrichedAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [failure, setFailure] = useState<string>();
  const [busyIds, setBusyIds] = useState<Set<string>>(() => new Set());
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailure(undefined);
    void Promise.all([
      actionItemRepository.listByStatus('open'),
      actionItemRepository.listByStatus('completed'),
      ideaRepository.listConfirmed(true),
      categoryRepository.list(),
    ]).then(([openActions, completedActions, ideas, categories]) => {
      if (!active) return;
      const ideasById = new Map(ideas.map((idea) => [idea.id, idea]));
      const categoriesById = new Map(categories.map((category) => [category.id, category]));
      const enriched = [...openActions, ...completedActions].flatMap((action) => {
        const idea = ideasById.get(action.ideaId);
        const category = idea ? categoriesById.get(idea.categoryId) : undefined;
        return idea && category ? [{ action, idea, category }] : [];
      });
      setRows(enriched);
      setLoading(false);
    }).catch((error: unknown) => {
      if (!active) return;
      setFailure(error instanceof Error ? error.message : 'Your local actions could not be read.');
      setLoading(false);
    });
    return () => { active = false; };
  }, [refreshVersion]);

  const setBusy = useCallback((id: string, busy: boolean) => {
    setBusyIds((current) => {
      const next = new Set(current);
      if (busy) next.add(id); else next.delete(id);
      return next;
    });
  }, []);

  const changeStatus = useCallback(async (row: EnrichedAction, completed: boolean) => {
    const original = row.action;
    setFailure(undefined);
    setBusy(original.id, true);
    try {
      const status = completed ? 'completed' : 'open';
      await actionItemRepository.setStatus(original.id, status);
      const timestamp = Date.now();
      const next: ActionItem = completed
        ? { ...original, status, completedAt: timestamp, updatedAt: timestamp }
        : { ...original, status, completedAt: undefined, updatedAt: timestamp };
      setRows((current) => replaceAction(current, next));
    } catch (error) {
      const detail = error instanceof Error ? ` ${error.message}` : '';
      setFailure(`The action status could not be updated. Your previous status was kept.${detail}`);
      throw error;
    } finally {
      setBusy(original.id, false);
    }
  }, [setBusy]);

  const changeText = useCallback(async (row: EnrichedAction, value: string) => {
    const text = value.trim();
    setFailure(undefined);
    setBusy(row.action.id, true);
    try {
      await actionItemRepository.updateText(row.action.id, text);
      setRows((current) => replaceAction(current, { ...row.action, text, updatedAt: Date.now() }));
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'The action could not be updated. Your original text was preserved.');
      throw error;
    } finally {
      setBusy(row.action.id, false);
    }
  }, [setBusy]);

  const removeAction = useCallback(async (row: EnrichedAction) => {
    setFailure(undefined);
    setBusy(row.action.id, true);
    try {
      await actionItemRepository.remove(row.action.id);
      setRows((current) => current.filter((candidate) => candidate.action.id !== row.action.id));
    } catch (error) {
      setFailure(error instanceof Error ? error.message : 'The action could not be removed. It remains in your list.');
      throw error;
    } finally {
      setBusy(row.action.id, false);
    }
  }, [setBusy]);

  const openRows = useMemo(() => rows.filter((row) => row.action.status === 'open').sort(compareOpen), [rows]);
  const completedRows = useMemo(() => rows.filter((row) => row.action.status === 'completed').sort(compareCompleted), [rows]);
  const renderRow = (row: EnrichedAction) => (
    <ActionRow
      busy={busyIds.has(row.action.id)}
      key={row.action.id}
      onRemove={removeAction}
      onStatusChange={changeStatus}
      onTextChange={changeText}
      row={row}
    />
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="screen-heading">
        <p className="screen-heading__eyebrow">Next steps</p>
        <h1 className="screen-heading__title">Actions</h1>
        <p className="screen-heading__lede">Move useful ideas forward without losing where each next step came from.</p>
      </header>

      {failure ? (
        <div className="rounded-2xl border border-[#E0B1A8] bg-white p-5" role="alert">
          <p className="font-bold text-[#97352D]">{failure}</p>
          {!rows.length ? <button className="mt-3 min-h-12 rounded-xl bg-[#101D36] px-5 font-bold text-white" onClick={() => setRefreshVersion((version) => version + 1)} type="button">Try again</button> : null}
        </div>
      ) : null}

      {loading ? <p aria-live="polite" className="text-sm font-semibold text-[#6E6B67]">Loading actions...</p> : null}

      {!loading && !failure && rows.length === 0 ? (
        <section className="rounded-2xl border border-[#E8DDCE] bg-white px-6 py-10 text-center" aria-labelledby="actions-empty-heading">
          <span aria-hidden="true" className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF2D4] text-sm font-extrabold text-[#B97700]">OK</span>
          <h2 className="mt-4 text-xl font-extrabold text-[#101D36]" id="actions-empty-heading">No actions yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#5F5B56]">Accept a suggested next step while reviewing an idea, and it will appear here.</p>
          <Link className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-[#E5A11A] px-5 font-extrabold text-[#101D36] no-underline" href="/ideas">Browse ideas</Link>
        </section>
      ) : null}

      {!loading && rows.length > 0 ? (
        <div className="space-y-10">
          <section aria-labelledby="open-actions-heading" className="utility-section">
            <div className="mb-4 flex items-center justify-between gap-4 border-b border-[#E8DDCE] pb-3">
              <h2 className="text-xl font-extrabold text-[#101D36]" id="open-actions-heading">Open</h2>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#6E6B67]">{openRows.length} {openRows.length === 1 ? 'action' : 'actions'}</span>
            </div>
            {openRows.length ? <ul aria-label="Open actions" className="space-y-4 p-0">{openRows.map(renderRow)}</ul> : <p className="text-sm leading-6 text-[#5F5B56]">Nothing open. Completed actions stay available below.</p>}
          </section>

          <section aria-labelledby="completed-actions-heading" className="utility-section">
            <div className="mb-4 flex items-center justify-between gap-4 border-b border-[#E8DDCE] pb-3">
              <h2 className="text-xl font-extrabold text-[#101D36]" id="completed-actions-heading">Completed</h2>
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#6E6B67]">{completedRows.length} {completedRows.length === 1 ? 'action' : 'actions'}</span>
            </div>
            {completedRows.length ? <ul aria-label="Completed actions" className="space-y-4 p-0">{completedRows.map(renderRow)}</ul> : <p className="text-sm leading-6 text-[#5F5B56]">Completed actions will collect here.</p>}
          </section>
        </div>
      ) : null}
    </div>
  );
}
