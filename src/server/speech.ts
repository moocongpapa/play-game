import { normalizeSpeechLanguage } from '../utils/speechLanguage';
import { getCharacterVoice } from '../data/characterVoices';

const GEMINI_MODEL = 'gemini-3.8-flash-tts';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const ELEVEN_LABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

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
    return Response.json({ available: isAvailable, engine: geminiKey ? 'gemini' : elevenKey ? 'elevenlabs' : 'none' }, { headers: { 'Cache-Control': 'no-store' } });
  }
  if (method !== 'POST') return jsonError(405, 'Method not allowed');
  if (!isAvailable) return jsonError(503, 'AI voice is not configured');

  const input = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const text = typeof input.text === 'string' ? input.text.trim() : '';
  if ((input.language !== undefined && !['en', 'ko'].includes(input.language as string)) || !text || text.length > 300 || (input.characterId !== undefined && typeof input.characterId !== 'string')) {
    return jsonError(400, 'Invalid speech request');
  }
  const language = normalizeSpeechLanguage(input.language);
  const character = getCharacterVoice(typeof input.characterId === 'string' ? input.characterId : 'ggomi');

  // Gemini can direct a childlike character performance; a fixed adult voice cannot.
  // Both provider timeouts together stay inside the deployed Edge response deadline.
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

  // Only light, young female bases are allowed here. Never fall back to the old
  // Liam / Callum / Will adult male voices or a provider's arbitrary default voice.
  if (elevenKey) {
    try {
      const response = await fetch(`${ELEVEN_LABS_API_URL}/${character.elevenVoiceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'xi-api-key': elevenKey },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: .6, similarity_boost: .7, style: .15, speed: character.rate, use_speaker_boost: false },
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error(`ElevenLabs status ${response.status}`);
      const audioData = await response.arrayBuffer();
      if (audioData.byteLength <= 100) throw new Error('ElevenLabs returned no audio');
      return new Response(audioData, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, no-store', 'X-Speech-Provider': 'elevenlabs' } });
    } catch (error) {
      console.warn('Gentle fallback voice unavailable:', error instanceof Error ? error.message : 'request failed');
    }
  }
  return jsonError(502, 'AI voice is temporarily unavailable');
}
