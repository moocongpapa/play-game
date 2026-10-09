import assert from 'node:assert/strict';
import test from 'node:test';
import { CHARACTER_VOICES } from '../data/characterVoices';
import { handleSpeechRequest } from './speech';

test('speech endpoint keeps the key server-side and selects a youthful performance for each character', async () => {
  const originalFetch = globalThis.fetch;
  const wav = Buffer.alloc(44);
  wav.write('RIFF', 0);
  wav.write('WAVE', 8);
  const calls: Array<{ url: string; init: RequestInit }> = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init: init || {} });
    return Response.json({ steps: [{ type: 'model_output', content: [{ type: 'audio', data: wav.toString('base64') }] }] });
  };

  try {
    for (const id of Object.keys(CHARACTER_VOICES)) {
      const response = await handleSpeechRequest('POST', { text: '안녕, 유하야!', characterId: id, language: 'ko' }, 'server-secret');
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('Content-Type'), 'audio/wav');
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), wav);
    }
    assert.equal(calls.length, Object.keys(CHARACTER_VOICES).length);
    assert.equal(new Set(Object.values(CHARACTER_VOICES).map(character => character.style)).size, calls.length);
    for (const [index, character] of Object.values(CHARACTER_VOICES).entries()) {
      const call = calls[index];
      assert.equal(call.url, 'https://generativelanguage.googleapis.com/v1beta/interactions');
      assert.equal((call.init.headers as Record<string, string>)['x-goog-api-key'], 'server-secret');
      const request = JSON.parse(String(call.init.body));
      assert.equal(request.model, 'gemini-3.8-flash-tts');
      assert.equal(request.generation_config.speech_config[0].voice, character.voice);
      assert.ok(['Leda', 'Autonoe', 'Aoede', 'Zephyr'].includes(character.voice));
      assert.match(character.style, /young child character/);
      assert.equal(request.input[0].content[0].text, '안녕, 유하야!');
      assert.equal(request.input[0].content[0].annotations[0].style, character.style);
      assert.equal(request.response_format.type, 'audio');
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('speech endpoint reports missing configuration without calling Gemini or ElevenLabs', async () => {
  const status = await handleSpeechRequest('GET', undefined, undefined);
  assert.deepEqual(await status.json(), { available: false, engine: 'none' });
  const response = await handleSpeechRequest('POST', { text: '안녕' }, undefined);
  assert.equal(response.status, 503);
});

test('speech endpoint uses a gentle ElevenLabs fallback with character pacing', async () => {
  const originalFetch = globalThis.fetch;
  const mp3Data = Buffer.alloc(150);
  mp3Data.fill(0x55);
  let calledUrl = '';
  let calledHeaders: Record<string, string> = {};
  let calledText = '';
  let settings: { speed: number; use_speaker_boost: boolean };

  globalThis.fetch = async (url, init) => {
    calledUrl = String(url);
    calledHeaders = (init?.headers || {}) as Record<string, string>;
    calledText = JSON.parse(String(init?.body)).text;
    settings = JSON.parse(String(init?.body)).voice_settings;
    return new Response(mp3Data, {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  };

  try {
    const response = await handleSpeechRequest(
      'POST',
      { text: 'Hello, I am Pingu!', characterId: 'pingu', language: 'en' },
      { elevenLabsApiKey: 'test-eleven-key' }
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), 'audio/mpeg');
    assert.equal(calledUrl, `https://api.elevenlabs.io/v1/text-to-speech/${CHARACTER_VOICES.pingu.elevenVoiceId}`);
    assert.equal(calledHeaders['xi-api-key'], 'test-eleven-key');
    assert.equal(calledText, 'Hello, I am Pingu!');
    assert.equal(settings!.speed, CHARACTER_VOICES.pingu.rate);
    assert.equal(settings!.use_speaker_boost, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('speech defaults to Korean and prioritizes childlike Gemini delivery', async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; body: { input?: Array<{ content: Array<{ annotations: Array<{ style: string }> }> }> } }> = [];
  const wav = Buffer.alloc(44);
  wav.write('RIFF', 0); wav.write('WAVE', 8);
  globalThis.fetch = async (url, init) => {
    requests.push({ url: String(url), body: JSON.parse(String(init?.body)) });
    if (String(url).includes('elevenlabs')) return new Response(new Uint8Array());
    return Response.json({ steps: [{ type: 'model_output', content: [{ type: 'audio', data: wav.toString('base64') }] }] });
  };
  try {
    const response = await handleSpeechRequest('POST', { text: '안녕, 유하야!', characterId: 'jelly' }, { elevenLabsApiKey: 'test', geminiApiKey: 'test' });
    assert.equal(response.status, 200);
    assert.equal(requests.length, 1);
    assert.ok(requests[0].url.includes('generativelanguage.googleapis.com'));
    assert.equal(requests[0].body.input?.[0].content[0].annotations[0].style, CHARACTER_VOICES.jelly.style);
    for (const language of ['fr', null, {}, 1]) {
      assert.equal((await handleSpeechRequest('POST', { text: 'Hello', language }, 'test')).status, 400);
    }
    assert.equal(requests.length, 1, 'Invalid language must not reach a voice provider');
  } finally { globalThis.fetch = originalFetch; }
});

test('provider failures fall back only to the approved light voices for every character', async () => {
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  console.warn = () => {};
  const urls: string[] = [];
  globalThis.fetch = async (url) => {
    urls.push(String(url));
    if (String(url).includes('googleapis')) return Response.json({}, { status: 503 });
    return new Response(new Uint8Array(150));
  };
  try {
    for (const id of [...Object.keys(CHARACTER_VOICES), 'unknown-character']) {
      const response = await handleSpeechRequest('POST', { text: 'Hello, friend!', characterId: id }, { geminiApiKey: 'test', elevenLabsApiKey: 'test' });
      assert.equal(response.status, 200);
      assert.match(urls.at(-1)!, /\/(cgSgspJ2msm6clMCkdW9|FGY2WhTYpPnrIDTdsKH5)$/);
    }
    assert.equal(urls.length, 18);
    globalThis.fetch = async () => new Response(null, { status: 503 });
    assert.equal((await handleSpeechRequest('POST', { text: 'Hello' }, { geminiApiKey: 'test', elevenLabsApiKey: 'test' })).status, 502);
  } finally { globalThis.fetch = originalFetch; console.warn = originalWarn; }
});
