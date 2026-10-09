import { useCallback, useEffect, useRef } from 'react';

/** A round's delayed reactions must never follow the child back to the home screen. */
export function useGameTimeouts() {
  const timers = useRef(new Set<number>());
  const clearGameTimeouts = useCallback(() => {
    timers.current.forEach(id => window.clearTimeout(id));
    timers.current.clear();
  }, []);
  useEffect(() => clearGameTimeouts, [clearGameTimeouts]);
  const cancelGameTimeout = useCallback((id: number | null) => {
    if (id === null) return;
    window.clearTimeout(id);
    timers.current.delete(id);
  }, []);
  const scheduleGameTimeout = useCallback((callback: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      if (timers.current.delete(id)) callback();
    }, delay);
    timers.current.add(id);
    return id;
  }, []);
  return { scheduleGameTimeout, cancelGameTimeout, clearGameTimeouts };
}
