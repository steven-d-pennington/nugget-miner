'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { normalizeLabel } from '@/lib/normalization/labels';
import type { Category, GroundedText, Idea, Tag } from '@/types';
import { GroundedFieldEditor } from './GroundedFieldEditor';
import { hasValidExplicitEvidence } from './SourceExcerpt';
import { MAX_TAG_LENGTH, MAX_TAGS, TagEditor } from './TagEditor';

export interface IdeaDraftFormValue {
  title: string;
  summary: GroundedText;
  purpose?: GroundedText;
  goals: GroundedText[];
  problem?: Idea['problem'];
  blockers: GroundedText[];
  questions: GroundedText[];
  suggestedActions: GroundedText[];
  acceptedActionSuggestionIds: string[];
  research: Idea['research'];
  categoryId: string;
  tagNames: string[];
}

export interface IdeaDraftValidation {
  valid: boolean;
  errors: Record<string, string>;
}

const MAX_RESEARCH_SUGGESTIONS = 5;
const MAX_GROUNDED_LIST_ITEMS = 8;

function copyGrounded(value: GroundedText): GroundedText {
  return { ...value, sourceSpanIds: [...value.sourceSpanIds] };
}

export function initializeIdeaDraftFormValue(idea: Idea, tags: Tag[]): IdeaDraftFormValue {
  const tagsById = new Map(tags.map((tag) => [tag.id, tag.name]));

  return {
    title: idea.title,
    summary: copyGrounded(idea.summary),
    purpose: idea.purpose ? copyGrounded(idea.purpose) : undefined,
    goals: idea.goals.map(copyGrounded),
    problem: idea.problem
      ? {
          ...idea.problem,
          statement: copyGrounded(idea.problem.statement),
        }
      : undefined,
    blockers: idea.blockers.map(copyGrounded),
    questions: idea.questions.map(copyGrounded),
    suggestedActions: idea.suggestedActions.map(copyGrounded),
    acceptedActionSuggestionIds: [],
    research: {
      ...idea.research,
      assessment: idea.research.assessment ? copyGrounded(idea.research.assessment) : undefined,
      suggestedQueries: [...idea.research.suggestedQueries],
      suggestedResourceTypes: [...idea.research.suggestedResourceTypes],
    },
    categoryId: idea.categoryId,
    tagNames: idea.tagIds.flatMap((id) => {
      const name = tagsById.get(id);
      return name ? [name] : [];
    }),
  };
}

export function createInferredGroundedText(text = ''): GroundedText {
  return {
    id: crypto.randomUUID(),
    text,
    basis: 'inferred',
    sourceSpanIds: [],
  };
}

function groundedFields(value: IdeaDraftFormValue) {
  return [
    { path: 'summary', value: value.summary },
    ...(value.purpose ? [{ path: 'purpose', value: value.purpose }] : []),
    ...value.goals.map((field) => ({ path: `grounded.${field.id}`, value: field })),
    ...(value.problem ? [{ path: 'problem', value: value.problem.statement }] : []),
    ...value.blockers.map((field) => ({ path: `grounded.${field.id}`, value: field })),
    ...value.questions.map((field) => ({ path: `grounded.${field.id}`, value: field })),
    ...value.suggestedActions.map((field) => ({ path: `grounded.${field.id}`, value: field })),
    ...(value.research.assessment ? [{ path: 'research.assessment', value: value.research.assessment }] : []),
  ];
}

export function validateIdeaDraftFormValue(
  idea: Idea,
  value: IdeaDraftFormValue,
  categories: Category[],
): IdeaDraftValidation {
  const errors: Record<string, string> = {};
  const title = value.title.trim();
  if (!title) errors.title = 'Add a title before confirming.';
  else if (title.length > 120) errors.title = 'Keep the title to 120 characters or fewer.';

  const categoryExists = categories.some((category) => category.id === value.categoryId);
  if (!categoryExists) errors.categoryId = 'Choose an available category before confirming.';

  for (const key of ['goals', 'blockers', 'questions', 'suggestedActions'] as const) {
    if (value[key].length > MAX_GROUNDED_LIST_ITEMS) {
      const label = key === 'suggestedActions' ? 'suggested actions' : key;
      errors[key] = `Keep up to ${MAX_GROUNDED_LIST_ITEMS} ${label}.`;
    }
  }
  if (value.problem?.type && value.problem.type.length > 80) {
    errors['problem.type'] = 'Keep the problem type to 80 characters or fewer.';
  }

  if (value.tagNames.length > MAX_TAGS) errors.tagNames = `Use up to ${MAX_TAGS} tags.`;
  const seenTags = new Set<string>();
  for (const tag of value.tagNames) {
    const normalized = normalizeLabel(tag);
    if (!normalized) {
      errors.tagNames = 'Tags cannot be blank.';
      break;
    }
    if (tag.trim().replace(/\s+/g, ' ').length > MAX_TAG_LENGTH) {
      errors.tagNames = `Tags must be ${MAX_TAG_LENGTH} characters or fewer.`;
      break;
    }
    if (seenTags.has(normalized)) {
      errors.tagNames = 'Tags must be unique.';
      break;
    }
    seenTags.add(normalized);
  }

  if (
    value.research.suggestedQueries.length > MAX_RESEARCH_SUGGESTIONS ||
    value.research.suggestedQueries.some((query) => !query.trim())
  ) {
    errors['research.suggestedQueries'] = `Keep up to ${MAX_RESEARCH_SUGGESTIONS} nonblank suggested searches.`;
  }
  if (
    value.research.suggestedResourceTypes.length > MAX_RESEARCH_SUGGESTIONS ||
    value.research.suggestedResourceTypes.some((resourceType) => !resourceType.trim())
  ) {
    errors['research.suggestedResourceTypes'] = `Keep up to ${MAX_RESEARCH_SUGGESTIONS} nonblank resource types.`;
  }

  const seenGroundedIds = new Set<string>();
  for (const field of groundedFields(value)) {
    if (!field.value.text.trim()) {
      errors[field.path] = 'Remove this field or add some detail.';
    }
    if (!field.value.id.trim() || seenGroundedIds.has(field.value.id)) {
      errors[field.path] = 'This field no longer has a valid stable identity.';
    }
    seenGroundedIds.add(field.value.id);
    if (
      field.value.basis === 'explicit' &&
      (new Set(field.value.sourceSpanIds).size !== field.value.sourceSpanIds.length ||
        !hasValidExplicitEvidence(field.value, idea.sourceSpans))
    ) {
      errors[field.path] = 'Explicit content needs valid supporting transcript evidence.';
    }
  }

  const originalSuggestionIds = new Set(idea.suggestedActions.map((action) => action.id));
  const retainedSuggestionIds = new Set(value.suggestedActions.map((action) => action.id));
  for (const acceptedId of value.acceptedActionSuggestionIds) {
    if (!originalSuggestionIds.has(acceptedId) || !retainedSuggestionIds.has(acceptedId)) {
      errors.acceptedActionSuggestionIds = 'Only retained suggestions from the original draft can become actions.';
      break;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

interface IdeaCandidateFormProps {
  idea: Idea;
  categories: Category[];
  tags: Tag[];
  value: IdeaDraftFormValue;
  onChange(value: IdeaDraftFormValue): void;
  onConfirm(): void;
  onDiscard(): void;
  discardError?: string;
  busy: boolean;
}

function RuledSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="idea-form__section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function AddButton({ label, onClick, disabled }: { label: string; onClick(): void; disabled: boolean }) {
  return (
    <button aria-label={`Add ${label}`} className="review-add-button" disabled={disabled} onClick={onClick} type="button">
      + Add {label}
    </button>
  );
}

export function IdeaCandidateForm({
  idea,
  categories,
  tags,
  value,
  onChange,
  onConfirm,
  onDiscard,
  discardError,
  busy,
}: IdeaCandidateFormProps) {
  const [attemptedConfirm, setAttemptedConfirm] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const discardButtonRef = useRef<HTMLButtonElement>(null);
  const discardDialogRef = useRef<HTMLDialogElement>(null);
  const discardCancelRef = useRef<HTMLButtonElement>(null);
  const discardConfirmRef = useRef<HTMLButtonElement>(null);
  const validation = useMemo(
    () => validateIdeaDraftFormValue(idea, value, categories),
    [categories, idea, value],
  );
  const errors = attemptedConfirm ? validation.errors : {};
  const originalSuggestionIds = useMemo(
    () => new Set(idea.suggestedActions.map((action) => action.id)),
    [idea.suggestedActions],
  );

  useEffect(() => {
    if (!discardOpen) return;
    const dialog = discardDialogRef.current;
    if (dialog && typeof dialog.showModal === 'function' && !dialog.open) {
      try {
        dialog.showModal();
      } catch {
        dialog.setAttribute('open', '');
      }
    } else dialog?.setAttribute('open', '');
    discardCancelRef.current?.focus();
  }, [discardOpen]);

  useEffect(() => {
    if (discardOpen && discardError) discardConfirmRef.current?.focus();
  }, [discardError, discardOpen]);

  function closeDiscardConfirmation() {
    const dialog = discardDialogRef.current;
    if (dialog?.open && typeof dialog.close === 'function') dialog.close();
    setDiscardOpen(false);
    discardButtonRef.current?.focus();
  }

  function change(patch: Partial<IdeaDraftFormValue>) {
    if (!busy) onChange({ ...value, ...patch });
  }

  function updateGroundedList(
    key: 'goals' | 'blockers' | 'questions' | 'suggestedActions',
    index: number,
    next?: GroundedText,
  ) {
    const list = value[key];
    const removedId = list[index]?.id;
    const updated = next
      ? list.map((item, candidateIndex) => (candidateIndex === index ? next : item))
      : list.filter((_, candidateIndex) => candidateIndex !== index);
    const acceptedActionSuggestionIds =
      key === 'suggestedActions' && !next && removedId
        ? value.acceptedActionSuggestionIds.filter((id) => id !== removedId)
        : value.acceptedActionSuggestionIds;
    change({ [key]: updated, acceptedActionSuggestionIds });
  }

  function addGrounded(key: 'goals' | 'blockers' | 'questions' | 'suggestedActions') {
    change({ [key]: [...value[key], createInferredGroundedText()] });
  }

  function toggleAcceptedAction(id: string, checked: boolean) {
    const accepted = checked
      ? [...new Set([...value.acceptedActionSuggestionIds, id])]
      : value.acceptedActionSuggestionIds.filter((candidate) => candidate !== id);
    change({ acceptedActionSuggestionIds: accepted });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setAttemptedConfirm(true);
    if (validation.valid) onConfirm();
  }

  return (
    <form className="idea-form" noValidate onSubmit={submit}>
      <div className="idea-form__core">
        <label htmlFor={`idea-title-${idea.id}`}>Title</label>
        <input
          aria-describedby={errors.title ? `idea-title-${idea.id}-error` : undefined}
          aria-invalid={Boolean(errors.title)}
          disabled={busy}
          id={`idea-title-${idea.id}`}
          maxLength={120}
          onChange={(event) => change({ title: event.target.value })}
          type="text"
          value={value.title}
        />
        {errors.title ? (
          <p className="field-error" id={`idea-title-${idea.id}-error`} role="alert">
            {errors.title}
          </p>
        ) : null}

        <GroundedFieldEditor
          disabled={busy}
          error={errors.summary}
          label="Summary"
          onChange={(summary) => change({ summary })}
          sourceSpans={idea.sourceSpans}
          value={value.summary}
        />

        <label htmlFor={`idea-category-${idea.id}`}>Category</label>
        <select
          aria-describedby={errors.categoryId ? `idea-category-${idea.id}-error` : undefined}
          aria-invalid={Boolean(errors.categoryId)}
          disabled={busy}
          id={`idea-category-${idea.id}`}
          onChange={(event) => change({ categoryId: event.target.value })}
          value={value.categoryId}
        >
          <option value="">Choose a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.categoryId ? (
          <p className="field-error" id={`idea-category-${idea.id}-error`} role="alert">
            {errors.categoryId}
          </p>
        ) : null}

        <TagEditor
          disabled={busy}
          error={errors.tagNames}
          onChange={(tagNames) => change({ tagNames })}
          suggestions={tags}
          value={value.tagNames}
        />
      </div>

      <RuledSection title="Purpose">
        {value.purpose ? (
          <GroundedFieldEditor
            disabled={busy}
            error={errors.purpose}
            label="Purpose"
            onChange={(purpose) => change({ purpose })}
            onRemove={() => change({ purpose: undefined })}
            sourceSpans={idea.sourceSpans}
            value={value.purpose}
          />
        ) : (
          <AddButton disabled={busy} label="purpose" onClick={() => change({ purpose: createInferredGroundedText() })} />
        )}
      </RuledSection>

      <RuledSection title="Goals">
        {value.goals.map((goal, index) => (
          <GroundedFieldEditor
            disabled={busy}
            error={errors[`grounded.${goal.id}`]}
            key={goal.id}
            label={`Goal ${index + 1}`}
            onChange={(next) => updateGroundedList('goals', index, next)}
            onRemove={() => updateGroundedList('goals', index)}
            sourceSpans={idea.sourceSpans}
            value={goal}
          />
        ))}
        <AddButton
          disabled={busy || value.goals.length >= MAX_GROUNDED_LIST_ITEMS}
          label="goal"
          onClick={() => addGrounded('goals')}
        />
        {errors.goals ? (
          <p className="field-error" role="alert">
            {errors.goals}
          </p>
        ) : null}
      </RuledSection>

      <RuledSection title="Problem">
        {value.problem ? (
          <>
            <GroundedFieldEditor
              disabled={busy}
              error={errors.problem}
              label="Problem statement"
              onChange={(statement) => change({ problem: { ...value.problem!, statement } })}
              onRemove={() => change({ problem: undefined })}
              sourceSpans={idea.sourceSpans}
              value={value.problem.statement}
            />
            <label htmlFor={`problem-type-${idea.id}`}>Problem type</label>
            <input
              aria-describedby={errors['problem.type'] ? `problem-type-${idea.id}-error` : undefined}
              aria-invalid={Boolean(errors['problem.type'])}
              disabled={busy}
              id={`problem-type-${idea.id}`}
              maxLength={80}
              onChange={(event) =>
                change({
                  problem: {
                    ...value.problem!,
                    type: event.target.value || undefined,
                  },
                })
              }
              type="text"
              value={value.problem.type ?? ''}
            />
            {errors['problem.type'] ? (
              <p className="field-error" id={`problem-type-${idea.id}-error`} role="alert">
                {errors['problem.type']}
              </p>
            ) : null}
          </>
        ) : (
          <AddButton
            disabled={busy}
            label="problem"
            onClick={() => change({ problem: { statement: createInferredGroundedText() } })}
          />
        )}
      </RuledSection>

      {(
        [
          ['blockers', 'Blockers', 'blocker'],
          ['questions', 'Open questions', 'question'],
        ] as const
      ).map(([key, title, singular]) => (
        <RuledSection key={key} title={title}>
          {value[key].map((field, index) => (
            <GroundedFieldEditor
              disabled={busy}
              error={errors[`grounded.${field.id}`]}
              key={field.id}
              label={`${singular[0]!.toLocaleUpperCase()}${singular.slice(1)} ${index + 1}`}
              onChange={(next) => updateGroundedList(key, index, next)}
              onRemove={() => updateGroundedList(key, index)}
              sourceSpans={idea.sourceSpans}
              value={field}
            />
          ))}
          <AddButton
            disabled={busy || value[key].length >= MAX_GROUNDED_LIST_ITEMS}
            label={singular}
            onClick={() => addGrounded(key)}
          />
          {errors[key] ? (
            <p className="field-error" role="alert">
              {errors[key]}
            </p>
          ) : null}
        </RuledSection>
      ))}

      <RuledSection title="Research needed">
        <label className="review-checkbox">
          <input
            checked={value.research.needed}
            disabled={busy}
            onChange={(event) => change({ research: { ...value.research, needed: event.target.checked } })}
            type="checkbox"
          />
          This idea needs research
        </label>
        {value.research.assessment ? (
          <GroundedFieldEditor
            disabled={busy}
            error={errors['research.assessment']}
            label="Research assessment"
            onChange={(assessment) => change({ research: { ...value.research, assessment } })}
            onRemove={() => change({ research: { ...value.research, assessment: undefined } })}
            sourceSpans={idea.sourceSpans}
            value={value.research.assessment}
          />
        ) : value.research.needed ? (
          <AddButton
            disabled={busy}
            label="research assessment"
            onClick={() =>
              change({ research: { ...value.research, assessment: createInferredGroundedText() } })
            }
          />
        ) : null}
        {(value.research.needed || value.research.suggestedQueries.length > 0) && (
          <div className="review-string-list">
            <h3>Suggested searches</h3>
            {value.research.suggestedQueries.map((query, index) => (
              <div key={`query-${index}`}>
                <input
                  aria-label={`Suggested search ${index + 1}`}
                  disabled={busy}
                  onChange={(event) => {
                    const suggestedQueries = value.research.suggestedQueries.map((item, candidateIndex) =>
                      candidateIndex === index ? event.target.value : item,
                    );
                    change({ research: { ...value.research, suggestedQueries } });
                  }}
                  type="text"
                  value={query}
                />
                <button
                  aria-label={`Remove suggested search ${index + 1}`}
                  disabled={busy}
                  onClick={() =>
                    change({
                      research: {
                        ...value.research,
                        suggestedQueries: value.research.suggestedQueries.filter((_, candidateIndex) => candidateIndex !== index),
                      },
                    })
                  }
                  type="button"
                >
                  Remove
                </button>
              </div>
            ))}
            <AddButton
              disabled={busy || value.research.suggestedQueries.length >= MAX_RESEARCH_SUGGESTIONS}
              label="search"
              onClick={() =>
                change({
                  research: {
                    ...value.research,
                    suggestedQueries: [...value.research.suggestedQueries, ''],
                  },
                })
              }
            />
            {errors['research.suggestedQueries'] ? (
              <p className="field-error" role="alert">
                {errors['research.suggestedQueries']}
              </p>
            ) : null}
          </div>
        )}
        {(value.research.needed || value.research.suggestedResourceTypes.length > 0) && (
          <div className="review-string-list">
            <h3>Suggested resource types</h3>
            {value.research.suggestedResourceTypes.map((resource, index) => (
              <div key={`resource-${index}`}>
                <input
                  aria-label={`Suggested resource type ${index + 1}`}
                  disabled={busy}
                  onChange={(event) => {
                    const suggestedResourceTypes = value.research.suggestedResourceTypes.map((item, candidateIndex) =>
                      candidateIndex === index ? event.target.value : item,
                    );
                    change({ research: { ...value.research, suggestedResourceTypes } });
                  }}
                  type="text"
                  value={resource}
                />
                <button
                  aria-label={`Remove suggested resource type ${index + 1}`}
                  disabled={busy}
                  onClick={() =>
                    change({
                      research: {
                        ...value.research,
                        suggestedResourceTypes: value.research.suggestedResourceTypes.filter(
                          (_, candidateIndex) => candidateIndex !== index,
                        ),
                      },
                    })
                  }
                  type="button"
                >
                  Remove
                </button>
              </div>
            ))}
            <AddButton
              disabled={busy || value.research.suggestedResourceTypes.length >= MAX_RESEARCH_SUGGESTIONS}
              label="resource type"
              onClick={() =>
                change({
                  research: {
                    ...value.research,
                    suggestedResourceTypes: [...value.research.suggestedResourceTypes, ''],
                  },
                })
              }
            />
            {errors['research.suggestedResourceTypes'] ? (
              <p className="field-error" role="alert">
                {errors['research.suggestedResourceTypes']}
              </p>
            ) : null}
          </div>
        )}
      </RuledSection>

      <RuledSection title="Suggested actions">
        {value.suggestedActions.map((action, index) => {
          const canAccept = originalSuggestionIds.has(action.id);
          return (
            <div className="suggested-action" key={action.id}>
              <GroundedFieldEditor
                disabled={busy}
                error={errors[`grounded.${action.id}`]}
                label={`Suggested action ${index + 1}`}
                onChange={(next) => updateGroundedList('suggestedActions', index, next)}
                onRemove={() => updateGroundedList('suggestedActions', index)}
                sourceSpans={idea.sourceSpans}
                value={action}
              />
              <label className="review-checkbox">
                <input
                  checked={value.acceptedActionSuggestionIds.includes(action.id)}
                  disabled={busy || !canAccept}
                  onChange={(event) => toggleAcceptedAction(action.id, event.target.checked)}
                  type="checkbox"
                />
                {canAccept ? 'Add to Actions when confirmed' : 'New suggestion (saved with this idea)'}
              </label>
            </div>
          );
        })}
        <AddButton
          disabled={busy || value.suggestedActions.length >= MAX_GROUNDED_LIST_ITEMS}
          label="suggested action"
          onClick={() => addGrounded('suggestedActions')}
        />
        {errors.suggestedActions ? (
          <p className="field-error" role="alert">
            {errors.suggestedActions}
          </p>
        ) : null}
        {errors.acceptedActionSuggestionIds ? (
          <p className="field-error" role="alert">
            {errors.acceptedActionSuggestionIds}
          </p>
        ) : null}
      </RuledSection>

      {attemptedConfirm && !validation.valid ? (
        <div className="idea-form__validation-summary" role="alert">
          Review the highlighted fields before confirming this idea.
        </div>
      ) : null}

      <div className="idea-form__actions">
        <button
          className="review-discard-button"
          disabled={busy}
          onClick={() => setDiscardOpen(true)}
          ref={discardButtonRef}
          type="button"
        >
          Discard idea
        </button>
        <button className="button-primary" disabled={busy} type="submit">
          {busy ? 'Saving…' : 'Confirm'}
        </button>
      </div>

      {discardOpen ? (
        <dialog
          aria-labelledby={`discard-title-${idea.id}`}
          aria-modal="true"
          className="discard-confirmation"
          onCancel={(event) => {
            event.preventDefault();
            closeDiscardConfirmation();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              closeDiscardConfirmation();
            }
          }}
          ref={discardDialogRef}
        >
          <h2 id={`discard-title-${idea.id}`}>Discard this draft idea?</h2>
          <p>Only this draft idea will be removed. The source recording and transcript will remain available.</p>
          {discardError ? (
            <p className="discard-confirmation__error" role="alert">
              {discardError}
            </p>
          ) : null}
          <div>
            <button
              className="button-quiet"
              disabled={busy}
              onClick={closeDiscardConfirmation}
              ref={discardCancelRef}
              type="button"
            >
              Cancel
            </button>
            <button
              className="review-danger-button"
              disabled={busy}
              onClick={onDiscard}
              ref={discardConfirmRef}
              type="button"
            >
              {discardError ? 'Retry discard' : 'Discard draft idea'}
            </button>
          </div>
        </dialog>
      ) : null}
    </form>
  );
}
