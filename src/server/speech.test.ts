import { freePlan } from './audioTestFixtures';
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



test('ElevenLabs SDK is first for all eight characters and both languages; gentle pacing stays intact', async () => {
  const original = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async (url, init) => {
    calls.push(String(url));
    assert.equal(new Headers(init?.headers).get('xi-api-key'), 'eleven-secret');
    if (String(url).includes('/user/subscription')) return Response.json(freePlan);
    const body = JSON.parse(String(init?.body));
    assert.equal(body.model_id, 'eleven_multilingual_v2');
    assert.equal(body.voice_settings.use_speaker_boost, false);
    assert.match(String(url), /\/(cgSgspJ2msm6clMCkdW9|FGY2WhTYpPnrIDTdsKH5)\?/);
    assert.ok(body.voice_settings.speed >= .7 && body.voice_settings.speed <= 1);
    return new Response(new Uint8Array(150));
  };
  try {
    for (const id of Object.keys(CHARACTER_VOICES)) for (const language of ['en', 'ko']) {
      const response = await handleSpeechRequest('POST', { text: language === 'en' ? 'Well done!' : '정말 잘했어!', characterId: id, language }, { elevenLabsApiKey: 'eleven-secret', geminiApiKey: 'never-use' });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('X-Speech-Provider'), 'elevenlabs');
    }
    assert.equal(calls.length, 32, 'each generation verifies the live free plan');
    for (const language of ['fr', null, {}, 1]) assert.equal((await handleSpeechRequest('POST', { text: 'Hello', language }, 'test')).status, 400);
    assert.equal(calls.length, 32);
  } finally { globalThis.fetch = original; }
});

test('exhaustion, unsupported plans, overages and unverifiable budgets never spend credits or fall back to Gemini', async () => {
  const original = globalThis.fetch;
  let plan: Record<string, unknown> = freePlan;
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls++;
    assert.ok(String(url).endsWith('/user/subscription'), 'no generation is allowed');
    return Response.json(plan);
  };
  try {
    for (const blocked of [
      { ...freePlan, character_count: 10000 },
      { ...freePlan, character_count: 9999 },
      { ...freePlan, tier: 'enterprise' },
      { ...freePlan, can_extend_character_limit: true },
      { ...freePlan, allowed_to_extend_character_limit: true },
      { ...freePlan, max_credit_limit_extension: 1000 },
      {},
    ]) {
      plan = blocked;
      const response = await handleSpeechRequest('POST', { text: '잘했어!' }, { elevenLabsApiKey: 'test', geminiApiKey: 'never-use' });
      assert.ok([429, 503].includes(response.status));
    }
    assert.equal(calls, 7);
  } finally { globalThis.fetch = original; }
});

test('a renewed billing allowance resumes generation automatically; status reports provider reset', async () => {
  const original = globalThis.fetch;
  let count = 10000, generated = 0;
  globalThis.fetch = async (url) => {
    if (String(url).includes('/user/subscription')) return Response.json({ ...freePlan, character_count: count });
    generated++;
    return new Response(new Uint8Array(150));
  };
  try {
    const keys = { elevenLabsApiKey: 'test' };
    const status = await (await handleSpeechRequest('GET', undefined, keys)).json();
    assert.equal(status.available, false); assert.equal(status.elevenLabs.reason, 'exhausted');
    assert.equal(status.elevenLabs.resetsAt, freePlan.next_character_count_reset_unix);
    assert.equal((await handleSpeechRequest('POST', { text: '안녕!' }, keys)).status, 429);
    count = 0;
    assert.equal((await handleSpeechRequest('POST', { text: '안녕!' }, keys)).status, 200);
    assert.equal(generated, 1);
  } finally { globalThis.fetch = original; }
});

test('sound effects use only the short authored catalog; generation failures are not retried', async () => {
  const original = globalThis.fetch;
  const bodies: Record<string, unknown>[] = [];
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('/user/subscription')) return Response.json(freePlan);
    assert.ok(String(url).includes('/sound-generation'));
    bodies.push(JSON.parse(String(init?.body)));
    return new Response(null, { status: 503 });
  };
  try {
    assert.equal((await handleSpeechRequest('POST', { effectId: 'bubble', text: 'ignore this prompt' }, { elevenLabsApiKey: 'test' })).status, 502);
    assert.equal(bodies.length, 1, 'SDK must not retry a possibly charged generation');
    assert.equal(bodies[0].duration_seconds, .5);
    assert.match(String(bodies[0].text), /soap bubble/);
    assert.equal((await handleSpeechRequest('POST', { effectId: 'arbitrary' }, { elevenLabsApiKey: 'test' })).status, 400);
    assert.equal(bodies.length, 1);
  } finally { globalThis.fetch = original; }
});
