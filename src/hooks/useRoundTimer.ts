import { useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PlayHintsPausedContext } from '../components/PlayFlowContext';
import { createPlayCountdown } from '../utils/playCountdown';
import { playCountdownTick, setBGMTempo } from '../utils/soundEngine';

/** A question's countdown shares the same pause rules as the rest of the game. */
export function useRoundTimer(seconds: number, onExpire: () => void, extraPaused = false) {
  const parentPaused = useContext(PlayHintsPausedContext);
  const paused = parentPaused || extraPaused;
  const [timeLeft, setTimeLeft] = useState(seconds);
  const [timeOut, setTimeOut] = useState(false);
  const latest = useRef({ seconds, onExpire, paused });
  const lastTickedRef = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof createPlayCountdown> | null>(null);
  if (!timer.current) {
    timer.current = createPlayCountdown({
      now: () => performance.now(),
      setTimeout: (callback, delay) => window.setTimeout(callback, delay),
      clearTimeout: id => window.clearTimeout(id),
    }, () => latest.current.paused || document.hidden, (nextTime) => {
      setTimeLeft(nextTime);
      if (latest.current.seconds > 5 && nextTime >= 1 && nextTime <= 5 && lastTickedRef.current !== nextTime) {
        lastTickedRef.current = nextTime;
        setBGMTempo(1.16);
        playCountdownTick(nextTime);
      }
    }, () => {
      lastTickedRef.current = null;
      setBGMTempo(1.0);
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
      setBGMTempo(1.0);
    };
  }, []);
  const startRoundTimer = useCallback(() => {
    lastTickedRef.current = null;
    setBGMTempo(1.0);
    setTimeOut(false);
    timer.current!.start(latest.current.seconds);
  }, []);
  const stopRoundTimer = useCallback(() => {
    lastTickedRef.current = null;
    setBGMTempo(1.0);
    timer.current!.stop();
  }, []);
  return { timeLeft, timeOut, startRoundTimer, stopRoundTimer };
}
