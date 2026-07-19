import { afterEach, describe, expect, it } from 'vitest';
import { db, resetClientDatabaseForTests } from '@/lib/db';
import { activationBriefRepository } from './activationBriefRepository';

afterEach(() => resetClientDatabaseForTests());

async function addIdea() {
  await db.ideas.add({
    id: 'idea-activation', captureSessionId: 'capture-activation', status: 'confirmed', title: 'Activate this idea',
    summary: { id: 'summary-activation', text: 'Prepare this idea for an agent.', basis: 'inferred', sourceSpanIds: [] },
    goals: [], blockers: [], questions: [], suggestedActions: [], research: { needed: false, suggestedQueries: [], suggestedResourceTypes: [] },
    categoryId: 'category-misc', tagIds: [], sourceSpans: [], createdAt: 1, updatedAt: 1,
  });
}

function input() {
  return {
    ideaId: 'idea-activation', intent: 'agent' as const, includeTranscript: false, needsClarification: false,
    clarifyingQuestions: [], provider: 'local' as const, promptVersion: 'activate-local-v1', schemaVersion: 'activation-v1',
    brief: { title: 'Agent brief', objective: 'Act on it.', context: 'Useful context.', assumptions: [], constraints: [], deliverables: ['A result.'], successCriteria: ['It works.'], prompt: 'Act on this idea.' },
  };
}

describe('activationBriefRepository', () => {
  it('persists one current brief per idea and intent', async () => {
    await addIdea();
    const first = await activationBriefRepository.save(input());
    const second = await activationBriefRepository.save({ ...input(), brief: { ...input().brief, prompt: 'Updated prompt.' } });

    expect(second.id).toBe(first.id);
    expect(second.createdAt).toBe(first.createdAt);
    expect(await db.activationBriefs.count()).toBe(1);
    expect((await activationBriefRepository.get('idea-activation', 'agent'))?.brief.prompt).toBe('Updated prompt.');
  });

  it('updates only the editable prompt', async () => {
    await addIdea();
    await activationBriefRepository.save(input());
    const updated = await activationBriefRepository.updatePrompt('idea-activation', 'agent', '  Reviewed prompt.  ');
    expect(updated.brief.prompt).toBe('Reviewed prompt.');
    expect(updated.brief.objective).toBe('Act on it.');
  });
});
