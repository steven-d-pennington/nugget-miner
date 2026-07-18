import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Category, GroundedText, Idea, Tag } from '@/types';
import {
  IdeaCandidateForm,
  initializeIdeaDraftFormValue,
  type IdeaDraftFormValue,
  validateIdeaDraftFormValue,
} from './IdeaCandidateForm';

const categories: Category[] = [
  {
    id: 'personal',
    name: 'Personal',
    normalizedName: 'personal',
    description: 'Personal projects and interests outside of work.',
    isDefault: true,
    isFallback: false,
    sortOrder: 30,
    createdAt: 1,
    updatedAt: 1,
  },
  {
    id: 'work',
    name: 'Work',
    normalizedName: 'work',
    description: 'Professional projects, responsibilities, and workplace ideas.',
    isDefault: true,
    isFallback: false,
    sortOrder: 10,
    createdAt: 1,
    updatedAt: 1,
  },
];

const tags: Tag[] = [
  { id: 'tag-community', name: 'community', normalizedName: 'community', createdAt: 1 },
  { id: 'tag-sharing', name: 'sharing', normalizedName: 'sharing', createdAt: 2 },
  { id: 'tag-weekend', name: 'weekend project', normalizedName: 'weekend project', createdAt: 3 },
  { id: 'tag-local', name: 'local', normalizedName: 'local', createdAt: 4 },
  { id: 'tag-tools', name: 'tools', normalizedName: 'tools', createdAt: 5 },
  { id: 'tag-neighbors', name: 'neighbors', normalizedName: 'neighbors', createdAt: 6 },
  { id: 'tag-extra', name: 'extra', normalizedName: 'extra', createdAt: 7 },
];

function grounded(
  id: string,
  text: string,
  basis: GroundedText['basis'] = 'inferred',
  sourceSpanIds: string[] = [],
): GroundedText {
  return { id, text, basis, sourceSpanIds };
}

function ideaFixture(): Idea {
  return {
    id: 'idea-1',
    captureSessionId: 'capture-1',
    extractionRunId: 'run-1',
    status: 'draft',
    title: 'Create a neighborhood tool-sharing library',
    summary: grounded('summary-1', 'Neighbors could share rarely used tools.', 'explicit', ['span-summary']),
    purpose: grounded('purpose-1', 'Reduce duplicate purchases.', 'inferred'),
    goals: [grounded('goal-1', 'Test with ten households.', 'inferred')],
    problem: undefined,
    blockers: [grounded('blocker-1', 'Tracking responsibility is unresolved.', 'inferred')],
    questions: [],
    suggestedActions: [grounded('action-1', 'Draft a one-page interest survey.', 'suggested')],
    research: {
      needed: true,
      assessment: grounded('research-1', 'Compare lightweight inventory tools.', 'suggested'),
      suggestedQueries: ['simple neighborhood lending tools'],
      suggestedResourceTypes: ['Inventory tools'],
    },
    categoryId: 'personal',
    categoryConfidence: 0.9,
    tagIds: ['tag-community'],
    sourceSpans: [
      {
        id: 'span-summary',
        startChar: 0,
        endChar: 39,
        quote: 'We could share the tools we rarely use.',
      },
    ],
    createdAt: 1,
    updatedAt: 1,
  };
}

function readDraft() {
  return JSON.parse(screen.getByTestId('draft-value').textContent ?? '{}') as IdeaDraftFormValue;
}

function Harness({
  idea = ideaFixture(),
  initialValue,
  busy = false,
  onConfirm = vi.fn(),
  onDiscard = vi.fn(),
}: {
  idea?: Idea;
  initialValue?: IdeaDraftFormValue;
  busy?: boolean;
  onConfirm?: () => void;
  onDiscard?: () => void;
}) {
  const [value, setValue] = useState(() => initialValue ?? initializeIdeaDraftFormValue(idea, tags));
  return (
    <>
      <IdeaCandidateForm
        busy={busy}
        categories={categories}
        idea={idea}
        onChange={setValue}
        onConfirm={onConfirm}
        onDiscard={onDiscard}
        tags={tags}
        value={value}
      />
      <output data-testid="draft-value">{JSON.stringify(value)}</output>
    </>
  );
}

describe('IdeaCandidateForm controlled draft', () => {
  it('groups the editable organization into the approved nugget-first hierarchy', () => {
    render(<Harness />);
    expect(screen.getByRole('heading', { name: 'Why it matters' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: "What's in the way" })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Next actions' })).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('Create a neighborhood tool-sharing library');
    expect(screen.getByLabelText('Summary')).toHaveValue('Neighbors could share rarely used tools.');
  });

  it('deep-copies initialization and updates title, summary, category, and normalized tags without mutating the idea', () => {
    const idea = ideaFixture();
    const copy = initializeIdeaDraftFormValue(idea, tags);
    copy.summary.sourceSpanIds.push('another-span');
    copy.research.suggestedQueries.push('another query');
    copy.goals[0]!.text = 'Changed copy';
    expect(idea.summary.sourceSpanIds).toEqual(['span-summary']);
    expect(idea.research.suggestedQueries).toEqual(['simple neighborhood lending tools']);
    expect(idea.goals[0]!.text).toBe('Test with ten households.');

    render(<Harness idea={idea} />);
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Community tool library' } });
    fireEvent.change(screen.getByLabelText('Summary'), { target: { value: 'A smaller, edited summary.' } });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'work' } });
    fireEvent.change(screen.getByLabelText('Tags'), { target: { value: '  Weekend   Build  ' } });
    fireEvent.keyDown(screen.getByLabelText('Tags'), { key: 'Enter' });

    expect(readDraft()).toMatchObject({
      title: 'Community tool library',
      summary: {
        id: 'summary-1',
        text: 'A smaller, edited summary.',
        basis: 'explicit',
        sourceSpanIds: ['span-summary'],
      },
      categoryId: 'work',
      tagNames: ['community', 'Weekend Build'],
    });
    expect(idea.title).toBe('Create a neighborhood tool-sharing library');
    expect(idea.summary.text).toBe('Neighbors could share rarely used tools.');
  });

  it('renders exact stored source quotes as text and does not require quotes for inferred fields', () => {
    const idea = ideaFixture();
    idea.sourceSpans[0]!.quote = '<img src=x onerror="not-code"> exact\nquote';
    idea.sourceSpans[0]!.endChar = idea.sourceSpans[0]!.quote.length;
    const { container } = render(<Harness idea={idea} />);

    fireEvent.click(screen.getByText('View source excerpt'));
    const quote = container.querySelector('.source-excerpt blockquote');
    expect(quote?.textContent).toBe('<img src=x onerror="not-code"> exact\nquote');
    expect(container.querySelector('.source-excerpt img')).toBeNull();
    expect(screen.queryByText(/Explicit content needs valid supporting/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Goal 1')).toHaveValue('Test with ten households.');
  });

  it('blocks confirmation when explicit evidence is empty, unresolved, or malformed', () => {
    const onConfirm = vi.fn();
    const idea = ideaFixture();
    idea.summary.sourceSpanIds = ['missing-span'];
    render(<Harness idea={idea} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getAllByText(/Explicit content needs valid supporting transcript evidence/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Review the highlighted fields/i)).toBeInTheDocument();

    const malformed = ideaFixture();
    malformed.sourceSpans[0] = { ...malformed.sourceSpans[0]!, endChar: 0 };
    expect(
      validateIdeaDraftFormValue(malformed, initializeIdeaDraftFormValue(malformed, tags), categories).valid,
    ).toBe(false);

    const mismatchedQuote = ideaFixture();
    mismatchedQuote.sourceSpans[0] = { ...mismatchedQuote.sourceSpans[0]!, endChar: 100 };
    expect(
      validateIdeaDraftFormValue(
        mismatchedQuote,
        initializeIdeaDraftFormValue(mismatchedQuote, tags),
        categories,
      ).errors.summary,
    ).toMatch(/valid supporting transcript evidence/i);
  });

  it('prevents case-insensitive tag duplicates, enforces limits, and preserves the local buffer while busy', () => {
    const { rerender } = render(<Harness />);
    const input = screen.getByLabelText('Tags');
    fireEvent.change(input, { target: { value: 'COMMUNITY' } });
    fireEvent.keyDown(input, { key: ',' });
    expect(readDraft().tagNames).toEqual(['community']);

    for (const name of ['sharing', 'weekend project', 'local', 'tools', 'neighbors']) {
      fireEvent.change(input, { target: { value: name } });
      fireEvent.keyDown(input, { key: 'Enter' });
    }
    expect(readDraft().tagNames).toHaveLength(6);

    fireEvent.change(input, { target: { value: 'COMMUNITY' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(readDraft().tagNames).toHaveLength(6);
    expect(input).toHaveValue('');
    expect(screen.queryByText('Use up to 6 tags.')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'seventh tag' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('Use up to 6 tags.')).toBeInTheDocument();
    expect(input).toHaveValue('seventh tag');

    rerender(<Harness busy />);
    expect(screen.getByLabelText('Tags')).toHaveValue('seventh tag');
    expect(screen.getByLabelText('Tags')).toBeDisabled();
  });

  it('keeps overlong tags in the buffer and does not commit an IME composition early', () => {
    render(<Harness />);
    const input = screen.getByLabelText('Tags');
    const overlong = 'x'.repeat(41);
    fireEvent.change(input, { target: { value: overlong } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('Tags must be 40 characters or fewer.')).toBeInTheDocument();
    expect(input).toHaveValue(overlong);
    expect(readDraft().tagNames).toEqual(['community']);

    fireEvent.change(input, { target: { value: '研究' } });
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(readDraft().tagNames).toEqual(['community']);
    expect(input).toHaveValue('研究');
    fireEvent.compositionEnd(input);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(readDraft().tagNames).toEqual(['community', '研究']);
  });

  it('keeps original action IDs through toggle and edit, then clears acceptance on deletion', () => {
    render(<Harness />);
    const actionCheckbox = screen.getByRole('checkbox', { name: 'Add to Actions when confirmed' });
    fireEvent.click(actionCheckbox);
    expect(readDraft().acceptedActionSuggestionIds).toEqual(['action-1']);

    fireEvent.change(screen.getByLabelText('Suggested action 1'), {
      target: { value: 'Draft and share an interest survey.' },
    });
    expect(readDraft().suggestedActions[0]).toMatchObject({
      id: 'action-1',
      text: 'Draft and share an interest survey.',
      basis: 'suggested',
    });
    expect(readDraft().acceptedActionSuggestionIds).toEqual(['action-1']);

    fireEvent.click(screen.getByRole('button', { name: 'Remove suggested action 1' }));
    expect(readDraft().suggestedActions).toEqual([]);
    expect(readDraft().acceptedActionSuggestionIds).toEqual([]);
  });

  it('marks new fields inferred and never permits new suggestions to become accepted action records', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Add suggested action' }));
    const draft = readDraft();
    expect(draft.suggestedActions[1]).toMatchObject({ basis: 'inferred', sourceSpanIds: [] });
    expect(draft.suggestedActions[1]!.id).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'New suggestion (saved with this idea)' })).toBeDisabled();
  });

  it('validates title, summary, category, optional grounded text, and accepted IDs before confirmation', () => {
    const idea = ideaFixture();
    const invalid = initializeIdeaDraftFormValue(idea, tags);
    invalid.title = '   ';
    invalid.summary.text = '';
    invalid.categoryId = 'removed-category';
    invalid.goals[0]!.text = ' ';
    invalid.acceptedActionSuggestionIds = ['invented-action'];
    const result = validateIdeaDraftFormValue(idea, invalid, categories);

    expect(result.valid).toBe(false);
    expect(result.errors).toMatchObject({
      title: expect.any(String),
      summary: expect.any(String),
      categoryId: expect.any(String),
      'grounded.goal-1': expect.any(String),
      acceptedActionSuggestionIds: expect.any(String),
    });

    const onConfirm = vi.fn();
    render(<Harness idea={idea} initialValue={invalid} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText('Add a title before confirming.')).toBeInTheDocument();
    expect(screen.getByText('Choose an available category before confirming.')).toBeInTheDocument();
  });

  it('does not confirm while a newly added research suggestion is blank', () => {
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add search' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText('Keep up to 5 nonblank suggested searches.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Suggested search 2'), { target: { value: 'community survey examples' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('enforces organization list and problem type limits in both validation and Add controls', () => {
    const idea = ideaFixture();
    const invalid = initializeIdeaDraftFormValue(idea, tags);
    const makeFields = (prefix: string, count: number) =>
      Array.from({ length: count }, (_, index) => grounded(`${prefix}-${index}`, `${prefix} ${index}`));
    invalid.goals = makeFields('goal-limit', 9);
    invalid.blockers = makeFields('blocker-limit', 9);
    invalid.questions = makeFields('question-limit', 9);
    invalid.suggestedActions = makeFields('action-limit', 9);
    invalid.problem = { statement: grounded('problem-limit', 'A valid problem'), type: 'x'.repeat(81) };

    expect(validateIdeaDraftFormValue(idea, invalid, categories).errors).toMatchObject({
      goals: expect.any(String),
      blockers: expect.any(String),
      questions: expect.any(String),
      suggestedActions: expect.any(String),
      'problem.type': expect.any(String),
    });

    const atLimit = initializeIdeaDraftFormValue(idea, tags);
    atLimit.goals = makeFields('goal-ui', 8);
    atLimit.blockers = makeFields('blocker-ui', 8);
    atLimit.questions = makeFields('question-ui', 8);
    atLimit.suggestedActions = makeFields('action-ui', 8);
    render(<Harness idea={idea} initialValue={atLimit} />);
    expect(screen.getByRole('button', { name: 'Add goal' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add blocker' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add question' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add suggested action' })).toBeDisabled();
  });

  it('allows valid inferred fields without quotes and calls confirm once', () => {
    const onConfirm = vi.fn();
    render(<Harness onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('requires explicit discard confirmation; cancel changes nothing and confirm discards only the draft', () => {
    const onDiscard = vi.fn();
    render(<Harness onDiscard={onDiscard} />);

    fireEvent.click(screen.getByRole('button', { name: 'Discard idea' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Only this draft idea will be removed. The source recording and transcript will remain available.',
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Discard idea' })).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Discard idea' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onDiscard).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Discard idea' }));
    fireEvent.click(screen.getByRole('button', { name: 'Discard draft idea' }));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });
});
