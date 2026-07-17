import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { db, resetClientDatabaseForTests } from '@/lib/db';
import { DEFAULT_CATEGORY_IDS } from '@/lib/db/defaultCategories';
import type { Idea } from '@/types';
import { IdeaDetailScreen } from './IdeaDetailScreen';


function productionIdea(id: string): Idea {
  return {
    id,
    captureSessionId: 'capture-1',
    extractionRunId: 'run-1',
    status: 'confirmed',
    title: `Detail for ${id}`,
    summary: { id: 'summary-1', text: 'A locally persisted idea.', basis: 'inferred', sourceSpanIds: [] },
    goals: [],
    blockers: [],
    questions: [],
    suggestedActions: [],
    research: { needed: false, suggestedQueries: [], suggestedResourceTypes: [] },
    categoryId: DEFAULT_CATEGORY_IDS.personal,
    tagIds: [],
    sourceSpans: [],
    createdAt: 1,
    updatedAt: 1,
    confirmedAt: 1,
  };
}

afterEach(async () => {
  await resetClientDatabaseForTests();
});

describe('IdeaDetailScreen route IDs', () => {
  it.each([
    'idea:f64533be-2c0c-4c94-be5f-1accd80b0805:1',
    'idea:b00abd14-5a3d-4694-8666-f629abe06114:idea-1',
  ])('loads the raw IndexedDB idea for Next canonicalized route ID %s', async (id) => {
    const idea = productionIdea(id);
    await db.ideas.add(idea);

    render(<IdeaDetailScreen ideaId={encodeURIComponent(id)} />);

    expect(await screen.findByLabelText('Title')).toHaveValue(idea.title);
  });

  it('shows not found for a malformed encoded route ID', async () => {
    render(<IdeaDetailScreen ideaId="idea%ZZ" />);

    expect(await screen.findByRole('heading', { name: 'Idea not found' })).toBeInTheDocument();
  });
});
