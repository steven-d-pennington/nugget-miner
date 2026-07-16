import { describe, expect, it } from 'vitest';
import { slugifyIdeaFilename } from './download';
import { buildIdeaJsonExport, ideaToJson, ideaToMarkdown, type IdeaExportBundle } from './ideaExport';
import type { GroundedText, Idea } from '@/types';

function grounded(id: string, text: string): GroundedText {
  return { id, text, basis: 'inferred', sourceSpanIds: [] };
}

function bundle(overrides: Partial<Idea> = {}): IdeaExportBundle {
  const idea: Idea = {
    id: 'idea-1',
    captureSessionId: 'capture-1',
    extractionRunId: 'run-1',
    status: 'confirmed',
    title: 'Create a neighborhood tool-sharing library',
    summary: grounded('summary', 'A simple way for neighbors to lend rarely used tools.'),
    purpose: grounded('purpose', 'Reduce duplicate purchases.'),
    goals: [grounded('goal', 'Test with ten nearby households.')],
    problem: { statement: grounded('problem', 'Tools sit unused.'), type: 'Coordination' },
    blockers: [grounded('blocker', 'Need a way to track responsibility.')],
    questions: [grounded('question', 'Who will host the inventory?')],
    suggestedActions: [],
    research: {
      needed: true,
      assessment: grounded('research', 'Compare lightweight inventory tools.'),
      suggestedQueries: ['neighborhood tool library software'],
      suggestedResourceTypes: ['Community case studies'],
    },
    categoryId: 'personal',
    tagIds: ['tag-community', 'tag-sharing'],
    sourceSpans: [],
    createdAt: Date.UTC(2026, 6, 16, 12, 0, 0),
    updatedAt: Date.UTC(2026, 6, 16, 13, 0, 0),
    confirmedAt: Date.UTC(2026, 6, 16, 13, 0, 0),
    ...overrides,
  };
  return {
    idea,
    category: {
      id: 'personal',
      name: 'Personal',
      normalizedName: 'personal',
      description: 'Personal projects and household ideas.',
      isDefault: true,
      isFallback: false,
      sortOrder: 30,
      createdAt: 1,
      updatedAt: 1,
    },
    tags: [
      { id: 'tag-community', name: 'community', normalizedName: 'community', createdAt: 1 },
      { id: 'tag-sharing', name: 'sharing', normalizedName: 'sharing', createdAt: 1 },
    ],
    actions: [
      { id: 'action-1', ideaId: 'idea-1', text: 'Draft an interest survey.', status: 'open', createdAt: 1, updatedAt: 1 },
      { id: 'action-2', ideaId: 'idea-1', text: 'Ask two neighbors.', status: 'completed', createdAt: 1, updatedAt: 2, completedAt: 2 },
    ],
    transcript: {
      id: 'transcript-1',
      captureSessionId: 'capture-1',
      version: 1,
      text: 'This full transcript is private by default.',
      provider: 'typed',
      source: 'typed',
      contentHash: 'hash',
      createdAt: 1,
      updatedAt: 1,
    },
  };
}

describe('single-idea export', () => {
  it('builds the exact deterministic Markdown structure', () => {
    expect(ideaToMarkdown(bundle())).toBe(`# Create a neighborhood tool-sharing library

Category: Personal
Tags: community, sharing

## Summary

A simple way for neighbors to lend rarely used tools.

## Purpose

Reduce duplicate purchases.

## Goals

- Test with ten nearby households.

## Problem

Tools sit unused.

Type: Coordination

## Blockers

- Need a way to track responsibility.

## Questions

- Who will host the inventory?

## Research needed

Compare lightweight inventory tools.

Suggested searches:
- neighborhood tool library software

Suggested resource types:
- Community case studies

## Actions

- [ ] Draft an interest survey.
- [x] Ask two neighbors.

## Source

Capture: capture-1
Created: 2026-07-16T12:00:00.000Z
`);
  });

  it('omits empty optional sections and the transcript by default', () => {
    const sparse = bundle({
      purpose: undefined,
      goals: [],
      problem: undefined,
      blockers: [],
      questions: [],
      research: { needed: false, suggestedQueries: [], suggestedResourceTypes: [] },
    });
    sparse.actions = [];
    sparse.tags = [];

    const markdown = ideaToMarkdown(sparse);
    expect(markdown).toContain('## Summary');
    expect(markdown).not.toContain('Tags:');
    expect(markdown).not.toContain('## Purpose');
    expect(markdown).not.toContain('## Research needed');
    expect(markdown).not.toContain('## Actions');
    expect(markdown).not.toContain('## Transcript');
    expect(markdown).not.toContain('This full transcript is private by default.');
  });

  it('includes the full transcript only when explicitly requested', () => {
    expect(ideaToMarkdown(bundle(), { includeTranscript: true })).toContain(
      '## Transcript\n\nThis full transcript is private by default.',
    );
  });

  it('produces a stable versioned JSON object without transcript text by default', () => {
    const exported = buildIdeaJsonExport(bundle());
    expect(exported.schemaVersion).toBe('nugget-idea-export-v1');
    expect(exported.idea.id).toBe('idea-1');
    expect(exported.source.captureSessionId).toBe('capture-1');
    expect(exported.source.transcript).toBeUndefined();
    expect(ideaToJson(bundle())).not.toContain('This full transcript is private by default.');
    expect(buildIdeaJsonExport(bundle(), { includeTranscript: true }).source.transcript?.text).toBe(
      'This full transcript is private by default.',
    );
  });

  it('creates safe deterministic filenames with an id fallback', () => {
    expect(slugifyIdeaFilename('  Café & Tool Sharing!  ', 'idea-1')).toBe('cafe-tool-sharing');
    expect(slugifyIdeaFilename('✨', 'idea-1')).toBe('nugget-idea-idea-1');
  });
});
