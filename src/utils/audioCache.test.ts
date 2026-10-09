import test from 'node:test';
import assert from 'node:assert/strict';
import { indexedDB } from 'fake-indexeddb';
import { readSavedAudio, saveAudio, deleteSavedAudio, AUDIO_CACHE_LIMIT, AUDIO_CACHE_ENTRIES } from '../services/audioCache';
import { CHARACTER_VOICE_REVISION } from '../data/characterVoices';

test('persistent clips survive memory-cache clearing, work without provider quota, and remain bounded', async () => {
  const saved = new Map(['indexedDB', 'fetch', 'document', 'localStorage'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: indexedDB });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { hidden: false } });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null } });
  let network = 0, starts = 0;
  Object.defineProperty(globalThis, 'fetch', { configurable: true, value: async () => { network++; return Response.json({ available: false }); } });
  try {
    const key = `${CHARACTER_VOICE_REVISION}:ko:jelly:정말 잘했어!`;
    const bytes = new Uint8Array([1, 2, 3, 4]).buffer;
    await saveAudio({ key, bytes, playbackRate: 1.1, savedAt: 1 });
    const clip = await readSavedAudio(key);
    assert.deepEqual(clip?.bytes, bytes);
    const ai = await import('../services/geminiTTS');
    const ctx = { state: 'running', destination: {}, decodeAudioData: async () => ({}), createBufferSource: () => ({
      playbackRate: { value: 1 }, connect() {}, disconnect() {}, stop() {}, start() { starts++; },
    }) } as unknown as AudioContext;
    assert.equal(await ai.playGeminiSpeech('정말 잘했어!', { audioCtx: ctx, characterId: 'jelly' }), true);
    ai.stopGeminiAudio(); ai.clearGeminiAudioCache();
    assert.equal(await ai.playGeminiSpeech('정말 잘했어!', { audioCtx: ctx, characterId: 'jelly' }), true);
    assert.equal(starts, 2); assert.equal(network, 0, 'a saved clip needs no status or generation request');
    ai.stopGeminiAudio();
    await deleteSavedAudio(key);
    assert.equal(await readSavedAudio(key), null);

    for (let i = 0; i <= AUDIO_CACHE_ENTRIES; i++) await saveAudio({ key: `small-${i}`, bytes, playbackRate: 1, savedAt: i });
    assert.equal(await readSavedAudio('small-0'), null, 'oldest entry is evicted at the count ceiling');
    assert.ok(await readSavedAudio(`small-${AUDIO_CACHE_ENTRIES}`));
    for (let i = 0; i < 7; i++) await saveAudio({ key: `large-${i}`, bytes: new ArrayBuffer(AUDIO_CACHE_LIMIT / 6), playbackRate: 1, savedAt: 1000 + i });
    assert.equal(await readSavedAudio('large-0'), null, 'byte ceiling also evicts old entries');
    assert.ok(await readSavedAudio('large-6'));
    await saveAudio({ key: 'too-large', bytes: new ArrayBuffer(3 * 1024 * 1024), playbackRate: 1, savedAt: 9999 });
    assert.equal(await readSavedAudio('too-large'), null);
  } finally {
    for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
  }
});
