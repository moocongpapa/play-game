interface GameClock {
  now: () => number;
  setTimeout: (callback: () => void, delay: number) => number;
  clearTimeout: (id: number) => void;
}
type Job = { callback: () => void; remaining: number; started: number; timer?: number; version: number };

/** Stable handles survive a pause; only foreground time consumes each delay. */
export function createGameTimeouts(clock: GameClock, initiallyPaused = false) {
  const jobs = new Map<number, Job>();
  let sequence = 0, paused = initiallyPaused;
  const arm = (id: number, job: Job) => {
    job.started = clock.now();
    const version = ++job.version;
    job.timer = clock.setTimeout(() => {
      if (paused || jobs.get(id) !== job || job.version !== version) return;
      jobs.delete(id);
      job.callback();
    }, job.remaining);
  };
  const cancel = (id: number | null) => {
    if (id === null) return;
    const job = jobs.get(id);
    if (!job) return;
    if (job.timer !== undefined) clock.clearTimeout(job.timer);
    jobs.delete(id);
  };
  return {
    schedule(callback: () => void, delay: number) {
      const id = ++sequence;
      const job: Job = { callback, remaining: Math.max(0, Number.isFinite(delay) ? delay : 0), started: 0, version: 0 };
      jobs.set(id, job);
      if (!paused) arm(id, job);
      return id;
    },
    cancel,
    clear() { for (const id of jobs.keys()) cancel(id); },
    setPaused(next: boolean) {
      if (paused === next) return;
      paused = next;
      for (const [id, job] of jobs) {
        if (paused) {
          job.remaining = Math.max(0, job.remaining - (clock.now() - job.started));
          job.version++;
          if (job.timer !== undefined) clock.clearTimeout(job.timer);
          job.timer = undefined;
        } else arm(id, job);
      }
    },
  };
}
