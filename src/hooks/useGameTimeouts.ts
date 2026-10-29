import { useContext, useEffect, useLayoutEffect, useRef } from 'react';
import { PlayHintsPausedContext } from '../components/PlayFlowContext';
import { createGameTimeouts } from '../utils/gameTimeouts';

/** A round's delayed reactions must never follow the child back to the home screen. */
export function useGameTimeouts() {
  const paused = useContext(PlayHintsPausedContext);
  const parent = useRef(paused);
  parent.current = paused;
  const timers = useRef<ReturnType<typeof createGameTimeouts> | null>(null);
  if (!timers.current) timers.current = createGameTimeouts({
    now: () => performance.now(),
    setTimeout: (run, delay) => window.setTimeout(run, delay),
    clearTimeout: id => window.clearTimeout(id),
  }, paused || document.hidden);
  const manager = timers.current;
  useLayoutEffect(() => { manager.setPaused(paused || document.hidden); }, [manager, paused]);
  useEffect(() => {
    const sync = () => manager.setPaused(parent.current || document.hidden);
    document.addEventListener('visibilitychange', sync);
    return () => { document.removeEventListener('visibilitychange', sync); manager.clear(); };
  }, [manager]);
  return { scheduleGameTimeout: manager.schedule, cancelGameTimeout: manager.cancel, clearGameTimeouts: manager.clear };
}
