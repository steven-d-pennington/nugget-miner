import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ActionItem, Category, Idea, Tag } from '@/types';
import { IdeaSummaryView } from './IdeaSummaryView';

describe('IdeaSummaryView', () => {
  it('renders organized sections, provenance, tags, actions, and Edit', () => {
    const onEdit = vi.fn();
    render(
      <IdeaSummaryView
        actions={[{ id: 'action-1', ideaId: 'idea-1', text: 'Draft a survey.', status: 'open', createdAt: 1, updatedAt: 1 } as ActionItem]}
        category={{ id: 'personal', name: 'Personal', normalizedName: 'personal' } as Category}
        disabled={false}
        idea={{
          id: 'idea-1',
          title: 'Create a neighborhood tool-sharing library',
          summary: { id: 'summary', text: 'Share rarely used tools.', basis: 'explicit', sourceSpanIds: ['span'] },
          purpose: { id: 'purpose', text: 'Reduce duplicate purchases.', basis: 'inferred', sourceSpanIds: [] },
          goals: [{ id: 'goal', text: 'Test with ten households.', basis: 'inferred', sourceSpanIds: [] }],
          blockers: [{ id: 'blocker', text: 'Need a host.', basis: 'inferred', sourceSpanIds: [] }],
          questions: [],
          suggestedActions: [],
          research: { needed: true, suggestedQueries: ['tool library software'], suggestedResourceTypes: ['Case studies'] },
          tagIds: ['community'],
        } as unknown as Idea}
        onEdit={onEdit}
        tags={[{ id: 'community', name: 'community', normalizedName: 'community', createdAt: 1 } as Tag]}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Why it matters' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: "What's in the way" })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Next actions' })).toBeInTheDocument();
    expect(screen.getByText('Explicit')).toBeInTheDocument();
    expect(screen.getByText('#community')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit idea' }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
