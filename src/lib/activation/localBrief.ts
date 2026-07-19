import type { ActivationBriefContent, ActivationIntent } from '@/types';
import type { ActivationIdeaContext } from './context';

export const LOCAL_ACTIVATION_PROMPT_VERSION = 'activate-local-v1';

const intentOpening: Record<ActivationIntent, string> = {
  explore: 'Explore and develop the following idea.',
  plan: 'Turn the following idea into an actionable plan with an MVP, dependencies, risks, and ordered next steps.',
  agent: 'Act on the following idea as an AI agent. First identify any missing information that materially blocks safe work.',
};

function list(lines: string[], heading: string, values: string[]) {
  if (values.length === 0) return;
  lines.push(`${heading}:`, ...values.map((value) => `- ${value}`), '');
}

export function buildLocalActivationBrief(intent: ActivationIntent, idea: ActivationIdeaContext): ActivationBriefContent {
  const constraints = [
    ...idea.blockers,
    'Do not invent missing facts, commitments, credentials, research findings, or technical context.',
    'Ask concise clarifying questions when missing information materially changes the work.',
  ];
  const deliverables = intent === 'explore'
    ? ['Promising directions and tradeoffs', 'Important unanswered questions', 'A recommended next step']
    : intent === 'plan'
      ? ['A smallest useful first version', 'An ordered implementation plan', 'Dependencies, risks, and open decisions']
      : ['A concrete first work product', 'A list of blockers or required inputs', 'Clear verification or completion evidence'];
  const successCriteria = [
    'The response stays grounded in the supplied idea.',
    'Assumptions are labeled and missing context is requested instead of fabricated.',
    'The result ends with concrete next actions.',
  ];
  const contextParts = [idea.summary, idea.purpose, idea.problem].filter(Boolean);
  const context = contextParts.join('\n\n');
  const lines = [
    intentOpening[intent],
    '',
    `Title: ${idea.title}`,
    '',
    'Context:',
    context,
    '',
    `Category: ${idea.category}`,
    ...(idea.tags.length ? [`Tags: ${idea.tags.join(', ')}`, ''] : ['']),
  ];
  list(lines, 'Goals', idea.goals);
  list(lines, 'Known constraints and blockers', constraints);
  list(lines, 'Open questions', idea.openQuestions);
  list(lines, 'Existing next actions', [...idea.actions, ...idea.suggestedActions]);
  if (idea.research.needed) {
    list(lines, 'Research questions', idea.research.suggestedQueries);
  }
  list(lines, 'Required deliverables', deliverables);
  list(lines, 'Success criteria', successCriteria);
  if (idea.transcript) lines.push('Optional source transcript:', idea.transcript, '');

  return {
    title: `${idea.title} — ${intent === 'explore' ? 'exploration brief' : intent === 'plan' ? 'action plan' : 'AI agent brief'}`,
    objective: intentOpening[intent],
    context,
    assumptions: [],
    constraints,
    deliverables,
    successCriteria,
    prompt: lines.join('\n').trim(),
  };
}
