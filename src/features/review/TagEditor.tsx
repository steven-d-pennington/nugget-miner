'use client';

import { useId, useState } from 'react';
import { normalizeLabel } from '@/lib/normalization/labels';
import type { Tag } from '@/types';

export const MAX_TAGS = 6;
export const MAX_TAG_LENGTH = 40;

export function cleanTagName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export interface TagEditorProps {
  value: string[];
  suggestions: Tag[];
  onChange(value: string[]): void;
  disabled?: boolean;
  error?: string;
}

export function TagEditor({ value, suggestions, onChange, disabled = false, error }: TagEditorProps) {
  const id = useId();
  const inputId = `idea-tag-${id}`;
  const guidanceId = `${inputId}-guidance`;
  const errorId = `${inputId}-error`;
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const selected = new Set(value.map(normalizeLabel));
  const availableSuggestions = suggestions.filter((tag) => !selected.has(normalizeLabel(tag.name)));

  function addTag(raw: string) {
    const name = cleanTagName(raw);
    const normalized = normalizeLabel(name);
    if (!normalized) return;
    if (name.length > MAX_TAG_LENGTH) {
      setInputError(`Tags must be ${MAX_TAG_LENGTH} characters or fewer.`);
      return;
    }
    if (value.length >= MAX_TAGS) {
      setInputError(`Use up to ${MAX_TAGS} tags.`);
      return;
    }
    if (selected.has(normalized)) {
      setInput('');
      setInputError(null);
      return;
    }
    onChange([...value, name]);
    setInput('');
    setInputError(null);
  }

  function removeTag(index: number) {
    onChange(value.filter((_, candidateIndex) => candidateIndex !== index));
  }

  return (
    <div className="tag-editor">
      <label htmlFor={inputId}>Tags</label>
      <div className="tag-editor__selected" aria-label="Selected tags">
        {value.map((tag, index) => (
          <span className="tag-chip" key={`${normalizeLabel(tag)}-${index}`}>
            {tag}
            <button
              aria-label={`Remove tag ${tag}`}
              disabled={disabled}
              onClick={() => removeTag(index)}
              type="button"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <input
        aria-describedby={`${guidanceId}${inputError || error ? ` ${errorId}` : ''}`}
        aria-invalid={Boolean(inputError || error)}
        disabled={disabled}
        id={inputId}
        onChange={(event) => {
          setInput(event.target.value);
          setInputError(null);
        }}
        onCompositionEnd={() => setComposing(false)}
        onCompositionStart={() => setComposing(true)}
        onKeyDown={(event) => {
          if ((event.key === 'Enter' || event.key === ',') && !composing && !event.nativeEvent.isComposing) {
            event.preventDefault();
            addTag(input);
          }
        }}
        placeholder={value.length >= MAX_TAGS ? 'Tag limit reached' : 'Add a tag'}
        type="text"
        value={input}
      />
      <p className="field-guidance" id={guidanceId}>
        Press Enter or comma to add. Up to {MAX_TAGS} tags.
      </p>
      {inputError || error ? (
        <p className="field-error" id={errorId} role="alert">
          {inputError ?? error}
        </p>
      ) : null}
      {availableSuggestions.length > 0 && value.length < MAX_TAGS ? (
        <div className="tag-editor__suggestions" aria-label="Suggested tags">
          {availableSuggestions.map((tag) => (
            <button disabled={disabled} key={tag.id} onClick={() => addTag(tag.name)} type="button">
              + {tag.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
