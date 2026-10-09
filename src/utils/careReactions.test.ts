import assert from 'node:assert/strict';
import test from 'node:test';
import { stat } from 'node:fs/promises';
import { CARE_REACTIONS } from '../data/careReactions';
import { CARE_VOICE_DURATIONS } from '../data/generatedCareVoiceDurations';
import { CHARACTER_VOICES } from '../data/characterVoices';
import { speechSynthesisKey } from '../data/speechSynthesis';
import { bundledSpeechId } from '../services/bundledSpeech';
import { localizeSpeech } from './speechLanguage';

test('every care action has a shipped, measured voice for all eight friends in both languages', async () => {
  const files = new Set<string>();
  for (const character of Object.keys(CHARACTER_VOICES)) for (const reaction of Object.values(CARE_REACTIONS)) for (const language of ['ko', 'en'] as const) {
    const text = reaction[language], id = bundledSpeechId(text, character, language);
    assert.ok(id, `${character}/${language}/${text} must never require runtime generation`);
    assert.equal(localizeSpeech(reaction.ko, language), text);
    const seconds = CARE_VOICE_DURATIONS[speechSynthesisKey(text, character, language)];
    assert.ok(seconds > .1 && seconds <= 3.2, 'animation timing must use a validated short clip');
    files.add(id);
  }
  assert.equal(files.size, 32, 'equal base voices share originals while playback preserves each friend’s pitch');
  for (const id of files) assert.ok((await stat(`public/audio/elevenlabs/speech/${id}.mp3`)).size > 100);
});

test('rapid brushing keeps its first voice, language and mute work, and warming never generates or plays audio', async () => {
  const descriptors = new Map(['window', 'document', 'localStorage', 'SpeechSynthesisUtterance', 'fetch'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const storage = new Map<string, string>([['ITSME_GEMINI_TTS_ENABLED', 'false']]);
  const spoken: Array<{ text: string; onend?: () => void }> = [];
  let cancels = 0, audioStarts = 0;
  const downloads: string[] = [];
  const sources: Array<{ onended?: () => void }> = [];
  class Context {
    state = 'running'; currentTime = 0;
    async suspend() { this.state = 'suspended'; }
    async resume() { this.state = 'running'; }
    async decodeAudioData() { return { duration: 1 }; }
    createBufferSource() {
      const source = { buffer: null, playbackRate: { value: 1 }, onended: undefined as (() => void) | undefined,
        connect() {}, disconnect() {}, stop() {}, start() { audioStarts++; } };
      sources.push(source); return source;
    }
  }
  class Utterance { constructor(public text: string) {} onstart?: () => void; onend?: () => void; }
  Object.defineProperties(globalThis, {
    document: { configurable: true, value: { hidden: false } },
    window: { configurable: true, value: { AudioContext: Context, SpeechSynthesisUtterance: Utterance, setTimeout, clearTimeout, speechSynthesis: {
      getVoices: () => [{ name: 'Yuna', lang: 'ko-KR' }, { name: 'Microsoft Ana', lang: 'en-US' }],
      cancel() { cancels++; }, speak(u: Utterance) { spoken.push(u); u.onstart?.(); },
    } } },
    SpeechSynthesisUtterance: { configurable: true, value: Utterance },
    localStorage: { configurable: true, value: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) } },
    fetch: { configurable: true, value: async (url: string, init?: RequestInit) => {
      assert.equal(init?.method, undefined, 'preload cannot submit billable speech');
      assert.match(url, /^\/audio\/elevenlabs\/speech\/[^/]+\.mp3$/);
      downloads.push(url); return new Response(new Uint8Array(160));
    } },
  });
  const engine = await import('./soundEngine');
  const ai = await import('../services/geminiTTS');
  try {
    engine.setAudioPreferences(true, true); engine.setSpeechLanguage('ko');
    engine.playCareReaction('brush', true, 'jelly');
    const first = spoken.at(-1), before = cancels;
    for (let i = 0; i < 40; i++) engine.playCareReaction('brush', true, 'jelly');
    assert.equal(spoken.length, 1); assert.equal(cancels, before);
    assert.equal(first?.text, '치카치카!');
    first?.onend?.(); engine.playCareReaction('brush', true, 'jelly');
    assert.equal(spoken.length, 2, 'a completed voice may play again on later strokes');
    engine.setSpeechLanguage('en'); engine.playCareReaction('drink', true, 'pingu');
    assert.equal(spoken.at(-1)?.text, 'Gulp gulp!');
    const count = spoken.length;
    engine.setAudioPreferences(true, false); engine.playCareReaction('chew', true, 'pingu');
    engine.setAudioPreferences(false); engine.playCareReaction('drink', true, 'pingu');
    assert.equal(spoken.length, count);
    engine.setAudioPreferences(true, true); ai.setGeminiTTSEnabled(true);
    const stopsBeforeWarm = cancels;
    await Promise.all([1, 2, 3].map(() => ai.preloadBundledSpeech('치카치카!', 'jelly', 'ko', new Context() as unknown as AudioContext)));
    assert.equal(downloads.length, 1, 'concurrent warms share one local download');
    assert.equal(audioStarts, 0); assert.equal(cancels, stopsBeforeWarm);
    engine.setSpeechLanguage('ko');
    engine.playCareReaction('brush', true, 'jelly');
    await new Promise<void>(resolve => setImmediate(resolve));
    assert.equal(audioStarts, 1, 'the preloaded local voice starts without a new download');
    assert.equal(downloads.length, 1);
    for (let i = 0; i < 20; i++) engine.playCareReaction('brush', true, 'jelly');
    assert.equal(audioStarts, 1, 'AI brushing also keeps the first voice through repeated strokes');
    sources.at(-1)?.onended?.();
    assert.equal(engine.isSpeechBusy(), false);
  } finally {
    engine.stopAllSpeech(); engine.stopPlaySounds();
    for (const [key, descriptor] of descriptors) if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key);
  }
});
