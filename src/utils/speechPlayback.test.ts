import assert from 'node:assert/strict';
import test from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { createHash } from 'node:crypto';

test('speech playback respects preferences, navigation and uninterrupted repeated taps', async t => {
  const original = new Map(['window', 'document', 'localStorage', 'SpeechSynthesisUtterance', 'fetch', 'Audio', 'crypto'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const storage = new Map<string, string>();
  const page = { hidden: false };
  let voices = [{ name: 'Korean natural', lang: 'ko-KR' }, { name: 'English natural', lang: 'en-US' }];
  class Utterance {
    lang = ''; voice: unknown = null;
    onstart?: () => void; onend?: () => void;
    onerror?: (event: { error: string }) => void;
    constructor(public text: string) {}
  }
  const spoken: Utterance[] = [];
  let cancelled = 0;
  let starts = 0;
  let stops = 0;
  let provider = 'gemini';
  const playbackRates: number[] = [];
  class Source {
    buffer: unknown = null;
    playbackRate = { value: 1 };
    onended: (() => void) | null = null;
    connect() {} disconnect() {}
    start() { starts++; playbackRates.push(this.playbackRate.value); }
    stop() { stops++; }
  }
  const sources: Source[] = [];
  class Context {
    state = 'running'; destination = {};
    async resume() { this.state = 'running'; }
    async suspend() { this.state = 'suspended'; }
    async decodeAudioData() { return {}; }
    createBufferSource() {
      const source = new Source();
      sources.push(source);
      return source;
    }
  }
  const requests: Array<{ text: string; characterId: string; language: string; signal: AbortSignal }> = [];
  let holdRequest = false;
  let failRequest = false;
  let failureStatus = 502;
  let release: ((response: Response) => void) | undefined;
  Object.defineProperties(globalThis, {
    // This suite controls playback microtasks; avoid depending on the OS crypto
    // worker pool's timing. Real Web Crypto identities are tested in bundledSpeech.
    crypto: { configurable: true, value: { subtle: { digest: async (_algorithm: string, data: Uint8Array) =>
      new Uint8Array(createHash('sha256').update(data).digest()).buffer } } },
    document: { configurable: true, value: page },
    window: { configurable: true, value: { AudioContext: Context, SpeechSynthesisUtterance: Utterance, setTimeout, clearTimeout, speechSynthesis: {
      getVoices: () => voices, cancel: () => { cancelled++; }, speak: (utterance: Utterance) => { spoken.push(utterance); utterance.onstart?.(); },
    } } },
    SpeechSynthesisUtterance: { configurable: true, value: Utterance },
    localStorage: { configurable: true, value: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) } },
    fetch: { configurable: true, value: async (_url: string, init?: RequestInit) => {
      if (!init?.method) return Response.json({ available: true });
      requests.push({ ...JSON.parse(String(init.body)), signal: init.signal });
      return holdRequest ? new Promise<Response>(resolve => { release = resolve; }) : failRequest ? new Response(null, { status: failureStatus, headers: { 'Retry-After': '60' } }) : new Response(new Uint8Array(44), { headers: { 'X-Speech-Provider': provider } });
    } },
  });
  const engine = await import('./soundEngine');
  const ai = await import('../services/geminiTTS');
  const flush = async () => { await setImmediate(); await setImmediate(); };
  try {
    engine.speakText('유하야, 젤리의 새로운 이야기를 들어볼까?', true, { characterId: 'jelly' });
    await flush();
    assert.equal(requests[0].text, '유하야, 젤리의 새로운 이야기를 들어볼까?');
    assert.equal(requests[0].language, 'ko');
    assert.equal(requests[0].characterId, 'jelly');
    assert.equal(starts, 1);
    assert.equal(playbackRates[0], 1);

    engine.setSpeechLanguage('en');
    assert.equal(stops, 1, 'Language change stops the previous AI clip');
    engine.speakText('사과', true, { characterId: 'pingu' });
    await flush();
    assert.equal(requests[1].text, 'apple');
    assert.equal(requests[1].language, 'en');

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
    sources.at(-1)?.onended?.();
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
    spoken.at(-1)?.onend?.();
    voices = [{ name: 'Microsoft Guy Online (Natural)', lang: 'en-US' }];
    window.speechSynthesis.onvoiceschanged!(new Event('voiceschanged'));
    let unavailable = false;
    engine.speakText('사과', true, { onError: () => { unavailable = true; } });
    assert.equal(spoken.length, 3, 'A known adult male is not used as the only available fallback');
    assert.equal(unavailable, true);

    voices = [{ name: 'Microsoft Ana Online (Natural)', lang: 'en-US' }];
    window.speechSynthesis.onvoiceschanged!(new Event('voiceschanged'));

    await t.test('hidden pages reject delayed speech and late downloads, then resume on a new visible request', async () => {
      engine.stopAllSpeech();
      const before = { spoken: spoken.length, requests: requests.length, starts };
      page.hidden = true;
      let cancelledGuide = 0;
      engine.speakText('Hidden hint', true, { onCancel: () => { cancelledGuide++; } });
      await flush();
      assert.deepEqual({ spoken: spoken.length, requests: requests.length, starts }, before);
      assert.equal(cancelledGuide, 1);
      page.hidden = false;
      ai.setGeminiTTSEnabled(true); holdRequest = true;
      engine.speakText('Late hidden download'); await flush();
      page.hidden = true;
      release!(new Response(new Uint8Array(44))); await flush();
      assert.equal(starts, before.starts);
      assert.equal(spoken.length, before.spoken);
      page.hidden = false; holdRequest = false;
      engine.speakText('Visible again'); await flush();
      assert.equal(starts, before.starts + 1);
      engine.stopAllSpeech();
    });

    await t.test('AI loading and playback survive repeated taps; completion allows cached replay', async () => {
      ai.setGeminiTTSEnabled(true);
      holdRequest = true;
      let ended = 0;
      engine.speakText('Keep playing, friend!', true, { characterId: 'jelly', onEnd: () => { ended++; } });
      await flush();
      const currentRequest = requests.at(-1)!;
      const before = { requests: requests.length, starts, stops, cancelled };
      for (let i = 0; i < 5; i++) engine.speakText('Keep playing, friend!', true, { characterId: 'jelly' });
      await flush();
      assert.deepEqual({ requests: requests.length, starts, stops, cancelled }, before);
      assert.equal(currentRequest.signal.aborted, false, 'Repeated taps do not abort the first download');
      holdRequest = false;
      release!(new Response(new Uint8Array(44))); await flush();
      assert.equal(starts, before.starts + 1);
      const firstClip = sources.at(-1)!;
      let previewProvider = '';
      for (let i = 0; i < 5; i++) engine.speakText('Keep playing, friend!', true, {
        characterId: 'jelly', onStart: value => { previewProvider = value; },
      });
      await flush();
      assert.equal(starts, before.starts + 1);
      assert.equal(stops, before.stops);
      assert.equal(previewProvider, 'ai', 'Preview status remains playing when tapped again');
      firstClip.onended?.(); await flush();
      assert.equal(ended, 1);
      assert.equal(starts, before.starts + 1, 'No duplicate clip is queued after completion');
      engine.speakText('Keep playing, friend!', true, { characterId: 'jelly' }); await flush();
      assert.equal(starts, before.starts + 2);
      assert.equal(requests.length, before.requests, 'A tap after completion replays the cached clip');
      engine.stopAllSpeech();
    });

    await t.test('navigation cancels playback and pending speech, and permits the same line on return', async () => {
      engine.speakText('Keep playing, friend!', true, { characterId: 'jelly' }); await flush();
      const beforeStop = stops;
      engine.stopAllSpeech();
      assert.equal(stops, beforeStop + 1);
      const beforeReturn = starts;
      engine.speakText('Keep playing, friend!', true, { characterId: 'jelly' }); await flush();
      assert.equal(starts, beforeReturn + 1);
      engine.stopAllSpeech();

      holdRequest = true;
      engine.speakText('A late voice from the previous screen.'); await flush();
      const lateRequest = requests.at(-1)!;
      const before = { starts, spoken: spoken.length };
      engine.stopAllSpeech();
      assert.equal(lateRequest.signal.aborted, true);
      holdRequest = false;
      release!(new Response(new Uint8Array(44))); await flush();
      assert.deepEqual({ starts, spoken: spoken.length }, before, 'No stale playback or fallback on the next screen');
    });

    await t.test('browser speech is not cancelled or queued twice and can replay after end or error', () => {
      ai.setGeminiTTSEnabled(false);
      let ended = 0;
      engine.speakText('Listen to the whole sentence.', true, { onEnd: () => { ended++; } });
      const first = spoken.at(-1)!;
      const before = { spoken: spoken.length, cancelled };
      for (let i = 0; i < 5; i++) engine.speakText('  Listen to the whole sentence.  ');
      assert.deepEqual({ spoken: spoken.length, cancelled }, before);
      first.onend?.();
      assert.equal(ended, 1);
      assert.equal(spoken.length, before.spoken, 'Finishing does not queue the repeated taps');
      engine.speakText('Listen to the whole sentence.');
      assert.equal(spoken.length, before.spoken + 1);
      spoken.at(-1)?.onerror?.({ error: 'interrupted' });
      engine.speakText('Listen to the whole sentence.');
      assert.equal(spoken.length, before.spoken + 2, 'A browser interruption clears the active request');
      engine.setAudioPreferences(false);
      engine.speakText('Listen to the whole sentence.');
      assert.equal(spoken.length, before.spoken + 2);
      engine.setAudioPreferences(true);
      engine.speakText('Listen to the whole sentence.');
      assert.equal(spoken.length, before.spoken + 3, 'Unmuting permits the same sentence again');
      engine.stopAllSpeech();
    });

    await t.test('pending browser voices and AI-to-browser fallback keep the first request', async () => {
      voices = [];
      window.speechSynthesis.onvoiceschanged!(new Event('voiceschanged'));
      engine.speakText('Wait for the voice.');
      const before = { spoken: spoken.length, cancelled };
      engine.speakText('Wait for the voice.');
      assert.deepEqual({ spoken: spoken.length, cancelled }, before);
      voices = [{ name: 'Microsoft Ana Online (Natural)', lang: 'en-US' }];
      window.speechSynthesis.onvoiceschanged!(new Event('voiceschanged'));
      assert.equal(spoken.length, before.spoken + 1);
      engine.stopAllSpeech();

      ai.setGeminiTTSEnabled(true);
      failRequest = true;
      engine.speakText('Keep the fallback going.'); await flush();
      assert.equal(spoken.at(-1)?.text, 'Keep the fallback going.');
      const fallback = { requests: requests.length, spoken: spoken.length, cancelled };
      engine.speakText('Keep the fallback going.'); await flush();
      assert.deepEqual({ requests: requests.length, spoken: spoken.length, cancelled }, fallback);
      spoken.at(-1)?.onend?.();
      failRequest = false;
      engine.stopAllSpeech();
    });

    await t.test('a different character or sentence still replaces the old speech', () => {
      ai.setGeminiTTSEnabled(false);
      engine.speakText('Hello, friend!', true, { characterId: 'jelly' });
      const before = { spoken: spoken.length, cancelled };
      engine.speakText('Hello, friend!', true, { characterId: 'pingu' });
      assert.equal(spoken.length, before.spoken + 1);
      assert.equal(cancelled, before.cancelled + 1);
      engine.speakText('Let us play!', true, { characterId: 'pingu' });
      assert.equal(spoken.length, before.spoken + 2);
      assert.equal(cancelled, before.cancelled + 2);
    });

    await t.test('idle hints wait for AI loading, playback and browser speech, and respect mute', async () => {
      engine.stopAllSpeech(); ai.setGeminiTTSEnabled(true); holdRequest = true;
      engine.speakText('A long, gentle question', true, { characterId: 'pingu' }); await flush();
      const before = { requests: requests.length, stops, cancelled };
      assert.equal(engine.trySpeakIdleHint('A helpful hint', true, 'pingu'), false);
      assert.deepEqual({ requests: requests.length, stops, cancelled }, before);
      assert.equal(requests.at(-1)?.signal.aborted, false);
      holdRequest = false; release!(new Response(new Uint8Array(44))); await flush();
      assert.equal(engine.trySpeakIdleHint('A helpful hint', true, 'pingu'), false);
      sources.at(-1)?.onended?.();
      ai.setGeminiTTSEnabled(false);
      assert.equal(engine.trySpeakIdleHint('A helpful hint', true, 'pingu'), true);
      const count = spoken.length;
      assert.equal(engine.trySpeakIdleHint('Another hint', true, 'jelly'), false);
      assert.equal(spoken.length, count);
      spoken.at(-1)?.onend?.();
      engine.setAudioPreferences(true, false);
      assert.equal(engine.trySpeakIdleHint('Muted hint', true, 'pingu'), true);
      engine.setAudioPreferences(true, true);
      assert.equal(engine.trySpeakIdleHint('Muted hint', false, 'pingu'), true);
      assert.equal(spoken.length, count);
    });

    await t.test('idle hints leave recorded animal clues intact and become available after completion', async () => {
      let ended: (() => void) | null = null;
      let pauses = 0;
      Object.defineProperty(globalThis, 'Audio', { configurable: true, value: class {
        set onended(callback: (() => void) | null) { ended = callback; }
        async play() {} pause() { pauses++; } removeAttribute() {} load() {}
      } });
      const clue = engine.playAnimalSound('dog', true);
      const before = spoken.length;
      assert.equal(engine.trySpeakIdleHint('A gentle hint', true, 'jelly'), false);
      assert.equal(pauses, 0); assert.equal(spoken.length, before);
      (ended as (() => void) | null)?.();
      assert.equal(await clue, 'ended');
      assert.equal(engine.trySpeakIdleHint('A gentle hint', true, 'jelly'), true);
      assert.equal(spoken.length, before + 1);
      engine.stopAllSpeech();
    });
    await t.test('an audio device that never resumes cannot hold a guide or start a late paid request', async sub => {
      sub.mock.timers.enable({ apis: ['setTimeout'] });
      ai.setGeminiTTSEnabled(true);
      let resume: () => void;
      const context = new Context();
      context.state = 'suspended';
      context.resume = () => new Promise<void>(resolve => { resume = resolve; });
      const before = { requests: requests.length, starts };
      const pending = ai.playGeminiSpeech('Wait for the audio device.', { audioCtx: context as unknown as AudioContext });
      await flush();
      sub.mock.timers.tick(3000);
      assert.equal(await pending, false, 'Allows the caller to use device speech or visual guidance');
      resume!(); await flush();
      assert.deepEqual({ requests: requests.length, starts }, before);
    });

    await t.test('quota cooldown uses device voices without repeated paid requests and recovers later', async () => {
      const originalNow = Date.now;
      let now = originalNow();
      Date.now = () => now;
      try {
        ai.setGeminiTTSEnabled(true); failRequest = true; failureStatus = 429;
        engine.speakText('The server limit was reached.'); await flush();
        assert.equal(spoken.at(-1)?.text, 'The server limit was reached.');
        const limitedCount = requests.length;
        engine.speakText('Use a gentle device voice.'); await flush();
        assert.equal(requests.length, limitedCount);
        assert.equal(spoken.at(-1)?.text, 'Use a gentle device voice.');
        now += 61000; failRequest = false;
        const priorStarts = starts;
        engine.speakText('The server is ready again.'); await flush();
        assert.equal(requests.length, limitedCount + 1);
        assert.equal(starts, priorStarts + 1);
      } finally {
        Date.now = originalNow; failRequest = false; failureStatus = 502;
        engine.stopAllSpeech();
      }
    });
  } finally {
    engine.stopAllSpeech(); ai.clearGeminiAudioCache();
    for (const [key, descriptor] of original) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});
