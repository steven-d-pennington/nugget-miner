# TASK-03-02 — Level meter + waveform preview

> Epic: EPIC-03 · Priority: P0 · Est: S · Depends on: 03-01
> PRD: FR-103 · Docs: [UX §3, §7](../../product/03-ux-guidelines.md)

## Objective

Provide real-time audio level feedback during recording and a downsampled
waveform preview saved with the recording.

## Implementation steps

1. In `RecorderService`, create a Web Audio `AudioContext` + `AnalyserNode` from
   the capture stream; compute RMS per animation frame and emit via
   `onLevel(cb)` (architecture §3).
2. Accumulate a downsampled RMS array during recording to produce
   `waveformPreview: number[]` (fixed bucket count, e.g. 64) included in the
   `RecordingDraft`.
3. Build a presentational `LevelMeter` component driven by the level callback;
   mark it `aria-hidden` (decorative) and provide a text recording-state label
   elsewhere (UX §7).
4. Respect `prefers-reduced-motion` by reducing animation to discrete updates.

## Files to create / modify

- `src/lib/services/RecorderService.ts` (analyser + waveform accumulation)
- `src/components/LevelMeter.tsx`

## Acceptance criteria

- `onLevel` emits values ~0..1 while recording and stops on `stop()`/`cancel()`.
- `RecordingDraft.waveformPreview` has the fixed bucket count and reflects audio.
- `LevelMeter` animates on input and is `aria-hidden`.
- AnalyserNode/AudioContext are torn down with the stream (no leaks).

## Out of scope

Persisting/displaying the saved waveform on detail (03-06 may render it).
</content>
