import type { ProcessingStage, ProcessingState } from '@/types';

const visibleStages = [
  { label: 'Saved', states: ['saved', 'queued'] },
  { label: 'Transcribing', states: ['transcribing'] },
  { label: 'Organizing', states: ['transcript_ready', 'segmenting', 'organizing'] },
  { label: 'Ready for review', states: ['ready_for_review', 'partially_confirmed', 'confirmed'] },
] as const satisfies ReadonlyArray<{ label: string; states: readonly ProcessingState[] }>;

function stageIndex(state: ProcessingState, recoverableStage?: ProcessingStage, hasTranscript = false) {
  const direct = visibleStages.findIndex((stage) => stage.states.some((candidate) => candidate === state));
  if (direct >= 0) return direct;
  if (recoverableStage === 'transcription') return 1;
  if (recoverableStage === 'segmentation' || recoverableStage === 'organization') return 2;
  if (recoverableStage === 'persistence') return hasTranscript ? 2 : 0;
  return hasTranscript ? 2 : 0;
}

interface ProcessingTimelineProps {
  state: ProcessingState;
  recoverableStage?: ProcessingStage;
  hasTranscript?: boolean;
}

export function ProcessingTimeline({ state, recoverableStage, hasTranscript = false }: ProcessingTimelineProps) {
  const currentIndex = stageIndex(state, recoverableStage, hasTranscript);

  return (
    <ol aria-label="Processing progress" className="processing-timeline">
      {visibleStages.map((stage, index) => {
        const complete = currentIndex > index;
        const current = currentIndex === index;
        return (
          <li
            aria-current={current ? 'step' : undefined}
            className="processing-timeline__stage"
            data-state={complete ? 'complete' : current ? 'current' : 'upcoming'}
            key={stage.label}
          >
            <span aria-hidden="true" className="processing-timeline__icon">
              {state === 'failed' && current ? '!' : complete ? '✓' : current ? '●' : '○'}
            </span>
            <span>{stage.label}</span>
            <span className="sr-only">
              {complete ? ' complete' : current ? (state === 'failed' ? ' failed here' : ' current step') : ' not started'}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
