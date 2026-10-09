import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setImmediate } from 'node:timers/promises';
import { indexedDB } from 'fake-indexeddb';
import { speechAssetId, speechSynthesisKey } from '../data/speechSynthesis';
import { GENERATED_SPEECH_COUNT, GENERATED_SPEECH_FILES, GENERATED_SPEECH_REQUESTS } from '../data/generatedSpeechManifest';
import { bundledSpeechId, bundledSpeechUrl } from '../services/bundledSpeech';
import { readSavedAudio, deleteSavedAudio, saveAudio } from '../services/audioCache';
import { startGeneratedMusic, stopGeneratedMusic } from '../services/generatedMusic';
import { GENERATED_MUSIC } from '../data/generatedMusic';
import { getCharacterVoice } from '../data/characterVoices';
import type { SpeechAssetJob } from '../../scripts/speech-library';

const catalog = JSON.parse(await readFile('public/audio/elevenlabs/speech/catalog.json', 'utf8')) as {
  clips: Array<SpeechAssetJob & { bytes: number; sha256: string }>;
};

test('every published speech request resolves to an intact, correctly identified MP3', async () => {
  assert.equal(catalog.clips.length, GENERATED_SPEECH_COUNT);
  assert.equal(GENERATED_SPEECH_FILES.size, GENERATED_SPEECH_COUNT);
  assert.ok(GENERATED_SPEECH_COUNT > 0);
  for (const clip of catalog.clips) {
    const bytes = await readFile(`public${bundledSpeechUrl(clip.id)}`);
    assert.equal(bytes.length, clip.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), clip.sha256);
    assert.ok(bytes.subarray(0, 3).toString() === 'ID3' || (bytes[0] === 255 && (bytes[1] & 224) === 224));
    for (const character of clip.characters) {
      assert.equal(await speechAssetId(clip.text, character, clip.language), clip.id);
      assert.equal(GENERATED_SPEECH_REQUESTS[speechSynthesisKey(clip.text, character, clip.language)], clip.id);
    }
  }
});

test('equal synthesis shares a file, while changed voices, text and languages have distinct identities', async () => {
  const ggomi = await speechAssetId('  같이\n놀자!  ', 'ggomi', 'ko');
  assert.equal(await speechAssetId('같이 놀자!', 'pingu', 'ko'), ggomi);
  assert.notEqual(await speechAssetId('같이 놀자!', 'jelly', 'ko'), ggomi);
  assert.notEqual(await speechAssetId('같이 놀자!', 'ggomi', 'en'), ggomi);
  assert.notEqual(await speechAssetId('다시 놀자!', 'ggomi', 'ko'), ggomi);
});

test('bundled speech works without Web Crypto or quota, persists across reload, and never pays on a file failure', async () => {
  const originals = new Map(['indexedDB', 'fetch', 'document', 'localStorage', 'crypto'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const page = { hidden: false };
  let enabled = true, fail = false, hold = false;
  let release: (value: Response) => void;
  let requestedSignal: AbortSignal | undefined;
  const requests: string[] = [], rates: number[] = [];
  Object.defineProperties(globalThis, {
    indexedDB: { configurable: true, value: indexedDB },
    crypto: { configurable: true, value: undefined },
    document: { configurable: true, value: page },
    localStorage: { configurable: true, value: { getItem: () => enabled ? null : 'false' } },
    fetch: { configurable: true, value: async (url: string, init?: RequestInit) => {
      requests.push(url); requestedSignal = init?.signal as AbortSignal;
      assert.match(url, /^\/audio\/elevenlabs\/speech\/[a-f0-9]+\.mp3$/);
      assert.ok(!init?.method || init.method === 'GET', 'only static file requests are allowed');
      if (hold) return new Promise<Response>(resolve => { release = resolve; });
      return fail ? new Response(null, { status: 404 }) : new Response(new Uint8Array(150));
    } },
  });
  const ctx = { state: 'running', destination: {}, decodeAudioData: async () => ({}), createBufferSource: () => {
    const source = { playbackRate: { value: 1 }, connect() {}, disconnect() {}, stop() {}, start() { rates.push(source.playbackRate.value); } };
    return source;
  } } as unknown as AudioContext;
  const ai = await import('../services/geminiTTS');
  const clip = catalog.clips.find(item => item.language === 'ko' && item.characters.includes('ggomi') && item.characters.includes('pingu'))!;
  const key = `eleven:${clip.id}`;
  try {
    assert.equal(bundledSpeechId(clip.text, 'ggomi', 'ko'), clip.id);
    assert.equal(await ai.playGeminiSpeech(clip.text, { characterId: 'ggomi', audioCtx: ctx }), true);
    assert.equal(requests.length, 1);
    assert.equal(rates[0], getCharacterVoice('ggomi').fallbackPlaybackRate);
    for (let n = 0; n < 100 && !await readSavedAudio(key); n++) await setImmediate();
    assert.ok(await readSavedAudio(key), 'compressed file is persisted');
    ai.stopGeminiAudio(); ai.clearGeminiAudioCache();
    assert.equal(await ai.playGeminiSpeech(clip.text, { characterId: 'pingu', audioCtx: ctx }), true);
    assert.equal(requests.length, 1, 'another character with the same synthesis reuses the persisted file');
    assert.equal(rates[1], getCharacterVoice('pingu').fallbackPlaybackRate, 'reused recording keeps this character’s pitch');

    ai.stopGeminiAudio(); ai.clearGeminiAudioCache(); await deleteSavedAudio(key);
    fail = true;
    assert.equal(await ai.playGeminiSpeech(clip.text, { characterId: 'ggomi', audioCtx: ctx }), false);
    assert.equal(requests.length, 2, 'missing file uses local fallback, without even a quota GET');
    assert.equal(rates.length, 2);
    fail = false; hold = true;
    const loading = ai.playGeminiSpeech(clip.text, { characterId: 'ggomi', audioCtx: ctx });
    for (let n = 0; n < 100 && requests.length < 3; n++) await setImmediate();
    assert.equal(requests.length, 3);
    ai.stopGeminiAudio();
    assert.equal(requestedSignal?.aborted, true);
    release!(new Response(new Uint8Array(150)));
    assert.equal(await loading, false);
    assert.equal(rates.length, 2, 'a late static response cannot play on the next screen');

    enabled = false;
    assert.equal(await ai.playGeminiSpeech(clip.text, { characterId: 'ggomi', audioCtx: ctx }), false);
    enabled = true; page.hidden = true;
    assert.equal(await ai.playGeminiSpeech(clip.text, { characterId: 'ggomi', audioCtx: ctx }), false);
    assert.equal(requests.length, 3, 'mute/hidden checks happen before file loading');
  } finally {
    ai.stopGeminiAudio(); ai.clearGeminiAudioCache();
    for (const [key, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
  }
});

test('persisted background recordings start without any network access', async () => {
  const originals = new Map(['indexedDB', 'fetch', 'document'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  let requests = 0, started = 0, ready = 0, failed = 0;
  Object.defineProperties(globalThis, {
    indexedDB: { configurable: true, value: indexedDB },
    document: { configurable: true, value: { hidden: false } },
    fetch: { configurable: true, value: async () => { requests++; throw new Error('Offline'); } },
  });
  const ctx = { state: 'running', currentTime: 0, destination: {}, decodeAudioData: async () => ({ duration: 30 }),
    createGain: () => ({ gain: { setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, disconnect() {} }),
    createBufferSource: () => ({ connect() {}, disconnect() {}, stop() {}, start() { started++; } }),
  } as unknown as AudioContext;
  try {
    for (const track of GENERATED_MUSIC) await saveAudio({ key: `music:v1:${track.id}`, bytes: new ArrayBuffer(150), playbackRate: 1, savedAt: Date.now() });
    startGeneratedMusic(ctx, ctx.destination, 'play', () => ready++, () => failed++);
    for (let n = 0; n < 100 && !started; n++) await setImmediate();
    assert.equal(started, 1); assert.equal(ready, 1); assert.equal(failed, 0);
    assert.equal(requests, 0, 'playback and next-track preloading both use persisted recordings');
  } finally {
    stopGeneratedMusic();
    for (const [key, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); }
  }
});
