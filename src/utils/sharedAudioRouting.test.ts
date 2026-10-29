import assert from 'node:assert/strict';
import test from 'node:test';

test('drawing and echo playback share parent volume and master mute, including an already playing robot', async () => {
  const descriptors = new Map(['window', 'document'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const voices: FakeNode[] = [], gains: FakeNode[] = [];
  let contexts = 0;
  const parameter = () => ({ value: 1, setValueAtTime(value: number) { this.value = value; }, setTargetAtTime(value: number) { this.value = value; }, cancelScheduledValues() {}, exponentialRampToValueAtTime(value: number) { this.value = value; } });
  class FakeNode {
    gain = parameter(); frequency = parameter(); playbackRate = parameter(); Q = parameter();
    type = ''; buffer = null; onended: (() => void) | null = null;
    target: unknown = null; stopped = false; disconnected = false;
    constructor(public context: Context) {}
    connect(target: unknown) { this.target = target; return target as FakeNode; }
    disconnect() { this.disconnected = true; }
    start() {}
    stop() { this.stopped = true; }
  }
  class Context {
    state = 'running'; currentTime = 1; sampleRate = 48000; destination = { hardware: true };
    constructor() { contexts++; }
    async resume() { this.state = 'running'; }
    async suspend() { this.state = 'suspended'; }
    createGain() { const node = new FakeNode(this); gains.push(node); return node; }
    createOscillator() { const node = new FakeNode(this); voices.push(node); return node; }
    createBufferSource() { const node = new FakeNode(this); voices.push(node); return node; }
    createBiquadFilter() { return new FakeNode(this); }
    createBuffer() { return { getChannelData: () => new Float32Array(48000) }; }
  }
  Object.defineProperties(globalThis, {
    window: { configurable: true, value: { AudioContext: Context, setTimeout, clearTimeout } },
    document: { configurable: true, value: { hidden: false } },
  });
  const engine = await import('./soundEngine');
  const sketch = await import('../sketch/sound');
  const echo = await import('./echoPlayback');
  try {
    engine.setAudioPreferences(true);
    engine.setSFXVolume(.4);
    sketch.playSound('tap', false);
    sketch.playDrawingSound('fill', false);
    const context = engine.getAudioContext();
    const bus = engine.getSfxDestination(context) as unknown as FakeNode;
    assert.equal(contexts, 1, 'sketch does not create a private AudioContext');
    assert.equal(bus.gain.value, .4);
    for (const voice of voices) assert.equal((voice.target as FakeNode).target, bus, 'every drawing voice reaches the shared bus');
    const before = voices.length;
    let ended = 0;
    const playback = echo.playEchoBuffer({} as AudioBuffer, 'robot', () => ended++);
    assert.ok(playback);
    const [source, lfo] = voices.slice(before);
    assert.equal((source.target as FakeNode).target, bus);
    engine.setSFXVolume(0);
    assert.equal(bus.gain.value, 0, 'an already playing recording and brush sound become silent at 0%');
    engine.setSFXVolume(.7);
    assert.equal(bus.gain.value, .7);
    playback.stop(); playback.stop();
    assert.ok(source.stopped && source.disconnected && lfo.stopped && lfo.disconnected);
    assert.equal(ended, 0, 'manual close never acts like a natural playback completion');
    const count = voices.length;
    engine.setAudioPreferences(false);
    sketch.playSound('fanfare', false);
    sketch.playDrawingSound('fill', false);
    assert.equal(echo.playEchoBuffer({} as AudioBuffer, 'chipmunk', () => ended++), null);
    assert.equal(voices.length, count, 'global mute prevents both local callers even with stale false muted props');
    assert.equal(gains.filter(node => node.target === context.destination).length, 1, 'local effects never create a direct-to-hardware bypass');
    engine.setAudioPreferences(true);
    Object.defineProperty(document, 'hidden', { value: true });
    sketch.playSound('tap', false);
    assert.equal(echo.playEchoBuffer({} as AudioBuffer, 'bear', () => ended++), null);
    assert.equal(voices.length, count, 'hidden pages cannot resume local effects');
  } finally {
    engine.setAudioPreferences(false);
    for (const [key, descriptor] of descriptors) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key);
  }
});
