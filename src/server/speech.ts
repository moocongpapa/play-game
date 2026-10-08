import { getCharacterVoice } from '../data/characterVoices';

const MODEL = 'gemini-3.8-flash-tts';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';

function jsonError(status: number, error: string) {
  return Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function handleSpeechRequest(method: string, body: unknown, apiKey: string | undefined): Promise<Response> {
  if (method === 'GET') {
    return Response.json({ available: Boolean(apiKey?.trim()) }, { headers: { 'Cache-Control': 'no-store' } });
  }
  if (method !== 'POST') return jsonError(405, 'Method not allowed');
  if (!apiKey?.trim()) return jsonError(503, 'AI voice is not configured');

  const input = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const text = typeof input.text === 'string' ? input.text.trim() : '';
  if (!text || text.length > 300 || (input.characterId !== undefined && typeof input.characterId !== 'string')) {
    return jsonError(400, 'Invalid speech request');
  }

  const character = getCharacterVoice(typeof input.characterId === 'string' ? input.characterId : 'ggomi');
  try {
    const upstream = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        model: MODEL,
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
