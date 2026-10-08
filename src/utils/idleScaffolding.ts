export const IDLE_HINT_DELAY = 4000;
type Clock = { setTimeout: (run: () => void, ms: number) => number; clearTimeout: (id: number) => void };

/** One hint per quiet spell. Held fingers and hidden pages never count as idle. */
export function createIdleScaffolding(onChange: (idle: boolean) => void, clock: Clock) {
  let timer: number | undefined;
  let idle = false;
  let disposed = false;
  const pauses = new Set<string>();
  const clear = () => { if (timer !== undefined) clock.clearTimeout(timer); timer = undefined; };
  const reset = () => {
    if (disposed) return;
    clear();
    if (idle) { idle = false; onChange(false); }
    if (!pauses.size) timer = clock.setTimeout(() => {
      timer = undefined;
      idle = true;
      onChange(true);
    }, IDLE_HINT_DELAY);
  };
  reset();
  return {
    reset,
    isIdle: () => idle && !disposed,
    pause(reason: string) { if (!disposed) { pauses.add(reason); reset(); } },
    resume(reason: string) { if (!disposed && pauses.delete(reason)) reset(); },
    dispose() { disposed = true; clear(); pauses.clear(); },
  };
}
