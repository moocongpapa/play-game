import { useContext, useLayoutEffect, useRef } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
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
  const transitionRef = useRef<ReturnType<typeof createRoundContinuation> | null>(null);

  // Volume and other parent updates must not restart the celebration countdown.
  useLayoutEffect(() => { nextRef.current = onNext; }, [onNext]);

  useLayoutEffect(() => {
    if (day || paused) return;
    const transition = createRoundContinuation(() => nextRef.current(), delayMs, window, () => !isSpeechBusy());
    transitionRef.current = transition;
    const syncVisibility = () => {
      if (document.hidden) transition.pause();
      else transition.resume();
    };
    document.addEventListener('visibilitychange', syncVisibility);
    syncVisibility();
    return () => {
      document.removeEventListener('visibilitychange', syncVisibility);
      transition.dispose();
      transitionRef.current = null;
    };
  }, [delayMs, !!day, paused]);

  if (day) return <div className="day-next"><button type="button" disabled={paused} onClick={day.onNext} aria-label={day.label}>{day.picture}<span><ArrowRight aria-hidden="true" /></span></button></div>;

  return <div className="round-continuation" role="status">
    <span className="sr-only">{label}</span>
    <Sparkles aria-hidden="true" size={25} />
    <div className="round-continuation-dots" aria-hidden="true"><i /><i /><i /></div>
    <button type="button" disabled={paused} onClick={() => transitionRef.current?.advance()} aria-label="다음 놀이 바로 시작">
      <ArrowRight aria-hidden="true" size={30} />
    </button>
  </div>;
}
