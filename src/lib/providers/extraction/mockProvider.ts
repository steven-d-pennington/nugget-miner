import { ProviderError } from '@/lib/errors';
import { parseExtractionResult } from '@/lib/validation/extractionResult';
import type { ExtractionActionSuggestion, ExtractionNuggetSuggestion, ExtractionPreset, ExtractionQuestionSuggestion, SourceSpan, Transcript } from '@/types';
import type { ExtractionProvider } from './types';

const PROMPT_VERSION = 'mock-extraction-v1';

interface SentenceSpan {
  text: string;
  span: SourceSpan;
}

function clampText(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function sentenceSpans(text: string): SentenceSpan[] {
  const normalized = text.trim();
  if (!normalized) return [{ text: 'Empty transcript', span: { start: 0, end: 0 } }];
  const matches = [...normalized.matchAll(/[^.!?\n]+[.!?]?/g)];
  const spans = matches
    .map((match) => ({ text: clampText(match[0]), span: { start: match.index ?? 0, end: (match.index ?? 0) + match[0].length } }))
    .filter((item) => item.text.length > 0);
  return spans.length ? spans : [{ text: normalized, span: { start: 0, end: normalized.length } }];
}

function firstSpan(transcript: Transcript) {
  return sentenceSpans(transcript.text)[0] ?? { text: transcript.text, span: { start: 0, end: transcript.text.length } };
}

function spanSnippet(transcript: Transcript, span: SourceSpan) {
  return clampText(transcript.text.slice(span.start, span.end));
}

function tagWords(text: string): string[] {
  const words = clampText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter((word) => word.length >= 5 && !['about', 'there', 'their', 'should', 'would', 'could'].includes(word));
  return [...new Set(words)].slice(0, 4);
}

function presetLabel(preset: ExtractionPreset) {
  switch (preset) {
    case 'product-idea':
      return 'Product idea';
    case 'work-reminder':
      return 'Work reminder';
    case 'story-idea':
      return 'Story idea';
    default:
      return 'General thought';
  }
}

function makeNuggets(transcript: Transcript, preset: ExtractionPreset): ExtractionNuggetSuggestion[] {
  const spans = sentenceSpans(transcript.text).slice(0, 4);
  const categories = preset === 'work-reminder' ? ['decision', 'note', 'risk', 'idea'] : preset === 'story-idea' ? ['idea', 'note', 'risk', 'decision'] : ['idea', 'note', 'decision', 'risk'];
  return spans.slice(0, Math.max(2, Math.min(4, spans.length))).map((item, index) => ({
    title: `${presetLabel(preset)} nugget ${index + 1}`,
    detail: spanSnippet(transcript, item.span),
    category: categories[index % categories.length] as ExtractionNuggetSuggestion['category'],
    confidence: Number((0.82 - index * 0.04).toFixed(2)),
    sourceSpan: item.span,
  }));
}

function makeActions(transcript: Transcript, preset: ExtractionPreset): ExtractionActionSuggestion[] {
  const spans = sentenceSpans(transcript.text);
  const actionish = spans.filter((item) => /\b(should|need|todo|follow up|call|email|build|fix|ship|remember|schedule|send)\b/i.test(item.text));
  const selected = (actionish.length ? actionish : spans).slice(0, preset === 'work-reminder' ? 3 : 2);
  return selected.map((item, index) => ({
    title: preset === 'work-reminder' ? `Follow up: ${item.text.slice(0, 52)}` : `Review action from transcript ${index + 1}`,
    description: spanSnippet(transcript, item.span),
    priority: index === 0 && preset === 'work-reminder' ? 'high' : index === 0 ? 'medium' : 'low',
    dueDate: null,
    project: null,
    confidence: Number((0.74 - index * 0.05).toFixed(2)),
    sourceSpan: item.span,
  }));
}

function makeQuestions(transcript: Transcript): ExtractionQuestionSuggestion[] {
  const spans = sentenceSpans(transcript.text);
  const questionSpans = spans.filter((item) => item.text.includes('?'));
  const selected = questionSpans.length ? questionSpans : [firstSpan(transcript)];
  return selected.slice(0, 2).map((item, index) => ({
    text: item.text.includes('?') ? item.text : `What is the next step for: ${item.text.slice(0, 70)}?`,
    confidence: Number((0.69 - index * 0.04).toFixed(2)),
    sourceSpan: item.span,
  }));
}

export const mockExtractionProvider: ExtractionProvider = {
  id: 'mock',
  label: 'Mock extraction',
  mode: 'mock',
  async isAvailable() {
    return true;
  },
  async extract({ transcript, context, signal }) {
    if (signal?.aborted) {
      throw new ProviderError('Mock extraction was aborted.');
    }
    if (/failed-extraction-fixture/i.test(transcript.text)) {
      throw new ProviderError('Mock extraction fixture failed.');
    }
    const first = firstSpan(transcript);
    const result = {
      summary: `${presetLabel(context.preset)} summary: ${spanSnippet(transcript, first.span).slice(0, 180)}`,
      nuggets: makeNuggets(transcript, context.preset),
      actions: makeActions(transcript, context.preset),
      questions: makeQuestions(transcript),
      tags: tagWords(transcript.text),
      warnings: transcript.text.length < 40 ? ['Transcript is short; suggestions may be sparse.'] : [],
    };
    return parseExtractionResult(result);
  },
};

export const mockExtractionPromptVersion = PROMPT_VERSION;
