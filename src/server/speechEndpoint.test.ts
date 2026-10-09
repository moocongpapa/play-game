import assert from 'node:assert/strict';
import test from 'node:test';
import { createSpeechEndpoint } from './speechEndpoint';
import { createLocalSpeechQuota, createRedisSpeechQuota, SPEECH_QUOTA_SCRIPT } from './speechQuota';
import { freePlan } from './audioTestFixtures';

const request = (body: unknown = { text: 'Hello, friend!', characterId: 'jelly', language: 'en' }, headers: Record<string, string> = {}) =>
  new Request('https://game.example/api/speech', { method: 'POST', headers: { Origin: 'https://game.example', 'Content-Type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });

// All upstream calls in these tests are fake; no paid voice request is made.
test('invalid origins, content types and bodies never reach the quota or provider', async () => {
  let quotas = 0;
  const endpoint = createSpeechEndpoint({ geminiApiKey: 'test' }, { configured: true, consume: async () => { quotas++; return { allowed: true, retryAfter: 0 }; } });
  for (const [input, status] of [
    [request(undefined, { Origin: 'https://outside.example' }), 403],
    [request(undefined, { Origin: '' }), 403],
    [request(undefined, { 'Sec-Fetch-Site': 'cross-site' }), 403],
    [request(undefined, { 'Content-Type': 'text/plain' }), 415],
    [request('{'), 400], [request({ text: 'a'.repeat(301) }), 400],
    [request({ text: 'Hi', characterId: '__proto__' }), 400],
    [request(' '.repeat(4097)), 413],
  ] as const) {
    const response = await endpoint(input, 'client');
    assert.equal(response.status, status);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
  }
  assert.equal(quotas, 0);
});

test('chunked oversized bodies are bounded, not only Content-Length declarations', async () => {
  const endpoint = createSpeechEndpoint({ geminiApiKey: 'test' }, createLocalSpeechQuota());
  const input = new Request('https://game.example/api/speech', {
    method: 'POST', headers: { Origin: 'https://game.example', 'Content-Type': 'application/json' },
    body: new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(3000)); controller.enqueue(new Uint8Array(3000)); controller.close(); } }),
    duplex: 'half',
  } as RequestInit);
  assert.equal((await endpoint(input, 'client')).status, 413);
});

test('without Redis only verified included credits are reachable, including the authorized Starter plan', async () => {
  const original = globalThis.fetch;
  let overage = 0, generated = 0;
  globalThis.fetch = async (url) => {
    assert.ok(String(url).includes('elevenlabs.io'), 'Gemini must never be reachable without the shared limiter');
    if (String(url).includes('/user/subscription')) return Response.json({ ...freePlan, tier: 'starter', character_limit: 30000, max_credit_limit_extension: overage });
    generated++;
    return new Response(new Uint8Array(150));
  };
  try {
    const endpoint = createSpeechEndpoint({ geminiApiKey: 'blocked', elevenLabsApiKey: 'test' }, createRedisSpeechQuota());
    const status = await (await endpoint(new Request('https://game.example/api/speech'), 'client')).json();
    assert.equal(status.elevenLabs.limit, 30000);
    assert.equal(status.elevenLabs.eligible, true);
    assert.equal((await endpoint(request(), 'client')).status, 200);
    overage = 1000;
    assert.equal((await endpoint(request(), 'client')).status, 503);
    assert.equal((await endpoint(request({ effectId: '__proto__' }), 'client')).status, 400);
    assert.equal(generated, 1, 'enabling account overages disables further app generation');
  } finally { globalThis.fetch = original; }
});

test('rate limits and storage outages block generation; an expired minute admits play again', async () => {
  const originalFetch = globalThis.fetch;
  let generations = 0, now = 0;
  const wav = Buffer.alloc(44); wav.write('RIFF'); wav.write('WAVE', 8);
  globalThis.fetch = async () => { generations++; return Response.json({ steps: [{ type: 'model_output', content: [{ type: 'audio', data: wav.toString('base64') }] }] }); };
  try {
    const endpoint = createSpeechEndpoint({ geminiApiKey: 'test' }, createLocalSpeechQuota(() => now));
    const replies = await Promise.all(Array.from({ length: 40 }, () => endpoint(request(), 'same-client')));
    assert.equal(replies.filter(reply => reply.status === 200).length, 30);
    assert.equal(replies.filter(reply => reply.status === 429).length, 10);
    assert.equal(replies.find(reply => reply.status === 429)?.headers.get('Retry-After'), '60');
    assert.equal(generations, 30);
    now = 60001;
    assert.equal((await endpoint(request(), 'same-client')).status, 200);
    const unavailable = createSpeechEndpoint({ geminiApiKey: 'test' }, createRedisSpeechQuota());
    assert.deepEqual(await (await unavailable(new Request('https://game.example/api/speech'), 'client')).json(), { available: false, engine: 'none' });
    assert.equal((await unavailable(request(), 'client')).status, 503);
    const failed = createSpeechEndpoint({ geminiApiKey: 'test' }, { configured: true, consume: async () => { throw new Error('offline'); } });
    assert.equal((await failed(request(), 'client')).status, 503);
    assert.equal(generations, 31);
  } finally { globalThis.fetch = originalFetch; }
});

test('per-client and app-wide 24-hour ceilings cannot be bypassed by waiting a minute or rotating clients', async () => {
  let now = 0;
  const quota = createLocalSpeechQuota(() => now);
  for (let group = 0; group < 4; group++) {
    for (let minute = 0; minute < 10; minute++) {
      for (let i = 0; i < 30; i++) assert.equal((await quota.consume(`client-${group}`)).allowed, true);
      now += 60000;
    }
    assert.equal((await quota.consume(`client-${group}`)).allowed, false);
  }
  assert.equal((await quota.consume('rotated-client')).allowed, false);
  now += 86400000;
  assert.equal((await quota.consume('rotated-client')).allowed, true);
});

test('deployed limiter uses one shared atomic Redis reservation, hashes IPs and rejects bad responses', async () => {
  const originalFetch = globalThis.fetch;
  let reply: unknown = { result: [1, 0] };
  let command: unknown[], calls = 0;
  globalThis.fetch = async (_url, init) => {
    calls++;
    assert.equal((init.headers as Record<string, string>).Authorization, 'Bearer quota-secret');
    command = JSON.parse(String(init.body));
    return Response.json(reply);
  };
  try {
    const a = createRedisSpeechQuota('https://quota.example', 'quota-secret');
    const b = createRedisSpeechQuota('https://quota.example', 'quota-secret');
    assert.equal((await a.consume('192.0.2.1')).allowed, true);
    const firstCommand = command!;
    assert.equal(command![0], 'EVAL'); assert.equal(command![1], SPEECH_QUOTA_SCRIPT);
    assert.equal(command![2], 3);
    assert.doesNotMatch(JSON.stringify(command!), /192\.0\.2\.1/);
    assert.deepEqual(command!.slice(6), [30, 60, 300, 86400, 1200, 86400]);
    reply = { result: [0, 42] };
    assert.deepEqual(await b.consume('192.0.2.1'), { allowed: false, retryAfter: 42 });
    assert.deepEqual(command!, firstCommand, 'different instances address the same counters');
    for (reply of [{ error: 'denied' }, {}, { result: ['1', '0'] }]) await assert.rejects(a.consume('client'));
    assert.equal(calls, 5);
    assert.equal(createRedisSpeechQuota('http://quota.example', 'test').configured, false);
  } finally { globalThis.fetch = originalFetch; }
});
