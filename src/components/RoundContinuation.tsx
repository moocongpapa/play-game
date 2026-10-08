import { useContext, useEffect, useLayoutEffect, useRef } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { createRoundContinuation } from '../utils/roundContinuation';
import { DayContinuationContext } from './PlayFlowContext';

interface RoundContinuationProps {
  onNext: () => void;
  delayMs?: number;
  label?: string;
}

/** Mount only after a round ends. Leaving the game cancels its next round. */
export function RoundContinuation({ onNext, delayMs = 3000, label = '곧 다음 놀이가 나와요!' }: RoundContinuationProps) {
  const day = useContext(DayContinuationContext);
  const nextRef = useRef(onNext);
  const transitionRef = useRef<ReturnType<typeof createRoundContinuation> | null>(null);

  // Volume and other parent updates must not restart the celebration countdown.
  useLayoutEffect(() => { nextRef.current = onNext; }, [onNext]);

  useEffect(() => {
    if (day) return;
    const transition = createRoundContinuation(() => nextRef.current(), delayMs, window);
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
  }, [delayMs, !!day]);

  if (day) return <div className="day-next"><p>{day.label}</p><button type="button" onClick={day.onNext} aria-label={day.label}>{day.picture}<span><ArrowRight /> 같이 가자!</span></button></div>;

  return <div className="round-continuation" role="status">
    <div className="round-continuation-message"><Sparkles aria-hidden="true" size={22} /><span>{label}</span></div>
    <div className="round-continuation-dots" aria-hidden="true"><i /><i /><i /><ArrowRight size={22} /></div>
    <button onClick={() => transitionRef.current?.advance()} aria-label="다음 놀이 바로 시작">
      바로 이어하기 <ArrowRight aria-hidden="true" size={17} />
    </button>
  </div>;
}
