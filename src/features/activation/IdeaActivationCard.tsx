'use client';

import { useEffect, useMemo, useState } from 'react';
import { ConsentSheet } from '@/components/ConsentSheet';
import {
  ACTIVATION_SCHEMA_VERSION,
  buildActivationIdeaContext,
  buildLocalActivationBrief,
  generateActivationBrief,
  LOCAL_ACTIVATION_PROMPT_VERSION,
} from '@/lib/activation';
import { downloadText, slugifyIdeaFilename } from '@/lib/export/download';
import { activationBriefRepository, settingsRepository } from '@/lib/repositories';
import type { ActionItem, ActivationBrief, ActivationIntent, Category, Idea, Tag, Transcript } from '@/types';

const INTENTS: Array<{ id: ActivationIntent; title: string; description: string }> = [
  { id: 'explore', title: 'Explore this idea', description: 'Find promising directions, tradeoffs, and open questions.' },
  { id: 'plan', title: 'Create a plan', description: 'Shape a smallest useful version and ordered next steps.' },
  { id: 'agent', title: 'Prepare for an AI agent', description: 'Build a grounded, self-contained prompt another AI can act on.' },
];

interface IdeaActivationCardProps {
  idea: Idea;
  category: Category;
  tags: Tag[];
  actions: ActionItem[];
  transcript?: Transcript;
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Installed PWAs and older mobile browsers can expose Clipboard without
      // allowing it. Fall through to the synchronous selection-based copy.
    }
  }
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

function briefToMarkdown(record: ActivationBrief) {
  const { brief } = record;
  const section = (heading: string, values: string[]) => values.length
    ? `\n## ${heading}\n\n${values.map((value) => `- ${value}`).join('\n')}\n`
    : '';
  return [
    `# ${brief.title}`,
    '',
    `**Intent:** ${record.intent}`,
    `**Created with:** ${record.provider === 'openai' ? record.model ?? 'OpenAI' : 'Local template'}`,
    '',
    '## Objective', '', brief.objective, '', '## Context', '', brief.context,
    section('Assumptions', brief.assumptions),
    section('Constraints', brief.constraints),
    section('Deliverables', brief.deliverables),
    section('Success criteria', brief.successCriteria),
    '\n## AI-ready prompt\n', brief.prompt, '',
  ].join('\n').replace(/\n{3,}/g, '\n\n');
}

function DetailList({ title, values }: { title: string; values: string[] }) {
  if (!values.length) return null;
  return <section className="activation-brief__section"><h4>{title}</h4><ul>{values.map((value) => <li key={value}>{value}</li>)}</ul></section>;
}

export function IdeaActivationCard({ idea, category, tags, actions, transcript }: IdeaActivationCardProps) {
  const [open, setOpen] = useState(false);
  const [intent, setIntent] = useState<ActivationIntent | null>(null);
  const [includeTranscript, setIncludeTranscript] = useState(false);
  const [record, setRecord] = useState<ActivationBrief | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [questionsDismissed, setQuestionsDismissed] = useState(false);

  const context = useMemo(() => buildActivationIdeaContext({ idea, category, tags, actions, transcript, includeTranscript }), [actions, category, idea, includeTranscript, tags, transcript]);

  useEffect(() => {
    if (!open) {
      setIntent(null); setIncludeTranscript(false); setRecord(null); setAnswers({}); setPrompt('');
      setError(null); setNotice(null); setQuestionsDismissed(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) setOpen(false);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [busy, open]);

  async function chooseIntent(nextIntent: ActivationIntent) {
    setIntent(nextIntent); setError(null); setNotice(null); setQuestionsDismissed(false);
    try {
      const existing = await activationBriefRepository.get(idea.id, nextIntent);
      setRecord(existing ?? null);
      setPrompt(existing?.brief.prompt ?? '');
      setIncludeTranscript(existing?.includeTranscript ?? false);
      setAnswers(Object.fromEntries(existing?.clarifyingQuestions.flatMap((question) => question.answer ? [[question.id, question.answer]] : []) ?? []));
    } catch (caught) {
      setIntent(null);
      setError(caught instanceof Error ? caught.message : 'Saved briefs could not be loaded on this device.');
    }
  }

  async function saveResult(input: {
    result: { needsClarification: boolean; clarifyingQuestions: Array<{ id: string; question: string; reason: string }>; brief: ActivationBrief['brief'] };
    provider: 'local' | 'openai'; model?: string; responseId?: string; promptVersion: string; schemaVersion: string;
  }) {
    if (!intent) return;
    const saved = await activationBriefRepository.save({
      ideaId: idea.id, intent, includeTranscript,
      needsClarification: input.result.needsClarification,
      clarifyingQuestions: input.result.clarifyingQuestions.map((question) => ({ ...question, answer: answers[question.id]?.trim() || undefined })),
      brief: input.result.brief, provider: input.provider, model: input.model, responseId: input.responseId,
      promptVersion: input.promptVersion, schemaVersion: input.schemaVersion,
    });
    setRecord(saved); setPrompt(saved.brief.prompt); setQuestionsDismissed(false);
  }

  async function createLocally() {
    if (!intent) return;
    setBusy(true); setError(null); setNotice(null);
    try {
      await saveResult({
        result: { needsClarification: false, clarifyingQuestions: [], brief: buildLocalActivationBrief(intent, context) },
        provider: 'local', promptVersion: LOCAL_ACTIVATION_PROMPT_VERSION, schemaVersion: ACTIVATION_SCHEMA_VERSION,
      });
      setNotice('Draft created and saved on this device.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The local draft could not be created.');
    } finally { setBusy(false); }
  }

  async function requestCloudConsent() {
    if (!intent) return;
    setError(null);
    const settings = await settingsRepository.get();
    if (settings.cloudProcessingConsent !== 'granted') { setConsentOpen(true); return; }
    await createWithGpt(settings.clientId);
  }

  async function confirmConsent() {
    setBusy(true);
    try {
      const settings = await settingsRepository.update({ cloudProcessingConsent: 'granted' });
      setConsentOpen(false);
      await createWithGpt(settings.clientId, true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Consent could not be saved.');
      setBusy(false);
    }
  }

  async function createWithGpt(safetyIdentifier: string, alreadyBusy = false) {
    if (!intent) return;
    if (!alreadyBusy) setBusy(true);
    setError(null); setNotice(null);
    try {
      const response = await generateActivationBrief({
        ideaId: idea.id, intent, idea: context,
        answers: Object.entries(answers).filter(([, answer]) => answer.trim()).map(([questionId, answer]) => ({
          questionId,
          question: record?.clarifyingQuestions.find((candidate) => candidate.id === questionId)?.question ?? questionId,
          answer: answer.trim(),
        })),
        safetyIdentifier,
      });
      await saveResult(response);
      setNotice(response.result.needsClarification ? 'A usable draft is ready. Answer only the questions that would improve it.' : 'GPT-5.6 brief saved on this device.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'GPT-5.6 could not create the brief.');
    } finally { setBusy(false); }
  }

  async function savePrompt() {
    if (!record) return;
    setBusy(true); setError(null);
    try {
      const saved = await activationBriefRepository.updatePrompt(record.ideaId, record.intent, prompt);
      setRecord(saved); setNotice('Prompt edits saved on this device.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Prompt edits could not be saved.');
    } finally { setBusy(false); }
  }

  async function copyPrompt() {
    try { await copyText(prompt); setNotice('AI-ready prompt copied.'); }
    catch { setError('The prompt could not be copied. Select it and copy it manually.'); }
  }

  function downloadBrief() {
    if (!record) return;
    const filename = `${slugifyIdeaFilename(idea.title, idea.id)}-${record.intent}-brief.md`;
    downloadText(filename, briefToMarkdown({ ...record, brief: { ...record.brief, prompt } }), 'text/markdown;charset=utf-8');
    setNotice('AI-ready brief exported.');
  }

  const selected = INTENTS.find((candidate) => candidate.id === intent);
  return (
    <>
      <section className="activation-card" aria-labelledby={`activation-card-${idea.id}`}>
        <p className="activation-card__eyebrow">Optional next step</p>
        <h2 id={`activation-card-${idea.id}`}>Work with this idea</h2>
        <p>Turn this saved Nugget into an exploration, an action plan, or a grounded brief for another AI.</p>
        <button className="button-primary" onClick={() => setOpen(true)} type="button">Choose what to do</button>
      </section>

      {open ? (
        <div className="activation-dialog-backdrop" role="presentation">
          <section aria-labelledby="activation-dialog-title" aria-modal="true" className="activation-dialog" role="dialog">
            <header className="activation-dialog__header">
              <div><p className="activation-card__eyebrow">Work with this idea</p><h2 id="activation-dialog-title">{selected?.title ?? 'What do you want to make?'}</h2></div>
              <button aria-label="Close" className="activation-dialog__close" disabled={busy} onClick={() => setOpen(false)} type="button">×</button>
            </header>

            {!intent ? (
              <div className="activation-intents">
                {INTENTS.map((choice) => <button key={choice.id} onClick={() => void chooseIntent(choice.id)} type="button"><strong>{choice.title}</strong><span>{choice.description}</span></button>)}
                <p className="activation-dialog__privacy">Nothing is sent anywhere until you choose GPT-5.6 and confirm cloud processing.</p>
              </div>
            ) : record ? (
              <div className="activation-brief">
                <div className="activation-brief__meta"><span>{record.provider === 'openai' ? `Enhanced with ${record.model ?? 'GPT-5.6'}` : 'Created locally'}</span><button className="activation-link" disabled={busy} onClick={() => { setRecord(null); setAnswers({}); }} type="button">Create a new version</button></div>
                {record.needsClarification && !questionsDismissed ? (
                  <section className="activation-questions" aria-labelledby="activation-questions-title">
                    <h3 id="activation-questions-title">A few answers could sharpen this</h3><p>The draft below is already usable. Answer what matters, or continue as-is.</p>
                    {record.clarifyingQuestions.map((question) => <label key={question.id}><span>{question.question}</span><small>{question.reason}</small><textarea disabled={busy} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} rows={2} value={answers[question.id] ?? ''} /></label>)}
                    <div className="activation-actions"><button className="button-primary" disabled={busy} onClick={() => void requestCloudConsent()} type="button">{busy ? 'Updating…' : 'Update brief with answers'}</button><button className="button-quiet" disabled={busy} onClick={() => setQuestionsDismissed(true)} type="button">Continue with draft</button></div>
                  </section>
                ) : null}
                <h3 className="activation-brief__title">{record.brief.title}</h3>
                <section className="activation-brief__section"><h4>Objective</h4><p>{record.brief.objective}</p></section>
                <section className="activation-brief__section"><h4>Context</h4><p className="whitespace-pre-wrap">{record.brief.context}</p></section>
                <DetailList title="Assumptions" values={record.brief.assumptions} /><DetailList title="Constraints" values={record.brief.constraints} /><DetailList title="Deliverables" values={record.brief.deliverables} /><DetailList title="Success criteria" values={record.brief.successCriteria} />
                <label className="activation-prompt"><span>AI-ready prompt</span><small>Edit this before copying or exporting it.</small><textarea disabled={busy} onChange={(event) => setPrompt(event.target.value)} rows={12} value={prompt} /></label>
                <div className="activation-actions activation-actions--sticky"><button className="button-primary" disabled={busy || !prompt.trim()} onClick={() => void copyPrompt()} type="button">Copy prompt</button><button className="button-quiet" disabled={busy || !prompt.trim()} onClick={() => void savePrompt()} type="button">Save edits</button><button className="button-quiet" disabled={busy || !prompt.trim()} onClick={downloadBrief} type="button">Download .md</button></div>
              </div>
            ) : (
              <div className="activation-setup">
                <button className="activation-link" disabled={busy} onClick={() => setIntent(null)} type="button">← Change intent</button>
                <p>Use only the organized idea, or optionally include its source transcript for more context.</p>
                <label className="activation-checkbox"><input checked={includeTranscript} disabled={busy || !transcript} onChange={(event) => setIncludeTranscript(event.target.checked)} type="checkbox" /><span><strong>Include source transcript</strong><small>{transcript ? 'Off by default. The transcript is included only for this brief.' : 'No transcript is available for this idea.'}</small></span></label>
                <div className="activation-actions"><button className="button-primary" disabled={busy} onClick={() => void requestCloudConsent()} type="button">{busy ? 'Creating…' : 'Enhance with GPT-5.6'}</button><button className="button-quiet" disabled={busy} onClick={() => void createLocally()} type="button">Create locally</button></div>
                <p className="activation-dialog__privacy">Local creates a deterministic, editable template without a network request.</p>
              </div>
            )}

            {error ? <div className="activation-error" role="alert"><p>{error}</p>{intent ? <button className="activation-link" disabled={busy} onClick={() => void createLocally()} type="button">Create locally instead</button> : null}</div> : null}
            {notice ? <p aria-live="polite" className="activation-notice" role="status">{notice}</p> : null}
          </section>
        </div>
      ) : null}

      <ConsentSheet busy={busy} dataLabel={includeTranscript ? 'organized idea and source transcript' : 'organized idea'} onCancel={() => setConsentOpen(false)} onConfirm={() => void confirmConsent()} open={consentOpen} providerLabel="OpenAI (GPT-5.6)" purpose="create an editable AI-ready brief" />
    </>
  );
}
