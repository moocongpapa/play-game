import { normalizeSpeechLanguage } from '../utils/speechLanguage';
import { getCharacterVoice } from '../data/characterVoices';
import { PLAY_EFFECTS, type PlayEffectId } from '../data/audioExperience';
import { AudioBudgetError, generateElevenAudio, getIncludedAudioBudget } from './elevenLabsAudio';

const GEMINI_MODEL = 'gemini-3.8-flash-tts';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';

function jsonError(status: number, error: string) {
  return Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export interface SpeechApiKeys {
  geminiApiKey?: string;
  elevenLabsApiKey?: string;
}

/** Shared by Vite and the deployed endpoint, including language and voice direction. */
export async function handleSpeechRequest(method: string, body: unknown, keys: string | SpeechApiKeys | undefined): Promise<Response> {
  const geminiKey = (typeof keys === 'string' ? keys : keys?.geminiApiKey)?.trim();
  const elevenKey = (typeof keys === 'object' ? keys?.elevenLabsApiKey : undefined)?.trim();
  const isAvailable = Boolean(geminiKey || elevenKey);
  if (method === 'GET') {
    const budget = elevenKey ? await getIncludedAudioBudget(elevenKey) : undefined;
    return Response.json({ available: budget ? budget.eligible && budget.remaining > 0 : Boolean(geminiKey),
      engine: elevenKey ? 'elevenlabs' : geminiKey ? 'gemini' : 'none', ...(budget ? { elevenLabs: budget } : {}) },
    { headers: { 'Cache-Control': 'no-store' } });
  }
  if (method !== 'POST') return jsonError(405, 'Method not allowed');
  if (!isAvailable) return jsonError(503, 'AI voice is not configured');

  const input = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const effectId = typeof input.effectId === 'string' && Object.hasOwn(PLAY_EFFECTS, input.effectId) ? input.effectId as PlayEffectId : undefined;
  if (input.effectId !== undefined && !effectId) return jsonError(400, 'Unknown sound effect');
  const text = typeof input.text === 'string' ? input.text.trim() : '';
  if (!effectId && ((input.language !== undefined && !['en', 'ko'].includes(input.language as string)) || !text || text.length > 300 || (input.characterId !== undefined && typeof input.characterId !== 'string'))) {
    return jsonError(400, 'Invalid speech request');
  }
  const language = normalizeSpeechLanguage(input.language);
  const character = getCharacterVoice(typeof input.characterId === 'string' ? input.characterId : 'ggomi');

  // With ElevenLabs configured, exhausted/unknown quota must never route to a
  // different billable provider. Cached clips and device speech handle fallback.
  if (elevenKey) {
    try {
      const audio = await generateElevenAudio(elevenKey, effectId ? { effectId } : { text, characterId: typeof input.characterId === 'string' ? input.characterId : 'ggomi' });
      return new Response(audio, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, no-store', 'X-Speech-Provider': 'elevenlabs' } });
    } catch (error) {
      if (error instanceof AudioBudgetError) {
        return Response.json({ error: 'Included audio allowance unavailable', elevenLabs: error.budget }, {
          status: error.budget.eligible ? 429 : 503,
          headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' },
        });
      }
      return jsonError(502, 'AI audio is temporarily unavailable');
    }
  }
  if (effectId) return jsonError(503, 'Generated effects are not configured');
  // Compatibility for deployments that only configure Gemini. The endpoint
  // requires a shared request quota before this legacy route can be reached.
  if (geminiKey) {
    try {
      const upstream = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
        body: JSON.stringify({
          model: GEMINI_MODEL,
          input: [{ type: 'user_input', content: [{ type: 'text', text, annotations: [{ type: 'speech_metadata', style: character.style.replace('Speak natural Korean', language === 'en' ? 'Speak natural English' : 'Speak natural Korean') }] }] }],
          response_format: { type: 'audio' },
          generation_config: { speech_config: [{ voice: character.voice }] },
        }),
        signal: AbortSignal.timeout(12000),
      });
      if (!upstream.ok) throw new Error(`Gemini status ${upstream.status}`);
      const data = await upstream.json() as { steps?: Array<{ type?: string; content?: Array<{ type?: string; data?: string }> }> };
      const audio = data.steps?.filter(step => step.type === 'model_output')
        .flatMap(step => step.content || []).filter(part => part.type === 'audio' && part.data).at(-1)?.data;
      if (!audio) throw new Error('Gemini returned no audio');
      // Web APIs keep this handler compatible with both Edge and Node runtimes.
      const wav = Uint8Array.from(atob(audio), char => char.charCodeAt(0));
      const signature = (offset: number) => String.fromCharCode(...wav.subarray(offset, offset + 4));
      if (wav.length < 44 || signature(0) !== 'RIFF' || signature(8) !== 'WAVE') throw new Error('Gemini returned invalid audio');
      return new Response(wav, { headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'private, no-store', 'X-Speech-Provider': 'gemini' } });
    } catch (error) {
      console.warn('Gemini child character voice unavailable:', error instanceof Error ? error.message : 'request failed');
    }
  }

  return jsonError(502, 'AI voice is temporarily unavailable');
}
