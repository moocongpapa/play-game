import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PlayHintsPausedContext } from '../components/PlayFlowContext';
import { createPlayCountdown } from '../utils/playCountdown';

/** A question's countdown shares the same pause rules as the rest of the game. */
export function useRoundTimer(seconds: number, onExpire: () => void, extraPaused = false) {
  const parentPaused = useContext(PlayHintsPausedContext);
  const paused = parentPaused || extraPaused;
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [timeOut, setTimeOut] = useState(false);
  const latest = useRef({ seconds, onExpire, paused });
  const timer = useRef<ReturnType<typeof createPlayCountdown> | null>(null);
  if (!timer.current) {
    timer.current = createPlayCountdown({
      now: () => performance.now(),
      setTimeout: (callback, delay) => window.setTimeout(callback, delay),
      clearTimeout: id => window.clearTimeout(id),
    }, () => latest.current.paused || document.hidden, setTimeLeft, () => {
      setTimeOut(true);
      latest.current.onExpire();
    });
  }
  useLayoutEffect(() => {
    latest.current = { seconds, onExpire, paused };
  }, [seconds, onExpire, paused]);
  useLayoutEffect(() => { timer.current!.sync(); }, [paused]);
  useEffect(() => {
    const sync = () => timer.current!.sync();
    document.addEventListener('visibilitychange', sync);
    return () => {
      document.removeEventListener('visibilitychange', sync);
      timer.current!.stop();
    };
  }, []);
  const startRoundTimer = useCallback(() => {
    setTimeOut(false);
    timer.current!.start(latest.current.seconds);
  }, []);
  const stopRoundTimer = useCallback(() => timer.current!.stop(), []);
  return { timeLeft, timeOut, startRoundTimer, stopRoundTimer };
}
