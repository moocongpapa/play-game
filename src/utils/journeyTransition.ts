interface Clock { setTimeout: (run: () => void, ms: number) => number; clearTimeout: (id: number) => void }

/** Wait for both the scene's minimum display time and the current voice to finish. */
export function createJourneyTransition(next: () => void, delayMs: number, ready: () => boolean, clock: Clock, maxReadyWaitMs = Infinity) {
  let timer: number | undefined;
  let generation = 0;
  let disposed = false;
  let advanced = false;
  let expedited = false;
  const pause = () => { generation++; if (timer !== undefined) clock.clearTimeout(timer); timer = undefined; };
  const resume = () => {
    if (disposed || advanced) return;
    pause();
    const ticket = generation;
    const check = (waited = 0) => {
      if (disposed || advanced || ticket !== generation) return;
      if (!ready() && waited < maxReadyWaitMs) { timer = clock.setTimeout(() => check(waited + 150), 150); return; }
      advanced = true; pause(); next();
    };
    timer = clock.setTimeout(check, expedited ? 0 : delayMs);
  };
  return { pause, resume, advance: () => { expedited = true; resume(); }, dispose: () => { disposed = true; pause(); } };
}
