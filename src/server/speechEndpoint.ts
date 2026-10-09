import { CHARACTER_VOICES } from '../data/characterVoices';
import { handleSpeechRequest, type SpeechApiKeys } from './speech';
import type { SpeechQuota } from './speechQuota';

const MAX_BODY_BYTES = 4096;
const error = (status: number, message: string, headers: Record<string, string> = {}) =>
  Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

export function createSpeechEndpoint(keys: SpeechApiKeys, quota: SpeechQuota) {
  return async (request: Request, client: string): Promise<Response> => {
    const origin = request.headers.get('origin');
    const site = request.headers.get('sec-fetch-site');
    // Origin checks block drive-by browser use. Shared quotas also cap clients
    // that forge headers or rotate IPs; this anonymous app does not require login.
    if ((origin && origin !== new URL(request.url).origin) || (site && site !== 'same-origin' && site !== 'none')) {
      return error(403, 'This speech endpoint is only available from the app');
    }
    if (request.method === 'GET') {
      if (!quota.configured) return Response.json({ available: false, engine: 'none' }, { headers: { 'Cache-Control': 'no-store' } });
      return handleSpeechRequest('GET', undefined, keys);
    }
    if (request.method !== 'POST') return error(405, 'Method not allowed', { Allow: 'GET, POST' });
    if (!origin) return error(403, 'Missing app origin');
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return error(415, 'Expected JSON');
    if (!quota.configured) return error(503, 'AI speech is unavailable; use the device voice');
    if (!keys.geminiApiKey?.trim() && !keys.elevenLabsApiKey?.trim()) return error(503, 'AI voice is not configured');
    if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) return error(413, 'Speech request is too large');

    let body: Record<string, unknown>;
    try {
      const reader = request.body?.getReader();
      if (!reader) return error(400, 'Missing speech request');
      const parts: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > MAX_BODY_BYTES) { await reader.cancel(); return error(413, 'Speech request is too large'); }
          parts.push(value);
        }
      } finally { reader.releaseLock(); }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
      body = JSON.parse(new TextDecoder().decode(bytes));
    } catch { return error(400, 'Invalid JSON'); }

    if (!body || typeof body.text !== 'string' || !body.text.trim() || body.text.length > 300 ||
      (body.language !== undefined && !['en', 'ko'].includes(body.language as string)) ||
      (body.characterId !== undefined && (typeof body.characterId !== 'string' || !Object.hasOwn(CHARACTER_VOICES, body.characterId)))) {
      return error(400, 'Invalid speech request');
    }
    try {
      const allowance = await quota.consume(client);
      if (!allowance.allowed) return error(429, 'Speech request limit reached', { 'Retry-After': String(Math.max(1, allowance.retryAfter)) });
    } catch {
      // Never spend provider quota when the shared limiter cannot reserve a slot.
      return error(503, 'AI speech is temporarily unavailable', { 'Retry-After': '60' });
    }
    return handleSpeechRequest('POST', body, keys);
  };
}
