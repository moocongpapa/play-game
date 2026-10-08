import { useCallback, useEffect, useRef, useState } from 'react';
import { createGentleHelp, type HelpLevel } from '../utils/gentleHelp';

export function useGentleHelp(resetKey: string | number, disabled = false) {
  const [level, setLevel] = useState<HelpLevel>(0);
  const controller = useRef<ReturnType<typeof createGentleHelp> | null>(null);
  useEffect(() => {
    setLevel(0);
    if (disabled) return;
    const help = createGentleHelp(setLevel, {
      setTimeout: (callback, ms) => window.setTimeout(callback, ms), clearTimeout: id => window.clearTimeout(id),
    });
    controller.current = help;
    const sync = () => { if (document.hidden) help.pause('hidden'); else help.resume('hidden'); };
    const blur = () => help.pause('blur');
    const focus = () => help.resume('blur');
    sync();
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('blur', blur); window.addEventListener('focus', focus);
    return () => {
      help.dispose(); controller.current = null;
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('blur', blur); window.removeEventListener('focus', focus);
    };
  }, [resetKey, disabled]);
  const progress = useCallback(() => controller.current?.progress(), []);
  const miss = useCallback(() => controller.current?.miss(), []);
  const hold = useCallback(() => controller.current?.pause('gesture'), []);
  const release = useCallback(() => controller.current?.resume('gesture'), []);
  return { level: disabled ? 0 : level, progress, miss, hold, release };
}
