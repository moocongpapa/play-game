import assert from 'node:assert/strict';
import test from 'node:test';
import { setImmediate } from 'node:timers/promises';

test('audio playback uses the saved language, cancels stale speech, separates caches and respects mute', async () => {
  const original = new Map(['window', 'localStorage', 'SpeechSynthesisUtterance', 'fetch'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const storage = new Map<string, string>();
  let voices = [{ name: 'Korean natural', lang: 'ko-KR' }, { name: 'English natural', lang: 'en-US' }];
  class Utterance {
    lang = ''; voice: unknown = null;
    onstart?: () => void; onend?: () => void;
    constructor(public text: string) {}
  }
  const spoken: Utterance[] = [];
  let cancelled = 0;
  let starts = 0;
  let stops = 0;
  let provider = 'gemini';
  const playbackRates: number[] = [];
  class Context {
    state = 'running'; destination = {};
    async resume() { this.state = 'running'; }
    async suspend() { this.state = 'suspended'; }
    async decodeAudioData() { return {}; }
    createBufferSource() {
      return { buffer: null, playbackRate: { value: 1 }, onended: null, connect() {}, disconnect() {}, start() { starts++; playbackRates.push(this.playbackRate.value); }, stop() { stops++; } };
    }
  }
  const requests: Array<{ text: string; characterId: string; language: string; signal: AbortSignal }> = [];
  let holdRequest = false;
  let release: ((response: Response) => void) | undefined;
  Object.defineProperties(globalThis, {
    window: { configurable: true, value: { AudioContext: Context, SpeechSynthesisUtterance: Utterance, setTimeout, clearTimeout, speechSynthesis: {
      getVoices: () => voices, cancel: () => { cancelled++; }, speak: (utterance: Utterance) => { spoken.push(utterance); utterance.onstart?.(); },
    } } },
    SpeechSynthesisUtterance: { configurable: true, value: Utterance },
    localStorage: { configurable: true, value: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) } },
    fetch: { configurable: true, value: async (_url: string, init?: RequestInit) => {
      if (!init?.method) return Response.json({ available: true });
      requests.push({ ...JSON.parse(String(init.body)), signal: init.signal });
      return holdRequest ? new Promise<Response>(resolve => { release = resolve; }) : new Response(new Uint8Array(44), { headers: { 'X-Speech-Provider': provider } });
    } },
  });
  const engine = await import('./soundEngine');
  const ai = await import('../services/geminiTTS');
  const flush = async () => { await setImmediate(); await setImmediate(); };
  try {
    engine.speakText('유하야, 안녕! 나는 젤리야. 우리 같이 신나게 놀자!', true, { characterId: 'jelly' });
    await flush();
    assert.equal(requests[0].text, 'Hello, Yuha! I am Jelly. Let us have fun together!');
    assert.equal(requests[0].language, 'en');
    assert.equal(requests[0].characterId, 'jelly');
    assert.equal(starts, 1);
    assert.equal(playbackRates[0], 1);

    engine.setSpeechLanguage('ko');
    assert.equal(stops, 1, 'Language change stops the previous AI clip');
    engine.speakText('사과', true, { characterId: 'pingu' });
    await flush();
    assert.equal(requests[1].text, '사과');
    assert.equal(requests[1].language, 'ko');

    // Same text in different languages still requires a separate audio buffer.
    engine.setSpeechLanguage('en'); engine.speakText('Hello'); await flush();
    const requestCount = requests.length;
    engine.speakText('Hello'); await flush();
    assert.equal(requests.length, requestCount);
    engine.setSpeechLanguage('ko'); engine.speakText('Hello'); await flush();
    assert.equal(requests.length, requestCount + 1);

    holdRequest = true;
    engine.speakText('아직 준비 중인 음성'); await flush();
    const beforeChange = starts;
    engine.setSpeechLanguage('en');
    assert.equal(requests.at(-1)?.signal.aborted, true);
    release!(new Response(new Uint8Array(44))); await flush();
    assert.equal(starts, beforeChange, 'Late response cannot play after a language change');
    assert.equal(spoken.length, 0, 'Cancelled AI speech cannot trigger a browser fallback');
    holdRequest = false;

    provider = 'elevenlabs';
    engine.speakText('바나나', true, { characterId: 'jelly' }); await flush();
    const liftedRate = playbackRates.at(-1)!;
    assert.ok(liftedRate >= 1.08 && liftedRate <= 1.16);
    const beforeReplay = requests.length;
    engine.speakText('바나나', true, { characterId: 'jelly' }); await flush();
    assert.equal(requests.length, beforeReplay);
    assert.equal(playbackRates.at(-1), liftedRate, 'Cached fallback preserves its gentle pitch lift');

    ai.setGeminiTTSEnabled(false);
    engine.speakText('사과');
    assert.equal(spoken.at(-1)?.text, 'apple');
    assert.equal(spoken.at(-1)?.lang, 'en-US');
    assert.equal(spoken.at(-1)?.voice, voices[1]);
    const beforeCancel = cancelled;
    engine.setSpeechLanguage('ko');
    assert.ok(cancelled > beforeCancel);
    engine.speakText('사과');
    assert.equal(spoken.at(-1)?.text, '사과');
    assert.equal(spoken.at(-1)?.lang, 'ko-KR');
    engine.setAudioPreferences(false);
    engine.speakText('바나나');
    assert.equal(spoken.length, 2);
    engine.setAudioPreferences(true, false);
    engine.speakText('바나나');
    assert.equal(spoken.length, 2);

    engine.setAudioPreferences(true, true);
    voices = [];
    engine.setSpeechLanguage('en');
    engine.speakText('사과');
    assert.equal(spoken.length, 2, 'No arbitrary OS voice while the voice list is loading');
    voices = [{ name: 'Microsoft Ana Online (Natural)', lang: 'en-US' }];
    window.speechSynthesis.onvoiceschanged!(new Event('voiceschanged'));
    assert.equal(spoken.length, 3);
    assert.equal(spoken.at(-1)?.voice, voices[0]);
    voices = [{ name: 'Microsoft Guy Online (Natural)', lang: 'en-US' }];
    window.speechSynthesis.onvoiceschanged!(new Event('voiceschanged'));
    let unavailable = false;
    engine.speakText('사과', true, { onError: () => { unavailable = true; } });
    assert.equal(spoken.length, 3, 'A known adult male is not used as the only available fallback');
    assert.equal(unavailable, true);
  } finally {
    engine.stopAllSpeech(); ai.clearGeminiAudioCache();
    for (const [key, descriptor] of original) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
