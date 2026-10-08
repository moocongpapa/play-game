import assert from 'node:assert/strict';
import test from 'node:test';
import { CHARACTER_VOICES } from '../data/characterVoices';
import { handleSpeechRequest } from './speech';

test('speech endpoint keeps the key server-side and selects a distinct voice for each character', async () => {
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
      const response = await handleSpeechRequest('POST', { text: '안녕, 유하야!', characterId: id }, 'server-secret');
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('Content-Type'), 'audio/wav');
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), wav);
    }
    assert.equal(calls.length, 7);
    for (const [index, character] of Object.values(CHARACTER_VOICES).entries()) {
      const call = calls[index];
      assert.equal(call.url, 'https://generativelanguage.googleapis.com/v1beta/interactions');
      assert.equal((call.init.headers as Record<string, string>)['x-goog-api-key'], 'server-secret');
      const request = JSON.parse(String(call.init.body));
      assert.equal(request.model, 'gemini-3.8-flash-tts');
      assert.equal(request.generation_config.speech_config[0].voice, character.voice);
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
  assert.deepEqual(await status.json(), { available: false });
  const response = await handleSpeechRequest('POST', { text: '안녕' }, undefined);
  assert.equal(response.status, 503);
});

test('speech endpoint uses ElevenLabs when configured and falls back properly', async () => {
  const originalFetch = globalThis.fetch;
  const mp3Data = Buffer.alloc(150);
  mp3Data.fill(0x55);
  let calledUrl = '';
  let calledHeaders: Record<string, string> = {};

  globalThis.fetch = async (url, init) => {
    calledUrl = String(url);
    calledHeaders = (init?.headers || {}) as Record<string, string>;
    return new Response(mp3Data, {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  };

  try {
    const response = await handleSpeechRequest(
      'POST',
      { text: '안녕, 유하야!', characterId: 'ggomi' },
      { elevenLabsApiKey: 'test-eleven-key' }
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), 'audio/mpeg');
    assert.ok(calledUrl.includes('https://api.elevenlabs.io/v1/text-to-speech/'));
    assert.equal(calledHeaders['xi-api-key'], 'test-eleven-key');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

