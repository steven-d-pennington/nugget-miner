import type { ExtractionPreset } from '@/types';

export interface ExtractionPromptInput {
  preset: ExtractionPreset;
  ideaId: string;
  transcriptText: string;
  title?: string;
}

export interface ExtractionPrompt {
  promptVersion: string;
  system: string;
  user: string;
}

const baseSchemaInstruction = `Return only JSON matching this TypeScript shape:
{
  "summary": string,
  "nuggets": [{ "title": string, "detail"?: string, "category": "idea" | "decision" | "risk" | "note", "confidence": number, "sourceSpan": { "start": number, "end": number } }],
  "actions": [{ "title": string, "description"?: string, "priority": "low" | "medium" | "high", "dueDate": number | null, "project": string | null, "confidence": number, "sourceSpan": { "start": number, "end": number } }],
  "questions": [{ "text": string, "confidence": number, "sourceSpan": { "start": number, "end": number } }],
  "tags": string[],
  "warnings": string[]
}`;

const presetGuidance: Record<ExtractionPreset, string> = {
  'general-thought': 'Capture broadly useful ideas, observations, follow-up actions, and open questions.',
  'product-idea': 'Prioritize product opportunities, user pains, risks, and next experiments.',
  'work-reminder': 'Prioritize concrete follow-ups, commitments, deadlines, people, and projects.',
  'story-idea': 'Prioritize narrative hooks, scenes, characters, questions, and creative directions.',
};

export function buildExtractionPrompt(input: ExtractionPromptInput): ExtractionPrompt {
  const promptVersion = `extract-${input.preset}-v1`;
  return {
    promptVersion,
    system: `You are Nugget's extraction engine. Return only JSON. Do not include markdown. Do not include commentary. Validate sourceSpan character offsets against the transcript text.`,
    user: [
      `Preset: ${input.preset}`,
      `Prompt version: ${promptVersion}`,
      `Idea id: ${input.ideaId}`,
      input.title ? `Idea title: ${input.title}` : undefined,
      `Task guidance: ${presetGuidance[input.preset]}`,
      baseSchemaInstruction,
      'sourceSpan.start and sourceSpan.end must be character offsets into transcript.text and must remain in range.',
      'Use null for unknown dueDate/project. Confidence values must be between 0 and 1.',
      'Transcript text:',
      input.transcriptText,
    ]
      .filter(Boolean)
      .join('\n\n'),
  };
}
