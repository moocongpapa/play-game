interface RoundClock {
  setTimeout: (callback: () => void, delay: number) => number;
  clearTimeout: (id: number) => void;
}

/** Owns one transition; old timers and repeated taps can never advance it twice. */
export function createRoundContinuation(onNext: () => void, delayMs: number, clock: RoundClock) {
  let timer: number | undefined;
  let generation = 0;
  let finished = false;
  let disposed = false;

  const pause = () => {
    generation += 1;
    if (timer !== undefined) clock.clearTimeout(timer);
    timer = undefined;
  };

  const advance = () => {
    if (finished || disposed) return;
    finished = true;
    pause();
    onNext();
  };

  const resume = () => {
    if (finished || disposed) return;
    pause();
    const currentGeneration = generation;
    timer = clock.setTimeout(() => {
      if (currentGeneration === generation) advance();
    }, delayMs);
  };

  const dispose = () => {
    disposed = true;
    pause();
  };

  return { advance, pause, resume, dispose };
}
