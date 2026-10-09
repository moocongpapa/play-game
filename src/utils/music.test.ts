import test from 'node:test';
import assert from 'node:assert/strict';
import { BACKGROUND_MUSIC, SLEEP_MUSIC } from '../data/backgroundMusic';

test('BGM changes through all six tracks, ducks/restores volume and cancels on mute', async () => {
  const savedWindow = globalThis.window;
  const originalRandom = Math.random;
  let nextStep: (() => void) | undefined;
  let canResume = false;
  const gains: { value: number; setValueAtTime: (v: number) => void; setTargetAtTime: (v: number) => void; cancelScheduledValues: () => void; linearRampToValueAtTime: (v: number) => void; exponentialRampToValueAtTime: (v: number) => void }[] = [];
  const notes: { frequency: { value: number }; stopped: boolean }[] = [];
  class Context {
    state = 'suspended'; currentTime = 0; destination = {};
    resume() { if (canResume) this.state = 'running'; return Promise.resolve(); }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
    createGain() {
      const gain = { value: 0, setValueAtTime(v: number) { this.value = v; }, setTargetAtTime(v: number) { this.value = v; }, cancelScheduledValues() {}, linearRampToValueAtTime(v: number) { this.value = v; }, exponentialRampToValueAtTime(v: number) { this.value = v; } };
      gains.push(gain); return { gain, connect() {}, disconnect() {} };
    }
    createOscillator() {
      const node = { frequency: { value: 0 }, stopped: false, type: 'sine', onended: null as (() => void) | null,
        connect() {}, disconnect() {}, start() {}, stop(at?: number) { if (at === undefined) { this.stopped = true; this.onended?.(); } } };
      notes.push(node); return node;
    }
  }
  try {
    Math.random = () => 0;
    globalThis.window = { AudioContext: Context, setTimeout(callback: () => void) { nextStep = callback; return 1; }, clearTimeout() { nextStep = undefined; } } as unknown as Window & typeof globalThis;
    const engine = await import('./soundEngine');
    engine.startBGM(.2);
    for (let i = 0; i < 5; i++) nextStep?.();
    assert.equal(notes.length, 0, 'autoplay-blocked context must not accumulate notes');
    canResume = true;
    engine.getAudioContext();
    nextStep?.();
    const heard: string[] = [];
    // Fisher–Yates with zero moves the first track to the end.
    const expected = [...BACKGROUND_MUSIC.slice(1), BACKGROUND_MUSIC[0]];
    for (const track of expected) {
      const first = notes.at(-1);
      assert.ok(first);
      heard.push(track.id);
      for (let i = 1; i < track.notes.length * 2; i++) nextStep?.();
      const count = notes.length;
      nextStep?.();
      assert.ok(notes.length > count);
      // The melody's first note is emitted before its optional octave and bass.
      const following = expected[(heard.length) % expected.length];
      if (heard.length < 6) assert.ok(Math.abs(notes[count].frequency.value - 440 * 2 ** ((following.notes[0] - 69) / 12)) < .001);
    }
    assert.equal(new Set(heard).size, 6);
    engine.setBGMDucked('animal', true);
    assert.equal(gains[0].value, .2 * .3);
    engine.setBGMVolume(.1);
    assert.equal(gains[0].value, .1 * .3);
    engine.setBGMDucked('speech', true);
    engine.setBGMDucked('animal', false);
    assert.equal(gains[0].value, .1 * .3, 'finishing one sound cannot unduck an ongoing voice');
    engine.setBGMDucked('speech', false);
    assert.equal(gains[0].value, .1);
    engine.setBGMDucked('video', true);
    assert.equal(gains[0].value, 0, 'the film owns the soundtrack while its modal is open');
    engine.setBGMDucked('effect', true);
    engine.setBGMDucked('effect', false);
    engine.setBGMVolume(.15);
    assert.equal(gains[0].value, 0, 'cheers and preference updates cannot restart music over the film');
    engine.setBGMDucked('speech', true);
    engine.setBGMDucked('video', false);
    assert.equal(gains[0].value, .15 * .3, 'closing a film still respects another active duck');
    engine.setBGMDucked('speech', false);
    assert.equal(gains[0].value, .15, 'closing the film restores the latest configured volume');
    engine.setBGMVolume(.1);
    engine.setBGMScene('sleep');
    assert.ok(notes.every(note => note.stopped), 'entering bedtime releases the previous song');
    const sleepGain = gains.length, sleepNote = notes.length;
    engine.startBGM();
    assert.equal(gains[sleepGain].value, .1 * .55, 'lullaby is quieter and honors the saved volume');
    assert.ok(Math.abs(notes[sleepNote].frequency.value - 440 * 2 ** ((SLEEP_MUSIC.notes[0] - 69) / 12)) < .001);
    engine.setBGMDucked('speech', true);
    assert.equal(gains[sleepGain].value, .1 * .55 * .3);
    engine.setBGMDucked('speech', false);
    engine.setBGMScene('play');
    assert.equal(nextStep, undefined, 'leaving bedtime cancels its schedule');
    const restoredGain = gains.length;
    engine.startBGM();
    assert.equal(gains[restoredGain].value, .1);
    engine.setAudioPreferences(false);
    assert.equal(nextStep, undefined);
    assert.ok(notes.every(note => note.stopped));
    const count = notes.length;
    engine.startBGM();
    assert.equal(notes.length, count);
  } finally {
    Math.random = originalRandom;
    globalThis.window = savedWindow;
  }
});
