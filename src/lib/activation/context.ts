import { z } from 'zod';
import type { ActionItem, Category, Idea, Tag, Transcript } from '@/types';

const boundedText = z.string().min(1).max(4000);

export const activationIdeaContextSchema = z
  .object({
    title: z.string().min(1).max(160),
    summary: boundedText,
    purpose: boundedText.optional(),
    goals: z.array(z.string().min(1).max(800)).max(8),
    problem: boundedText.optional(),
    blockers: z.array(z.string().min(1).max(800)).max(8),
    openQuestions: z.array(z.string().min(1).max(800)).max(8),
    suggestedActions: z.array(z.string().min(1).max(800)).max(8),
    research: z
      .object({
        needed: z.boolean(),
        assessment: boundedText.optional(),
        suggestedQueries: z.array(z.string().min(1).max(500)).max(5),
        suggestedResourceTypes: z.array(z.string().min(1).max(300)).max(5),
      })
      .strict(),
    category: z.string().min(1).max(120),
    tags: z.array(z.string().min(1).max(80)).max(12),
    actions: z.array(z.string().min(1).max(800)).max(20),
    transcript: z.string().min(1).max(24000).optional(),
  })
  .strict();

export type ActivationIdeaContext = z.infer<typeof activationIdeaContextSchema>;

function uniqueText(values: string[]) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.trim().toLocaleLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildActivationIdeaContext(input: {
  idea: Idea;
  category: Category;
  tags: Tag[];
  actions: ActionItem[];
  transcript?: Transcript;
  includeTranscript: boolean;
}): ActivationIdeaContext {
  const { idea } = input;
  const openActions = input.actions.filter((action) => action.status === 'open').map((action) => action.text);
  const nextActions = uniqueText([...openActions, ...idea.suggestedActions.map((value) => value.text)]);
  return {
    title: idea.title,
    summary: idea.summary.text,
    purpose: idea.purpose?.text,
    goals: idea.goals.map((value) => value.text),
    problem: idea.problem?.statement.text,
    blockers: idea.blockers.map((value) => value.text),
    openQuestions: idea.questions.map((value) => value.text),
    suggestedActions: nextActions.filter((value) => !openActions.some((action) => action.trim().toLocaleLowerCase() === value.trim().toLocaleLowerCase())),
    research: {
      needed: idea.research.needed,
      assessment: idea.research.assessment?.text,
      suggestedQueries: idea.research.suggestedQueries,
      suggestedResourceTypes: idea.research.suggestedResourceTypes,
    },
    category: input.category.name,
    tags: input.tags.map((tag) => tag.name),
    actions: uniqueText(openActions),
    transcript: input.includeTranscript ? input.transcript?.text : undefined,
  };
}
