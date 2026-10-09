interface RoundClock {
  setTimeout: (callback: () => void, delay: number) => number;
  clearTimeout: (id: number) => void;
}

export const ROUND_CONTINUATION_DELAY_MS = 1600;
const SPEECH_POLL_MS = 150;
const MAX_SPEECH_WAIT_MS = 4500;

/** Owns one transition; old timers and repeated taps can never advance it twice. */
export function createRoundContinuation(onNext: () => void, delayMs: number, clock: RoundClock, ready = () => true) {
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
    const check = (waited = 0) => {
      if (currentGeneration !== generation || finished || disposed) return;
      // Let a short praise finish, but a stalled audio provider must not lock play.
      if (!ready() && waited < MAX_SPEECH_WAIT_MS) {
        timer = clock.setTimeout(() => check(waited + SPEECH_POLL_MS), SPEECH_POLL_MS);
      } else advance();
    };
    timer = clock.setTimeout(check, delayMs);
  };

  const dispose = () => {
    disposed = true;
    pause();
  };

  return { advance, pause, resume, dispose };
}
