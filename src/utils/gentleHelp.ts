export type HelpLevel = 0 | 1 | 2 | 3;
interface Clock { setTimeout: (callback: () => void, ms: number) => number; clearTimeout: (id: number) => void }
const DELAYS = [6500, 6500, 7500];

/** Escalate help only while play is visible and the child is not holding a piece. */
export function createGentleHelp(onChange: (level: HelpLevel) => void, clock: Clock) {
  let level: HelpLevel = 0;
  let misses = 0;
  let timer: number | undefined;
  let disposed = false;
  const pauses = new Set<string>();
  const clear = () => { if (timer !== undefined) clock.clearTimeout(timer); timer = undefined; };
  const schedule = () => {
    clear();
    if (disposed || pauses.size || level === 3) return;
    timer = clock.setTimeout(() => { level = (level + 1) as HelpLevel; onChange(level); schedule(); }, DELAYS[level]);
  };
  const controller = {
    progress() { if (disposed) return; misses = 0; level = 0; onChange(0); schedule(); },
    miss() { if (disposed) return; misses++; level = Math.min(3, Math.max(level, misses)) as HelpLevel; onChange(level); schedule(); },
    pause(reason: string) { pauses.add(reason); clear(); },
    resume(reason: string) { pauses.delete(reason); schedule(); },
    dispose() { disposed = true; clear(); },
  };
  schedule();
  return controller;
}
