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

export async function handleSpeechRequest(
  method: string,
  body: unknown,
  keys: string | SpeechApiKeys | undefined
): Promise<Response> {
  const geminiKey = typeof keys === 'string' ? keys : keys?.geminiApiKey;
  const elevenKey = typeof keys === 'object' ? keys?.elevenLabsApiKey : undefined;
  const isAvailable = Boolean(geminiKey?.trim() || elevenKey?.trim());

  if (method === 'GET') {
    return Response.json({ available: isAvailable }, { headers: { 'Cache-Control': 'no-store' } });
  }
  if (method !== 'POST') return jsonError(405, 'Method not allowed');
  if (!isAvailable) return jsonError(503, 'AI voice is not configured');

  const input = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const text = typeof input.text === 'string' ? input.text.trim() : '';
  if (!text || text.length > 300 || (input.characterId !== undefined && typeof input.characterId !== 'string')) {
    return jsonError(400, 'Invalid speech request');
  }

  const character = getCharacterVoice(typeof input.characterId === 'string' ? input.characterId : 'ggomi');

  // 1. Try ElevenLabs first if configured (Ultra-natural realistic speech)
  if (elevenKey?.trim()) {
    try {
      const voiceId = character.elevenVoiceId || 'cgSgspJ2msm6clMCkdW9';
      const response = await fetch(`${ELEVEN_LABS_API_URL}/${voiceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': elevenKey.trim(),
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (response.ok) {
        const audioData = await response.arrayBuffer();
        if (audioData.byteLength > 100) {
          return new Response(audioData, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Cache-Control': 'private, no-store',
            },
          });
        }
      } else {
        console.warn('ElevenLabs TTS failed:', response.status);
      }
    } catch (err) {
      console.warn('ElevenLabs TTS error:', err instanceof Error ? err.message : err);
    }
  }

  // 2. Fallback to Gemini 3.8 Flash TTS
  if (geminiKey?.trim()) {
    try {
      const upstream = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey.trim() },
        body: JSON.stringify({
          model: GEMINI_MODEL,
          input: [{ type: 'user_input', content: [{ type: 'text', text, annotations: [{ type: 'speech_metadata', style: character.style }] }] }],
          response_format: { type: 'audio' },
          generation_config: { speech_config: [{ voice: character.voice }] },
        }),
        signal: AbortSignal.timeout(20000),
      });
      if (!upstream.ok) {
        console.warn('Gemini TTS request failed:', upstream.status);
        return jsonError(502, 'AI voice is temporarily unavailable');
      }

      const data = await upstream.json() as {
        steps?: Array<{ type?: string; content?: Array<{ type?: string; data?: string }> }>;
      };
      const audio = data.steps?.filter(step => step.type === 'model_output')
        .flatMap(step => step.content || []).filter(part => part.type === 'audio' && part.data).at(-1)?.data;
      if (!audio) return jsonError(502, 'AI voice returned no audio');

      const wav = Buffer.from(audio, 'base64');
      if (wav.length < 44 || wav.toString('ascii', 0, 4) !== 'RIFF' || wav.toString('ascii', 8, 12) !== 'WAVE') {
        return jsonError(502, 'AI voice returned invalid audio');
      }
      return new Response(Uint8Array.from(wav), {
        headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'private, no-store' },
      });
    } catch (error) {
      console.warn('Gemini TTS failed:', error instanceof Error ? error.message : error);
      return jsonError(502, 'AI voice is temporarily unavailable');
    }
  }

  return jsonError(503, 'AI voice could not be generated');
}

