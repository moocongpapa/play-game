import assert from 'node:assert/strict';
import test from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { resumeAudioContext } from './audioContextLifecycle';

test('Safari interrupted contexts resume; closed or still-interrupted devices are not playable', async () => {
  let resumes = 0;
  const context = { state: 'interrupted', async resume() { resumes++; this.state = 'running'; } };
  assert.equal(await resumeAudioContext(context as unknown as AudioContext), true);
  assert.equal(resumes, 1);
  context.state = 'closed';
  assert.equal(await resumeAudioContext(context as unknown as AudioContext), false);
  assert.equal(resumes, 1, 'closed contexts cannot be resumed');
  context.state = 'interrupted';
  context.resume = async () => { resumes++; };
  assert.equal(await resumeAudioContext(context as unknown as AudioContext), false, 'a resolved resume is not proof that the audio device recovered');
  context.resume = async () => { throw new Error('Device still owned by video'); };
  assert.equal(await resumeAudioContext(context as unknown as AudioContext), false);
});

test('returning from video restores game audio after interruption without changing mute or BGM choices', async () => {
  const savedWindow = globalThis.window;
  let nextStep: (() => void) | undefined;
  const contexts: Context[] = [];
  const parameter = () => ({ value: 0, setValueAtTime(v: number) { this.value = v; },
    setTargetAtTime(v: number) { this.value = v; }, cancelScheduledValues() {},
    linearRampToValueAtTime(v: number) { this.value = v; }, exponentialRampToValueAtTime(v: number) { this.value = v; } });
  class Context {
    state = 'running'; currentTime = 0; destination = {}; resumes = 0;
    notes = 0; gains: ReturnType<typeof parameter>[] = [];
    constructor() { contexts.push(this); }
    async resume() { this.resumes++; this.state = 'running'; }
    async suspend() { this.state = 'suspended'; }
    createGain() { const gain = parameter(); this.gains.push(gain); return { gain, connect() {}, disconnect() {} }; }
    createOscillator() {
      const node = { frequency: parameter(), type: 'sine', onended: null as (() => void) | null,
        connect() {}, disconnect() {}, start: () => { this.notes++; },
        stop(at?: number) { if (at === undefined) this.onended?.(); } };
      return node;
    }
  }
  try {
    globalThis.window = { AudioContext: Context,
      setTimeout(callback: () => void) { nextStep = callback; return 1; },
      clearTimeout() { nextStep = undefined; } } as unknown as Window & typeof globalThis;
    const engine = await import('./soundEngine');
    engine.setAudioPreferences(true);
    engine.startBGM(.12);
    const first = contexts[0];
    assert.ok(first.notes > 0);
    engine.setBGMDucked('video', true);
    assert.equal(first.gains[0].value, 0);
    first.state = 'interrupted';
    engine.resumeAfterVideoPlayback();
    await setImmediate();
    assert.equal(first.state, 'running');
    assert.equal(first.resumes, 1);
    assert.ok(first.gains.some(gain => gain.value === .12), 'the previous music session is rebuilt at the saved volume');
    const notes = first.notes;
    engine.playJellyTap();
    assert.ok(first.notes > notes, 'game effects play again after leaving the video');
    first.state = 'interrupted';
    engine.startBGM();
    assert.equal(first.state, 'running', 'an already-playing music session still checks whether its device needs resuming');

    first.state = 'closed';
    engine.resumeAfterVideoPlayback();
    assert.equal(contexts.length, 2, 'a closed device must be replaced, not reused');
    const replacement = contexts[1];
    assert.ok(replacement.notes > 0, 'the music graph belongs to the new context');

    engine.stopBGM();
    const disabledMusicNotes = replacement.notes;
    replacement.state = 'interrupted';
    engine.resumeAfterVideoPlayback();
    assert.equal(replacement.state, 'running', 'effects and speech still recover when music is off');
    assert.equal(replacement.notes, disabledMusicNotes, 'closing a video cannot turn disabled music on');
    assert.equal(nextStep, undefined);

    engine.setAudioPreferences(false);
    replacement.state = 'interrupted';
    const mutedResumes = replacement.resumes;
    engine.resumeAfterVideoPlayback();
    engine.playJellyTap();
    assert.equal(replacement.resumes, mutedResumes, 'global mute remains in force');
    assert.equal(replacement.notes, disabledMusicNotes);
    assert.equal(contexts.length, 2);
  } finally {
    globalThis.window = savedWindow;
  }
});
