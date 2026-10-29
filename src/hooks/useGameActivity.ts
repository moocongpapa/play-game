import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { PlayHintsPausedContext } from '../components/PlayFlowContext';
import { isPageHidden } from '../utils/pageVisibility';

/** One pause policy for game input, physics, and delayed transitions. */
export function useGameActivity() {
  const parentPaused = useContext(PlayHintsPausedContext);
  const [hidden, setHidden] = useState(isPageHidden);
  const parent = useRef(parentPaused);
  parent.current = parentPaused;
  useEffect(() => {
    const sync = () => setHidden(document.hidden);
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);
  const isBlocked = useCallback(() => parent.current || isPageHidden(), []);
  return { paused: parentPaused || hidden, isBlocked };
}
