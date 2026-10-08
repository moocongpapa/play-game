import test from 'node:test';
import assert from 'node:assert/strict';
import { XYLOPHONE_KEYS } from '../data/toddlerPlay';

test('instrument has eight ordered notes across one octave', () => {
  assert.equal(XYLOPHONE_KEYS.length, 8);
  assert.ok(XYLOPHONE_KEYS.every((key, i) => !i || key.frequency > XYLOPHONE_KEYS[i - 1].frequency));
  assert.ok(Math.abs(XYLOPHONE_KEYS[7].frequency / XYLOPHONE_KEYS[0].frequency - 2) < .001);
});

test('play sounds honor mute, bound rapid polyphony and stop every voice on exit', async () => {
  const savedWindow = globalThis.window;
  const voices: { stopped: boolean; disconnected: boolean; frequency: { value: number } }[] = [];
  const parameter = () => ({ value: 0, setValueAtTime(v: number) { this.value = v; }, exponentialRampToValueAtTime(v: number) { this.value = v; } });
  class Context {
    state = 'running'; currentTime = 0; destination = {};
    resume() { this.state = 'running'; return Promise.resolve(); }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
    createGain() { return { gain: parameter(), connect() {}, disconnect() {} }; }
    createOscillator() {
      const voice = { frequency: parameter(), stopped: false, disconnected: false, type: '', onended: null as (() => void) | null,
        connect() {}, disconnect() { this.disconnected = true; }, start() {},
        stop(at?: number) { if (at === undefined) { this.stopped = true; this.onended?.(); } } };
      voices.push(voice); return voice;
    }
  }
  try {
    globalThis.window = { AudioContext: Context, clearTimeout() {} } as unknown as Window & typeof globalThis;
    const sound = await import('./soundEngine');
    sound.setAudioPreferences(false);
    sound.playXylophoneNote(440);
    sound.playCareSound('bubble');
    assert.equal(voices.length, 0);
    sound.setAudioPreferences(true);
    sound.playXylophoneNote(440, false);
    assert.equal(voices.length, 0);
    sound.playXylophoneNote(440);
    assert.equal(voices[0].frequency.value, 440, 'the fundamental matches the selected key');
    for (let i = 0; i < 30; i++) sound.playXylophoneNote(XYLOPHONE_KEYS[i % 8].frequency);
    for (const kind of ['brush', 'chew', 'bubble'] as const) sound.playCareSound(kind);
    assert.ok(voices.filter(voice => !voice.stopped).length <= 32, 'rapid taps never accumulate unbounded audio nodes');
    sound.stopPlaySounds();
    assert.ok(voices.every(voice => voice.stopped && voice.disconnected));
    sound.playCareSound('chew');
    sound.setAudioPreferences(false);
    assert.ok(voices.every(voice => voice.stopped));
    const count = voices.length;
    sound.playXylophoneNote(440);
    sound.playCareSound('brush');
    assert.equal(voices.length, count);
  } finally {
    globalThis.window = savedWindow;
  }
});
