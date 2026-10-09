interface CountdownClock {
  now: () => number;
  setTimeout: (callback: () => void, delay: number) => number;
  clearTimeout: (id: number) => void;
}

/** Counts visible play time, retaining even the fractional second across pauses. */
export function createPlayCountdown(clock: CountdownClock, isPaused: () => boolean,
  onTick: (seconds: number) => void, onExpire: () => void) {
  let remaining = 0;
  let startedAt: number | null = null;
  let timer: number | undefined;
  let generation = 0;
  let running = false;

  const cancel = () => {
    generation++;
    if (timer !== undefined) clock.clearTimeout(timer);
    timer = undefined;
  };
  const sample = () => {
    if (startedAt !== null) remaining = Math.max(0, remaining - Math.max(0, clock.now() - startedAt));
    startedAt = null;
  };
  const pause = () => {
    cancel();
    sample();
    if (running) onTick(Math.ceil(remaining / 1000));
  };
  const resume = () => {
    if (!running || timer !== undefined || isPaused()) return;
    startedAt = clock.now();
    const version = generation;
    timer = clock.setTimeout(() => {
      if (version !== generation || !running) return;
      if (isPaused()) { pause(); return; }
      timer = undefined;
      sample();
      onTick(Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        running = false;
        onExpire();
      } else resume();
    }, Math.min(remaining, remaining % 1000 || 1000));
  };
  const stop = () => {
    cancel();
    running = false;
    startedAt = null;
  };
  const start = (seconds: number) => {
    stop();
    remaining = Math.max(0, seconds * 1000);
    running = remaining > 0;
    onTick(Math.ceil(remaining / 1000));
    resume();
  };
  return { start, stop, sync: () => { if (isPaused()) pause(); else resume(); } };
}
