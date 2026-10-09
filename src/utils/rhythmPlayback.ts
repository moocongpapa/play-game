interface Clock {
  setTimeout: (run: () => void, ms: number) => number;
  clearTimeout: (id: number) => void;
}
export type GuideCompletion = { onEnd: () => void; onError: () => void; onCancel: () => void };

/** The guide owns its duration. Only its completion starts the notes. */
export function createRhythmPlayback(options: {
  clock: Clock;
  isVisible: () => boolean;
  onNote: (note: number, index: number) => void;
  onRest: () => void;
  onFinish: () => void;
  onCancel: () => void;
}) {
  let generation = 0;
  let playing = false;
  let timer: number | undefined;
  const cancel = () => {
    generation++;
    if (timer !== undefined) options.clock.clearTimeout(timer);
    timer = undefined;
    if (playing) { playing = false; options.onCancel(); }
  };
  return {
    cancel,
    isPlaying: () => playing,
    start(notes: number[], guide: (callbacks: GuideCompletion) => void) {
      if (playing || !options.isVisible()) return false;
      playing = true;
      const current = ++generation;
      let started = false;
      const valid = () => playing && generation === current && options.isVisible();
      const note = (index: number) => {
        if (!valid()) { if (generation === current) cancel(); return; }
        if (index === notes.length) { playing = false; options.onFinish(); return; }
        options.onNote(notes[index], index);
        timer = options.clock.setTimeout(() => {
          if (!valid()) return;
          options.onRest();
          timer = options.clock.setTimeout(() => note(index + 1), 150);
        }, 600);
      };
      const begin = () => { if (!started && valid()) { started = true; note(0); } };
      guide({ onEnd: begin, onError: begin, onCancel: () => { if (generation === current) cancel(); } });
      return true;
    },
  };
}
