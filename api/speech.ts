import { createSpeechEndpoint } from '../src/server/speechEndpoint';
import { createRedisSpeechQuota } from '../src/server/speechQuota';

// Node runtime is required by the official ElevenLabs SDK.
export const maxDuration = 30;

async function handler(request: Request): Promise<Response> {
  const endpoint = createSpeechEndpoint({
    geminiApiKey: process.env.GEMINI_API_KEY,
    elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
  }, createRedisSpeechQuota(process.env.UPSTASH_REDIS_REST_URL, process.env.UPSTASH_REDIS_REST_TOKEN));
  // Vercel overwrites this header. Do not trust arbitrary proxy headers elsewhere.
  const client = process.env.VERCEL === '1' ? request.headers.get('x-vercel-forwarded-for') || 'unknown' : 'unknown';
  return endpoint(request, client);
}

export default { fetch: handler };
