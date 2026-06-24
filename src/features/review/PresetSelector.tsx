'use client';

import type { ExtractionPreset } from '@/types';

const presets: { id: ExtractionPreset; label: string }[] = [
  { id: 'general-thought', label: 'General thought' },
  { id: 'product-idea', label: 'Product idea' },
  { id: 'work-reminder', label: 'Work reminder' },
  { id: 'story-idea', label: 'Story idea' },
];

export function PresetSelector({ value, onChange }: { value: ExtractionPreset; onChange(value: ExtractionPreset): void }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-muted">
      Extraction preset
      <select
        className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-text"
        value={value}
        onChange={(event) => onChange(event.target.value as ExtractionPreset)}
      >
        {presets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
      </select>
    </label>
  );
}
