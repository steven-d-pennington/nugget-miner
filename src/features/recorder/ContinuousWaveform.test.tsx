import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ContinuousWaveform } from './ContinuousWaveform';

describe('ContinuousWaveform', () => {
  it('renders a flat baseline while inactive', () => {
    render(<ContinuousWaveform active={false} level={0.8} sampleCount={5} />);
    expect(screen.getByTestId('continuous-waveform-line')).toHaveAttribute(
      'points',
      '0,20 25,20 50,20 75,20 100,20',
    );
  });

  it('adds clamped live levels to one continuous line and resets when inactive', () => {
    const view = render(<ContinuousWaveform active level={0.25} sampleCount={5} />);
    const first = screen.getByTestId('continuous-waveform-line').getAttribute('points');
    view.rerender(<ContinuousWaveform active level={2} sampleCount={5} />);
    const second = screen.getByTestId('continuous-waveform-line').getAttribute('points');
    expect(second).not.toBe(first);
    expect(second).not.toContain('NaN');

    view.rerender(<ContinuousWaveform active={false} level={0} sampleCount={5} />);
    expect(screen.getByTestId('continuous-waveform-line')).toHaveAttribute(
      'points',
      '0,20 25,20 50,20 75,20 100,20',
    );
  });

  it('makes an ordinary low phone-microphone level visibly responsive', () => {
    render(<ContinuousWaveform active level={0.04} sampleCount={2} />);
    const points = screen.getByTestId('continuous-waveform-line').getAttribute('points') ?? '';
    const finalY = Number(points.split(' ').at(-1)?.split(',').at(-1));

    expect(Math.abs(finalY - 20)).toBeGreaterThanOrEqual(5);
  });

  it('keeps sub-threshold room noise on the baseline', () => {
    render(<ContinuousWaveform active level={0.008} sampleCount={2} />);

    expect(screen.getByTestId('continuous-waveform-line')).toHaveAttribute(
      'points',
      '0,20 100,20',
    );
  });
});
