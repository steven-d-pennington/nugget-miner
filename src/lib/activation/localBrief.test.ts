import { describe, expect, it } from 'vitest';
import { buildLocalActivationBrief } from './localBrief';
import type { ActivationIdeaContext } from './context';

const idea: ActivationIdeaContext = {
  title: 'Neighborhood tool library',
  summary: 'Let neighbors share rarely used tools.',
  goals: ['Test interest with ten households.'],
  blockers: ['No inventory process yet.'],
  openQuestions: ['Where should tools be stored?'],
  suggestedActions: ['Draft a survey.'],
  research: { needed: true, suggestedQueries: ['simple lending inventory'], suggestedResourceTypes: ['community library guides'] },
  category: 'Personal',
  tags: ['community'],
  actions: ['Ask the local library.'],
};

describe('buildLocalActivationBrief', () => {
  it.each(['explore', 'plan', 'agent'] as const)('creates a useful %s fallback without a provider call', (intent) => {
    const result = buildLocalActivationBrief(intent, idea);
    expect(result.title).toContain('Neighborhood tool library');
    expect(result.prompt).toContain('Let neighbors share rarely used tools.');
    expect(result.prompt).toContain('Do not invent missing facts');
    expect(result.deliverables.length).toBeGreaterThan(0);
    expect(result.successCriteria.length).toBeGreaterThan(0);
  });

  it('omits a transcript unless it was added to the context', () => {
    expect(buildLocalActivationBrief('agent', idea).prompt).not.toContain('Optional source transcript');
    expect(buildLocalActivationBrief('agent', { ...idea, transcript: 'Original private source.' }).prompt)
      .toContain('Original private source.');
  });
});
