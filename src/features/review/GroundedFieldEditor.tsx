'use client';

import type { GroundedText, SourceSpan } from '@/types';
import { ProvenanceBadge } from './ProvenanceBadge';
import { SourceExcerpt } from './SourceExcerpt';

export interface GroundedFieldEditorProps {
  label: string;
  value: GroundedText;
  sourceSpans: SourceSpan[];
  onChange(value: GroundedText): void;
  onRemove?: () => void;
  disabled?: boolean;
  error?: string;
  multiline?: boolean;
}

export function GroundedFieldEditor({
  label,
  value,
  sourceSpans,
  onChange,
  onRemove,
  disabled = false,
  error,
  multiline = true,
}: GroundedFieldEditorProps) {
  const controlId = `grounded-${value.id}`;
  const errorId = error ? `${controlId}-error` : undefined;
  const controlProps = {
    id: controlId,
    value: value.text,
    disabled,
    'aria-invalid': Boolean(error),
    'aria-describedby': errorId,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...value, text: event.target.value }),
  };

  return (
    <div className="grounded-field">
      <div className="grounded-field__heading">
        <label htmlFor={controlId}>{label}</label>
        <ProvenanceBadge basis={value.basis} />
      </div>
      {multiline ? <textarea {...controlProps} rows={3} /> : <input {...controlProps} type="text" />}
      {error ? (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
      <SourceExcerpt grounded={value} sourceSpans={sourceSpans} />
      {onRemove ? (
        <button className="review-text-button review-text-button--danger" disabled={disabled} onClick={onRemove} type="button">
          Remove {label.toLocaleLowerCase()}
        </button>
      ) : null}
    </div>
  );
}
