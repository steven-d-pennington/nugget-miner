'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { IdeaActivationCard } from '@/features/activation/IdeaActivationCard';
import { GroundedFieldEditor } from '@/features/review/GroundedFieldEditor';
import { IdeaSummaryView } from '@/features/library/IdeaSummaryView';
import {
  createInferredGroundedText,
  initializeIdeaDraftFormValue,
  type IdeaDraftFormValue,
  validateIdeaDraftFormValue,
} from '@/features/review/IdeaCandidateForm';
import { TagEditor } from '@/features/review/TagEditor';
import { downloadText, slugifyIdeaFilename } from '@/lib/export/download';
import {
  ideaToJson,
  ideaToMarkdown,
  type IdeaExportBundle,
} from '@/lib/export/ideaExport';
import {
  actionItemRepository,
  captureRepository,
  categoryRepository,
  ideaRepository,
  recordingRepository,
  tagRepository,
  transcriptRepository,
} from '@/lib/repositories';
import type { ActionItem, CaptureSession, Category, GroundedText, Recording, Tag, Transcript } from '@/types';

interface LoadedIdea extends IdeaExportBundle {
  capture?: CaptureSession;
  recording?: Recording;
  transcript?: Transcript;
  allCategories: Category[];
  allTags: Tag[];
}

type SaveStatus = 'saved' | 'dirty' | 'saving' | 'invalid' | 'error';

const AUTOSAVE_DELAY_MS = 900;

function formSignature(value: IdeaDraftFormValue) {
  return JSON.stringify(value);
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp);
}

async function copyText(text: string) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    if (!copied) throw new Error('Copy failed.');
  }
}

function mergeTags(existing: Tag[], added: Tag[]) {
  const byId = new Map(existing.map((tag) => [tag.id, tag]));
  for (const tag of added) byId.set(tag.id, tag);
  return [...byId.values()];
}

function asUpdateInput(value: IdeaDraftFormValue, tagIds: string[], status: 'confirmed' | 'archived') {
  return {
    title: value.title.trim(),
    summary: { ...value.summary, text: value.summary.text.trim() },
    purpose: value.purpose ? { ...value.purpose, text: value.purpose.text.trim() } : undefined,
    goals: value.goals.map((item) => ({ ...item, text: item.text.trim() })),
    problem: value.problem
      ? {
          statement: { ...value.problem.statement, text: value.problem.statement.text.trim() },
          type: value.problem.type?.trim() || undefined,
        }
      : undefined,
    blockers: value.blockers.map((item) => ({ ...item, text: item.text.trim() })),
    questions: value.questions.map((item) => ({ ...item, text: item.text.trim() })),
    suggestedActions: value.suggestedActions.map((item) => ({ ...item, text: item.text.trim() })),
    research: {
      ...value.research,
      assessment: value.research.assessment
        ? { ...value.research.assessment, text: value.research.assessment.text.trim() }
        : undefined,
      suggestedQueries: value.research.suggestedQueries.map((item) => item.trim()).filter(Boolean),
      suggestedResourceTypes: value.research.suggestedResourceTypes.map((item) => item.trim()).filter(Boolean),
    },
    categoryId: value.categoryId,
    tagIds,
    status,
  };
}

function ActionList({ actions }: { actions: ActionItem[] }) {
  if (actions.length === 0) return <p className="text-sm text-[#6E6B67]">No linked actions yet.</p>;
  return (
    <ul className="space-y-2">
      {actions.map((action) => (
        <li className="flex items-start gap-3 border-b border-[#E8DDCE] py-3" key={action.id}>
          <span aria-hidden="true" className="mt-0.5 text-[#247A55]">{action.status === 'completed' ? '✓' : '○'}</span>
          <div>
            <p className={action.status === 'completed' ? 'text-[#6E6B67] line-through' : 'text-[#101D36]'}>{action.text}</p>
            <span className="text-xs uppercase tracking-wide text-[#6E6B67]">{action.status}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function IdeaDetailScreen({ ideaId }: { ideaId: string }) {
  const [bundle, setBundle] = useState<LoadedIdea | null>(null);
  const [form, setForm] = useState<IdeaDraftFormValue | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const latestFormSignatureRef = useRef('');
  const savedFormSignatureRef = useRef('');
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const savePromisesRef = useRef(new Map<string, Promise<boolean>>());

  const repositoryIdeaId = useMemo(() => {
    try {
      return decodeURIComponent(ideaId);
    } catch {
      return null;
    }
  }, [ideaId]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      if (repositoryIdeaId === null) {
        setBundle(null);
        setForm(null);
        return;
      }

      const idea = await ideaRepository.getById(repositoryIdeaId);
      if (!idea || (idea.status !== 'confirmed' && idea.status !== 'archived')) {
        setBundle(null);
        setForm(null);
        return;
      }
      const [allCategories, allTags, actions, capture, recording, transcript] = await Promise.all([
        categoryRepository.list(),
        tagRepository.list(),
        actionItemRepository.listByIdea(idea.id),
        captureRepository.getById(idea.captureSessionId),
        recordingRepository.getByCaptureId(idea.captureSessionId),
        transcriptRepository.getCurrent(idea.captureSessionId),
      ]);
      const category = allCategories.find((candidate) => candidate.id === idea.categoryId);
      if (!category) throw new Error('This idea references a category that is no longer available.');
      const selectedTags = idea.tagIds.flatMap((id) => {
        const tag = allTags.find((candidate) => candidate.id === id);
        return tag ? [tag] : [];
      });
      const nextBundle: LoadedIdea = {
        idea,
        category,
        tags: selectedTags,
        actions,
        capture,
        recording,
        transcript,
        allCategories,
        allTags,
      };
      setBundle(nextBundle);
      const nextForm = initializeIdeaDraftFormValue(idea, allTags);
      const nextSignature = formSignature(nextForm);
      setForm(nextForm);
      latestFormSignatureRef.current = nextSignature;
      savedFormSignatureRef.current = nextSignature;
      setSaveStatus('saved');
      setEditing(false);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'The idea could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [repositoryIdeaId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openActions = useMemo(
    () => bundle?.actions.filter((action) => action.status === 'open') ?? [],
    [bundle?.actions],
  );

  function change(patch: Partial<IdeaDraftFormValue>) {
    if (!form || busy) return;
    const nextForm = { ...form, ...patch };
    latestFormSignatureRef.current = formSignature(nextForm);
    setForm(nextForm);
    setSaveStatus('dirty');
    setErrors({});
    setMutationError(null);
    setNotice(null);
  }

  function beginEditing() {
    if (!bundle || busy) return;
    const nextForm = initializeIdeaDraftFormValue(bundle.idea, bundle.allTags);
    const nextSignature = formSignature(nextForm);
    setForm(nextForm);
    latestFormSignatureRef.current = nextSignature;
    savedFormSignatureRef.current = nextSignature;
    setSaveStatus('saved');
    setErrors({});
    setMutationError(null);
    setNotice(null);
    setEditing(true);
  }

  function discardUnsavedEdits() {
    if (!bundle || busy || saveStatus === 'saving') return;
    const nextForm = initializeIdeaDraftFormValue(bundle.idea, bundle.allTags);
    const nextSignature = formSignature(nextForm);
    setForm(nextForm);
    latestFormSignatureRef.current = nextSignature;
    savedFormSignatureRef.current = nextSignature;
    setSaveStatus('saved');
    setErrors({});
    setMutationError(null);
    setEditing(false);
  }

  function updateList(
    key: 'goals' | 'blockers' | 'questions' | 'suggestedActions',
    index: number,
    value?: GroundedText,
  ) {
    if (!form) return;
    change({
      [key]: value
        ? form[key].map((item, candidate) => (candidate === index ? value : item))
        : form[key].filter((_, candidate) => candidate !== index),
    });
  }

  const enqueueSave = useCallback((snapshot: IdeaDraftFormValue) => {
    if (!bundle) return Promise.resolve(false);

    const validation = validateIdeaDraftFormValue(bundle.idea, snapshot, bundle.allCategories);
    setErrors(validation.errors);
    if (!validation.valid) {
      setSaveStatus('invalid');
      return Promise.resolve(false);
    }

    const signature = formSignature(snapshot);
    if (signature === savedFormSignatureRef.current) {
      setSaveStatus('saved');
      return Promise.resolve(true);
    }

    const existing = savePromisesRef.current.get(signature);
    if (existing) return existing;

    const run = saveQueueRef.current.then(async () => {
      if (latestFormSignatureRef.current === signature) setSaveStatus('saving');
      setMutationError(null);

      try {
        const savedTags = await tagRepository.findOrCreate(snapshot.tagNames);
        const status = bundle.idea.status === 'archived' ? 'archived' : 'confirmed';
        const updated = await ideaRepository.update(
          bundle.idea.id,
          asUpdateInput(snapshot, savedTags.map((tag) => tag.id), status),
        );
        const allTags = mergeTags(bundle.allTags, savedTags);
        const category = bundle.allCategories.find((candidate) => candidate.id === updated.categoryId)!;
        savedFormSignatureRef.current = signature;
        setBundle((current) => current ? { ...current, idea: updated, category, tags: savedTags, allTags } : current);
        setErrors({});
        if (latestFormSignatureRef.current === signature) setSaveStatus('saved');
        return true;
      } catch (error) {
        if (latestFormSignatureRef.current === signature) setSaveStatus('error');
        setMutationError(error instanceof Error ? error.message : 'Changes could not be saved.');
        return false;
      }
    });

    saveQueueRef.current = run.then(() => undefined, () => undefined);
    savePromisesRef.current.set(signature, run);
    void run.finally(() => savePromisesRef.current.delete(signature));
    return run;
  }, [bundle]);

  useEffect(() => {
    if (!editing || !form || !bundle || busy) return;

    const signature = formSignature(form);
    latestFormSignatureRef.current = signature;
    if (signature === savedFormSignatureRef.current) {
      setSaveStatus('saved');
      return;
    }

    setSaveStatus('dirty');
    const timer = window.setTimeout(() => {
      void enqueueSave(form);
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [bundle, busy, editing, enqueueSave, form]);

  async function saveChanges() {
    if (!form || busy) return;
    setBusy(true);
    setNotice(null);
    try {
      const saved = await enqueueSave(form);
      if (!saved) {
        setMutationError((current) => current ?? 'Review the highlighted fields before saving.');
        return;
      }
      setNotice('Changes saved on this device.');
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  async function toggleArchive() {
    if (!bundle || busy) return;
    const archiving = bundle.idea.status !== 'archived';
    if (
      archiving &&
      openActions.length > 0 &&
      !window.confirm(`Archive this idea with ${openActions.length} open action${openActions.length === 1 ? '' : 's'}?`)
    ) return;

    setBusy(true);
    setMutationError(null);
    setNotice(null);
    try {
      await ideaRepository.setArchived(bundle.idea.id, archiving);
      const idea = { ...bundle.idea, status: archiving ? 'archived' as const : 'confirmed' as const, updatedAt: Date.now() };
      setBundle({ ...bundle, idea });
      setNotice(archiving ? 'Idea archived.' : 'Idea restored.');
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'The idea status could not be changed.');
    } finally {
      setBusy(false);
    }
  }

  async function copySummary() {
    if (!form) return;
    setMutationError(null);
    try {
      await copyText(form.summary.text);
      setNotice('Summary copied.');
    } catch {
      setMutationError('The summary could not be copied. Select the summary text and copy it manually.');
    }
  }

  function exportIdea(format: 'markdown' | 'json') {
    if (!bundle) return;
    const filename = slugifyIdeaFilename(bundle.idea.title, bundle.idea.id);
    if (format === 'markdown') {
      downloadText(`${filename}.md`, ideaToMarkdown(bundle), 'text/markdown;charset=utf-8');
    } else {
      downloadText(`${filename}.json`, ideaToJson(bundle), 'application/json;charset=utf-8');
    }
    setNotice(`${format === 'markdown' ? 'Markdown' : 'JSON'} export downloaded.`);
  }

  if (loading) return <p aria-live="polite" className="px-4 py-12 text-[#6E6B67]">Loading idea…</p>;
  if (loadError) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12" role="alert">
        <h1 className="text-3xl text-[#101D36]">Idea unavailable</h1>
        <p className="mt-3 text-[#6E6B67]">{loadError}</p>
        <button className="button-primary mt-6" onClick={() => void load()} type="button">Try again</button>
      </section>
    );
  }
  if (!bundle || !form) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl text-[#101D36]">Idea not found</h1>
        <p className="mt-3 text-[#6E6B67]">It may have been deleted, or it may still be waiting for confirmation.</p>
        <Link className="button-primary mt-6 inline-flex" href="/ideas">Back to Ideas</Link>
      </section>
    );
  }

  const idea = bundle.idea;
  const isSample = idea.id.startsWith('demo-');
  const sectionClass = 'border-t border-[#E8DDCE] py-7';
  const saveStatusMessage = {
    saved: 'Saved on this device',
    dirty: 'Changes waiting to save',
    saving: 'Saving…',
    invalid: 'Fix highlighted fields to save',
    error: 'Could not save changes',
  }[saveStatus];

  return (
    <article className="mx-auto max-w-3xl px-4 pb-28 pt-8 sm:px-6">
      {editing ? (
        <div className="idea-detail__editor">
          <div className="idea-detail__save-bar">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8A5700]">Auto-save</p>
              <p aria-live="polite" className="mt-1 text-sm font-semibold text-[#101D36]" role="status">{saveStatusMessage}</p>
            </div>
            <button className="button-primary min-h-11" disabled={busy} onClick={() => void saveChanges()} type="button">
              {busy ? 'Saving…' : 'Done'}
            </button>
          </div>
          <header className="pb-7">
        <p className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#247A55]">
          {isSample ? <span className="rounded-full bg-[#FFF2D4] px-2 py-1 text-[#8A5700]">Sample</span> : null}
          <span>{idea.status === 'archived' ? 'Archived idea' : 'Saved idea'}</span>
        </p>
        <label className="mt-4 block text-sm font-semibold text-[#101D36]" htmlFor={`idea-title-${idea.id}`}>Title</label>
        <input
          aria-invalid={Boolean(errors.title)}
          className="mt-2 min-h-12 w-full border-b border-[#E5A11A] bg-transparent text-3xl font-semibold leading-tight text-[#101D36] outline-none focus:ring-2 focus:ring-[#E5A11A]"
          disabled={busy}
          id={`idea-title-${idea.id}`}
          maxLength={120}
          onChange={(event) => change({ title: event.target.value })}
          value={form.title}
        />
        {errors.title ? <p className="field-error" role="alert">{errors.title}</p> : null}
        <p className="mt-3 text-sm text-[#6E6B67]">Updated {formatDate(idea.updatedAt)}</p>
      </header>

          <div className="idea-form">
        <section className={sectionClass}>
          <GroundedFieldEditor
            disabled={busy}
            error={errors.summary}
            label="Summary"
            onChange={(summary) => change({ summary })}
            sourceSpans={idea.sourceSpans}
            value={form.summary}
          />
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor={`idea-category-${idea.id}`}>Category</label>
              <select
                aria-invalid={Boolean(errors.categoryId)}
                disabled={busy}
                id={`idea-category-${idea.id}`}
                onChange={(event) => change({ categoryId: event.target.value })}
                value={form.categoryId}
              >
                {bundle.allCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              {errors.categoryId ? <p className="field-error" role="alert">{errors.categoryId}</p> : null}
            </div>
            <TagEditor disabled={busy} error={errors.tagNames} onChange={(tagNames) => change({ tagNames })} suggestions={bundle.allTags} value={form.tagNames} />
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-semibold text-[#101D36]">Purpose</h2>
          {form.purpose ? (
            <GroundedFieldEditor disabled={busy} error={errors.purpose} label="Purpose" onChange={(purpose) => change({ purpose })} onRemove={() => change({ purpose: undefined })} sourceSpans={idea.sourceSpans} value={form.purpose} />
          ) : (
            <button className="review-add-button" disabled={busy} onClick={() => change({ purpose: createInferredGroundedText() })} type="button">+ Add purpose</button>
          )}
        </section>

        {([
          ['goals', 'Goals', 'goal'],
          ['blockers', 'Blockers', 'blocker'],
          ['questions', 'Open questions', 'question'],
          ['suggestedActions', 'Suggested actions', 'suggested action'],
        ] as const).map(([key, heading, singular]) => (
          <section className={sectionClass} key={key}>
            <h2 className="text-xl font-semibold text-[#101D36]">{heading}</h2>
            {form[key].map((item, index) => (
              <GroundedFieldEditor
                disabled={busy}
                error={errors[`grounded.${item.id}`]}
                key={item.id}
                label={`${singular[0]!.toUpperCase()}${singular.slice(1)} ${index + 1}`}
                onChange={(value) => updateList(key, index, value)}
                onRemove={() => updateList(key, index)}
                sourceSpans={idea.sourceSpans}
                value={item}
              />
            ))}
            <button className="review-add-button" disabled={busy || form[key].length >= 8} onClick={() => change({ [key]: [...form[key], createInferredGroundedText()] })} type="button">+ Add {singular}</button>
          </section>
        ))}

        <section className={sectionClass}>
          <h2 className="text-xl font-semibold text-[#101D36]">Problem</h2>
          {form.problem ? (
            <>
              <GroundedFieldEditor disabled={busy} error={errors.problem} label="Problem statement" onChange={(statement) => change({ problem: { ...form.problem!, statement } })} onRemove={() => change({ problem: undefined })} sourceSpans={idea.sourceSpans} value={form.problem.statement} />
              <label htmlFor={`problem-type-${idea.id}`}>Problem type</label>
              <input aria-invalid={Boolean(errors['problem.type'])} disabled={busy} id={`problem-type-${idea.id}`} maxLength={80} onChange={(event) => change({ problem: { ...form.problem!, type: event.target.value || undefined } })} type="text" value={form.problem.type ?? ''} />
              {errors['problem.type'] ? <p className="field-error" role="alert">{errors['problem.type']}</p> : null}
            </>
          ) : <button className="review-add-button" disabled={busy} onClick={() => change({ problem: { statement: createInferredGroundedText() } })} type="button">+ Add problem</button>}
        </section>

        <section className={sectionClass}>
          <h2 className="text-xl font-semibold text-[#101D36]">Research needed</h2>
          <label className="review-checkbox">
            <input checked={form.research.needed} disabled={busy} onChange={(event) => change({ research: { ...form.research, needed: event.target.checked } })} type="checkbox" />
            This idea needs research
          </label>
          {form.research.assessment ? (
            <GroundedFieldEditor disabled={busy} error={errors['research.assessment']} label="Research assessment" onChange={(assessment) => change({ research: { ...form.research, assessment } })} onRemove={() => change({ research: { ...form.research, assessment: undefined } })} sourceSpans={idea.sourceSpans} value={form.research.assessment} />
          ) : form.research.needed ? <button className="review-add-button" disabled={busy} onClick={() => change({ research: { ...form.research, assessment: createInferredGroundedText() } })} type="button">+ Add research assessment</button> : null}
          <label htmlFor={`research-searches-${idea.id}`}>Suggested searches</label>
          <textarea aria-invalid={Boolean(errors['research.suggestedQueries'])} disabled={busy} id={`research-searches-${idea.id}`} onChange={(event) => change({ research: { ...form.research, suggestedQueries: event.target.value.split('\n') } })} rows={3} value={form.research.suggestedQueries.join('\n')} />
          {errors['research.suggestedQueries'] ? <p className="field-error" role="alert">{errors['research.suggestedQueries']}</p> : null}
          <label htmlFor={`research-resources-${idea.id}`}>Suggested resource types</label>
          <textarea aria-invalid={Boolean(errors['research.suggestedResourceTypes'])} disabled={busy} id={`research-resources-${idea.id}`} onChange={(event) => change({ research: { ...form.research, suggestedResourceTypes: event.target.value.split('\n') } })} rows={3} value={form.research.suggestedResourceTypes.join('\n')} />
          {errors['research.suggestedResourceTypes'] ? <p className="field-error" role="alert">{errors['research.suggestedResourceTypes']}</p> : null}
          <p className="field-guidance">Use one suggestion per line.</p>
        </section>
          </div>
        </div>
      ) : (
        <IdeaSummaryView
          activation={bundle.idea.status === 'confirmed' ? (
            <IdeaActivationCard actions={bundle.actions} category={bundle.category} idea={bundle.idea} tags={bundle.tags} transcript={bundle.transcript} />
          ) : undefined}
          actions={bundle.actions}
          category={bundle.category}
          disabled={busy}
          idea={bundle.idea}
          onEdit={beginEditing}
          tags={bundle.tags}
        />
      )}

      <section className={sectionClass} aria-labelledby="linked-actions-heading">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-[#101D36]" id="linked-actions-heading">Linked actions</h2>
          <Link className="text-sm font-semibold text-[#9A6500] underline" href="/actions">Open Actions</Link>
        </div>
        <ActionList actions={bundle.actions} />
      </section>

      <details className={`${sectionClass} group`}>
        <summary className="min-h-12 cursor-pointer py-3 text-xl font-semibold text-[#101D36] focus:outline-none focus:ring-2 focus:ring-[#E5A11A]">{isSample ? 'Sample transcript—no recording' : 'Source recording'}</summary>
        <div className="space-y-5 pb-3 pt-2">
          {bundle.capture ? <p className="text-sm text-[#6E6B67]">Capture {bundle.capture.id} · {formatDate(bundle.capture.createdAt)}</p> : <p className="text-sm text-[#6E6B67]">Source capture metadata is unavailable.</p>}
          {isSample ? <p className="text-sm text-[#6E6B67]">This local sample includes a transcript but no recording Blob.</p> : <AudioPlayer recording={bundle.recording} />}
          {bundle.transcript ? (
            <div>
              <h3 className="font-semibold text-[#101D36]">Transcript</h3>
              <p className="mt-2 whitespace-pre-wrap text-[#101D36]">{bundle.transcript.text}</p>
            </div>
          ) : <p className="text-sm text-[#6E6B67]">No local transcript found.</p>}
        </div>
      </details>

      {mutationError ? <p className="mt-5 border-l-4 border-red-700 bg-red-50 p-4 text-red-800" role="alert">{mutationError}</p> : null}
      {notice ? <p aria-live="polite" className="mt-5 border-l-4 border-[#247A55] bg-green-50 p-4 text-[#14553A]">{notice}</p> : null}

      <section className="mt-7 flex flex-wrap gap-3 border-t border-[#E8DDCE] pt-7" aria-label="Idea actions">
        {editing ? (
          <>
            <button className="button-primary min-h-12" disabled={busy} onClick={() => void saveChanges()} type="button">{busy ? 'Saving…' : 'Save changes'}</button>
            <button className="button-quiet min-h-12" disabled={busy || saveStatus === 'saving' || saveStatus === 'saved'} onClick={discardUnsavedEdits} type="button">Discard unsaved edits</button>
          </>
        ) : null}
        <button className="button-quiet min-h-12" disabled={busy} onClick={() => void copySummary()} type="button">Copy summary</button>
        <button className="button-quiet min-h-12" disabled={busy} onClick={() => exportIdea('markdown')} type="button">Export Markdown</button>
        <button className="button-quiet min-h-12" disabled={busy} onClick={() => exportIdea('json')} type="button">Export JSON</button>
        <button className="review-text-button review-text-button--danger min-h-12" disabled={busy} onClick={() => void toggleArchive()} type="button">{idea.status === 'archived' ? 'Restore idea' : 'Archive idea'}</button>
      </section>
    </article>
  );
}
