'use client';

import { useEffect, useMemo, useState } from 'react';

export interface ContinuousWaveformProps {
  level: number;
  active: boolean;
  sampleCount?: number;
}

const WIDTH = 100;
const HEIGHT = 40;
const CENTER = HEIGHT / 2;
const AMPLITUDE = 15;
const NOISE_FLOOR = 0.012;
const SPEECH_CEILING = 0.18;
const SENSITIVITY_CURVE = 0.55;

function clampLevel(level: number) {
  return Number.isFinite(level) ? Math.min(1, Math.max(0, level)) : 0;
}

function toVisualLevel(level: number) {
  const clamped = clampLevel(level);
  if (clamped <= NOISE_FLOOR) return 0;
  const speechRange = (clamped - NOISE_FLOOR) / (SPEECH_CEILING - NOISE_FLOOR);
  return Math.pow(Math.min(1, speechRange), SENSITIVITY_CURVE);
}

function emptySamples(sampleCount: number) {
  return Array.from({ length: sampleCount }, () => 0);
}

export function ContinuousWaveform({
  level,
  active,
  sampleCount = 48,
}: ContinuousWaveformProps) {
  const count = Math.max(2, Math.round(sampleCount));
  const [samples, setSamples] = useState<number[]>(() => emptySamples(count));

  useEffect(() => {
    if (!active) {
      setSamples(emptySamples(count));
      return;
    }
    setSamples((current) => {
      const normalized = current.length === count ? current : emptySamples(count);
      return [...normalized.slice(1), toVisualLevel(level)];
    });
  }, [active, count, level]);

  const points = useMemo(
    () => samples.map((sample, index) => {
      const x = (index / (samples.length - 1)) * WIDTH;
      const direction = index % 2 === 0 ? -1 : 1;
      const y = CENTER + direction * sample * AMPLITUDE;
      return `${Number(x.toFixed(2))},${Number(y.toFixed(2))}`;
    }).join(' '),
    [samples],
  );

  return (
    <svg
      aria-hidden="true"
      className="continuous-waveform"
      data-testid="continuous-waveform"
      preserveAspectRatio="none"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
    >
      <line className="continuous-waveform__baseline" x1="0" x2={WIDTH} y1={CENTER} y2={CENTER} />
      <polyline
        className="continuous-waveform__line"
        data-testid="continuous-waveform-line"
        points={points}
      />
    </svg>
  );
}
