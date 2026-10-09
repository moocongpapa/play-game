import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { tryGeneratedEffect, stopGeneratedEffects, setGeneratedEffectsEnabled } from '../services/generatedEffects';
import { startGeneratedMusic, stopGeneratedMusic } from '../services/generatedMusic';

test('generated effects stay instant, never play late, bound polyphony and stop on mute/navigation', async () => {
  const originals = new Map(['fetch', 'document', 'localStorage'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  let starts = 0, stops = 0, fetches = 0, running = 0, maximum = 0;
  let release: (response: Response) => void;
  const sources: { onended: (() => void) | null; stop: () => void }[] = [];
  const page = { hidden: false };
  const ctx = { state: 'running', currentTime: 0, destination: {}, decodeAudioData: async () => ({ duration: 30 }), createGain: () => ({
    gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, disconnect() {},
  }), createBufferSource: () => {
    let stopped = false;
    const source = { onended: null as (() => void) | null, playbackRate: { value: 1 }, connect() {}, disconnect() {},
      start() { starts++; running++; maximum = Math.max(maximum, running); },
      stop() { if (!stopped) { stopped = true; stops++; running--; source.onended?.(); } },
    }; sources.push(source); return source;
  } } as unknown as AudioContext;
  Object.defineProperties(globalThis, {
    document: { configurable: true, value: page },
    localStorage: { configurable: true, value: { getItem: () => null } },
    fetch: { configurable: true, value: async (url: string) => {
      fetches++; assert.match(url, /^\/audio\/elevenlabs\//, 'bundled audio needs no generation request');
      return new Promise<Response>(resolve => { release = resolve; });
    } },
  });
  const flush = async () => { await setImmediate(); await setImmediate(); };
  try {
    assert.equal(tryGeneratedEffect('tap', ctx), false, 'first tap immediately uses the procedural effect');
    await flush();
    assert.equal(tryGeneratedEffect('tap', ctx), false);
    assert.equal(fetches, 1, 'rapid taps share one asset load');
    release!(new Response(new Uint8Array(150))); await flush();
    assert.equal(starts, 0, 'a completed download must never make a late sound');
    assert.equal(tryGeneratedEffect('tap', ctx), true);
    for (let i = 0; i < 20; i++) tryGeneratedEffect('tap', ctx);
    assert.ok(maximum <= 8);
    stopGeneratedEffects(); assert.equal(starts, stops);
    setGeneratedEffectsEnabled(false);
    assert.equal(tryGeneratedEffect('tap', ctx), false);
    setGeneratedEffectsEnabled(true);
    tryGeneratedEffect('bounce', ctx); await flush();
    stopGeneratedEffects();
    release!(new Response(new Uint8Array(150))); await flush();
    assert.equal(starts, stops, 'navigation cancels late effect work');

    let ready = 0, failures = 0;
    startGeneratedMusic(ctx, ctx.destination, 'play', () => ready++, () => failures++); await flush();
    stopGeneratedMusic(); release!(new Response(new Uint8Array(150))); await flush();
    assert.equal(ready, 0, 'late background music cannot start after leaving');
    startGeneratedMusic(ctx, ctx.destination, 'sleep', () => ready++, () => failures++); await flush();
    release!(new Response(new Uint8Array(150))); await flush();
    assert.equal(ready, 1);
    stopGeneratedMusic(); assert.equal(starts, stops);
    assert.equal(failures, 0);
  } finally {
    stopGeneratedEffects(); stopGeneratedMusic();
    for (const [key, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
  }
});
