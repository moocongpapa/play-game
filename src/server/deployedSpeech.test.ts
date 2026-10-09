import assert from 'node:assert/strict';
import test from 'node:test';
import handler from '../../api/speech';
import { CHARACTER_VOICES } from '../data/characterVoices';

test('deployed endpoint shares the youthful voices and English/Korean direction used locally', async () => {
  const originalFetch = globalThis.fetch;
  const originalGemini = process.env.GEMINI_API_KEY;
  const originalEleven = process.env.ELEVENLABS_API_KEY;
  const originalRedis = [process.env.UPSTASH_REDIS_REST_URL, process.env.UPSTASH_REDIS_REST_TOKEN];
  process.env.UPSTASH_REDIS_REST_URL = 'https://quota.example';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-quota';
  process.env.GEMINI_API_KEY = 'test-gemini';
  process.env.ELEVENLABS_API_KEY = 'test-eleven';
  const wav = Buffer.alloc(44); wav.write('RIFF', 0); wav.write('WAVE', 8);
  const requests: Array<{ voice: string; style: string; text: string }> = [];
  globalThis.fetch = async (url, init) => {
    if (String(url) === 'https://quota.example') return Response.json({ result: [1, 0] });
    assert.equal(String(url), 'https://generativelanguage.googleapis.com/v1beta/interactions');
    const body = JSON.parse(String(init?.body));
    requests.push({ voice: body.generation_config.speech_config[0].voice, style: body.input[0].content[0].annotations[0].style, text: body.input[0].content[0].text });
    return Response.json({ steps: [{ type: 'model_output', content: [{ type: 'audio', data: wav.toString('base64') }] }] });
  };
  try {
    for (const [id, character] of Object.entries(CHARACTER_VOICES)) {
      for (const language of ['en', 'ko']) {
        const text = language === 'en' ? 'Let us play together!' : '우리 같이 놀자!';
        const response = await handler(new Request('https://game.example/api/speech', { method: 'POST', headers: { Origin: 'https://game.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ characterId: id, language, text }) }));
        assert.ok(response);
        assert.equal(response.status, 200);
        assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
        assert.deepEqual(Buffer.from(await response.arrayBuffer()), wav);
        assert.equal(requests.at(-1)?.voice, character.voice);
        assert.match(requests.at(-1)!.style, /young child character/);
        assert.ok(requests.at(-1)!.style.startsWith(language === 'en' ? 'Speak natural English' : 'Speak natural Korean'));
        assert.equal(requests.at(-1)!.text, text);
      }
    }
    const status = await handler(new Request('https://game.example/api/speech'));
    assert.ok(status);
    assert.deepEqual(await status.json(), { available: true, engine: 'gemini' });
    const invalid = await handler(new Request('https://game.example/api/speech', { method: 'POST', headers: { Origin: 'https://game.example', 'Content-Type': 'application/json' }, body: '{' }));
    assert.ok(invalid);
    assert.equal(invalid.status, 400);
    assert.equal(requests.length, 16);
  } finally {
    globalThis.fetch = originalFetch;
    for (const [index, key] of ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'].entries()) {
      if (originalRedis[index] === undefined) delete process.env[key]; else process.env[key] = originalRedis[index];
    }
    if (originalGemini === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = originalGemini;
    if (originalEleven === undefined) delete process.env.ELEVENLABS_API_KEY; else process.env.ELEVENLABS_API_KEY = originalEleven;
  }
});
