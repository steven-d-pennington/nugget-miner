import type { ActionItem, CaptureSession, Category, Idea, Tag, Transcript } from '@/types';

export const IDEA_EXPORT_SCHEMA_VERSION = 'nugget-idea-export-v1' as const;

export interface IdeaExportBundle {
  idea: Idea;
  category: Category;
  tags: Tag[];
  actions: ActionItem[];
  capture?: CaptureSession;
  transcript?: Transcript;
}

export interface IdeaExportOptions {
  includeTranscript?: boolean;
}

function nonBlank(values: string[]) {
  return values.map((value) => value.trim()).filter(Boolean);
}

function addTextSection(lines: string[], title: string, text?: string) {
  const value = text?.trim();
  if (!value) return;
  lines.push(`## ${title}`, '', value, '');
}

function addListSection(lines: string[], title: string, values: string[]) {
  const items = nonBlank(values);
  if (items.length === 0) return;
  lines.push(`## ${title}`, '', ...items.map((item) => `- ${item}`), '');
}

function toIso(timestamp: number) {
  return new Date(timestamp).toISOString();
}

function orderedActions(actions: ActionItem[]) {
  return [...actions].sort((left, right) => left.createdAt - right.createdAt || left.id.localeCompare(right.id));
}

export function ideaToMarkdown(bundle: IdeaExportBundle, options: IdeaExportOptions = {}) {
  const { idea, category, tags, transcript } = bundle;
  const actions = orderedActions(bundle.actions);
  const lines = [`# ${idea.title.trim()}`, '', `Category: ${category.name}`];
  const tagNames = nonBlank(tags.map((tag) => tag.name));
  if (tagNames.length > 0) lines.push(`Tags: ${tagNames.join(', ')}`);
  lines.push('');

  addTextSection(lines, 'Summary', idea.summary.text);
  addTextSection(lines, 'Purpose', idea.purpose?.text);
  addListSection(lines, 'Goals', idea.goals.map((goal) => goal.text));
  addTextSection(
    lines,
    'Problem',
    [idea.problem?.statement.text.trim(), idea.problem?.type?.trim() ? `Type: ${idea.problem.type.trim()}` : '']
      .filter(Boolean)
      .join('\n\n'),
  );
  addListSection(lines, 'Blockers', idea.blockers.map((blocker) => blocker.text));
  addListSection(lines, 'Questions', idea.questions.map((question) => question.text));

  const assessment = idea.research.assessment?.text.trim();
  const searches = nonBlank(idea.research.suggestedQueries);
  const resources = nonBlank(idea.research.suggestedResourceTypes);
  if (idea.research.needed || assessment || searches.length > 0 || resources.length > 0) {
    lines.push('## Research needed', '');
    if (assessment) lines.push(assessment, '');
    else if (idea.research.needed) lines.push('Yes', '');
    if (searches.length > 0) lines.push('Suggested searches:', ...searches.map((query) => `- ${query}`), '');
    if (resources.length > 0) {
      lines.push('Suggested resource types:', ...resources.map((resource) => `- ${resource}`), '');
    }
  }

  if (actions.length > 0) {
    lines.push(
      '## Actions',
      '',
      ...actions.map((action) => `- [${action.status === 'completed' ? 'x' : ' '}] ${action.text.trim()}`),
      '',
    );
  }

  lines.push('## Source', '', `Capture: ${idea.captureSessionId}`, `Created: ${toIso(idea.createdAt)}`, '');
  if (options.includeTranscript && transcript?.text.trim()) {
    lines.push('## Transcript', '', transcript.text.trim(), '');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

export function buildIdeaJsonExport(bundle: IdeaExportBundle, options: IdeaExportOptions = {}) {
  const { idea, category, tags, actions, capture, transcript } = bundle;
  return {
    schemaVersion: IDEA_EXPORT_SCHEMA_VERSION,
    idea,
    category,
    tags,
    actions: orderedActions(actions),
    source: {
      captureSessionId: idea.captureSessionId,
      capture: capture ?? null,
      transcript: options.includeTranscript && transcript
        ? {
            id: transcript.id,
            version: transcript.version,
            text: transcript.text,
            source: transcript.source,
            createdAt: transcript.createdAt,
            updatedAt: transcript.updatedAt,
          }
        : undefined,
    },
  };
}

export function ideaToJson(bundle: IdeaExportBundle, options: IdeaExportOptions = {}) {
  return `${JSON.stringify(buildIdeaJsonExport(bundle, options), null, 2)}\n`;
}
