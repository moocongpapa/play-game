import { useContext, useLayoutEffect, useRef } from 'react';
import { createRoundContinuation, ROUND_CONTINUATION_DELAY_MS } from '../utils/roundContinuation';
import { isSpeechBusy } from '../utils/soundEngine';
import { DayContinuationContext, PlayHintsPausedContext } from './PlayFlowContext';

interface RoundContinuationProps {
  onNext: () => void;
  delayMs?: number;
  label?: string;
}

/** Mount only after a round ends. Leaving the game cancels its next round. */
export function RoundContinuation({ onNext, delayMs = ROUND_CONTINUATION_DELAY_MS, label = '곧 다음 놀이가 나와요!' }: RoundContinuationProps) {
  const day = useContext(DayContinuationContext);
  const paused = useContext(PlayHintsPausedContext);
  const nextRef = useRef(onNext);

  // Volume and other parent updates must not restart the celebration countdown.
  useLayoutEffect(() => { nextRef.current = day?.onNext ?? onNext; }, [onNext, day?.onNext]);

  useLayoutEffect(() => {
    if (paused) return;
    const transition = createRoundContinuation(() => nextRef.current(), day ? 450 : delayMs, window, () => !!day || !isSpeechBusy());
    const syncVisibility = () => {
      if (document.hidden) transition.pause();
      else transition.resume();
    };
    document.addEventListener('visibilitychange', syncVisibility);
    syncVisibility();
    return () => {
      document.removeEventListener('visibilitychange', syncVisibility);
      transition.dispose();
    };
  }, [delayMs, !!day, paused]);

  return <span className="sr-only" role="status">{label}</span>;
}
