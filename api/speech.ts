export const config = {
  runtime: 'edge',
};

const CHARACTER_VOICES: Record<string, { voice: string; elevenVoiceId: string; style: string }> = {
  ggomi: {
    voice: 'Sulafat',
    elevenVoiceId: 'cgSgspJ2msm6clMCkdW9',
    style: 'Speak natural Korean in a warm, gentle, affectionate character voice for a young child. Smile softly while speaking. Keep the words clear and unhurried.',
  },
  rano: {
    voice: 'Puck',
    elevenVoiceId: 'TX3LPaxmHKxFdv7VOQHJ',
    style: 'Speak natural Korean as a brave, playful dinosaur friend. Sound upbeat and excited, with a clear and comfortable pace for a young child.',
  },
  jelly: {
    voice: 'Leda',
    elevenVoiceId: 'FGY2WhTYpPnrIDTdsKH5',
    style: 'Speak natural Korean as a sweet, lively rabbit friend. Sound youthful and cheerful without squeaking or sounding artificial. Pronounce every word clearly.',
  },
  dochi: {
    voice: 'Achird',
    elevenVoiceId: 'EXAVITQu4vr4xnSDxMaL',
    style: 'Speak natural Korean as a curious and friendly little hedgehog. Sound playful and kind, with gentle wonder and clear pronunciation.',
  },
  ggulgguli: {
    voice: 'Fenrir',
    elevenVoiceId: 'N2lVS1w4EtoT3dr4eOWO',
    style: 'Speak natural Korean as a funny, energetic pig friend. Sound delighted and expressive, but keep a comfortable volume and clear words for a young child.',
  },
  eumme: {
    voice: 'Achernar',
    elevenVoiceId: 'SAz9YHcvj6GT2YYXdXww',
    style: 'Speak natural Korean as a calm, caring sheep friend. Sound soft, reassuring and lightly playful. Speak slowly enough for a young child to follow.',
  },
  nurungji: {
    voice: 'Laomedeia',
    elevenVoiceId: 'bIHbv24MWmeRgasZH58o',
    style: 'Speak natural Korean as a friendly, happy puppy. Sound bright, bouncy and sincere, with clear pronunciation and a natural human rhythm.',
  },
  pingu: {
    voice: 'Zephyr',
    elevenVoiceId: '9BWtsMINqrJLrRacOk9x',
    style: 'Speak natural Korean as Pingu, a cheerful little penguin wearing a mint scarf. Use a bright, gentle, lightly bouncy voice with a warm smile. Keep a relaxed pace and clear short words for a preschool child. Avoid shrill squeaks, shouting, and exaggerated baby talk.',
  },
};

const GEMINI_MODEL = 'gemini-3.8-flash-tts';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const ELEVEN_LABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      ...headers,
    },
  });
}

async function processSpeech(method: string, body: unknown, geminiKey?: string, elevenKey?: string): Promise<Response> {
  const isAvailable = Boolean(geminiKey?.trim() || elevenKey?.trim());

  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (method === 'GET') {
    return jsonResponse({
      available: isAvailable,
      engine: elevenKey?.trim() ? 'elevenlabs' : (geminiKey?.trim() ? 'gemini' : 'none'),
    });
  }

  if (method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  if (!isAvailable) {
    return jsonResponse({ error: 'AI voice is not configured' }, 503);
  }

  const input = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const text = typeof input.text === 'string' ? input.text.trim() : '';
  if (!text || text.length > 300) {
    return jsonResponse({ error: 'Invalid speech request' }, 400);
  }

  const characterId = typeof input.characterId === 'string' ? input.characterId : 'ggomi';
  const character = CHARACTER_VOICES[characterId] || CHARACTER_VOICES.ggomi;

  // 1. ElevenLabs (Priority)
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
            status: 200,
            headers: {
              'Content-Type': 'audio/mpeg',
              'Cache-Control': 'private, no-store',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      } else {
        console.warn('ElevenLabs TTS failed with status:', response.status);
      }
    } catch (err) {
      console.warn('ElevenLabs TTS error:', err instanceof Error ? err.message : err);
    }
  }

  // 2. Gemini 3.8 Flash TTS fallback
  if (geminiKey?.trim()) {
    try {
      const upstream = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiKey.trim(),
        },
        body: JSON.stringify({
          model: GEMINI_MODEL,
          input: [
            {
              type: 'user_input',
              content: [
                {
                  type: 'text',
                  text,
                  annotations: [{ type: 'speech_metadata', style: character.style }],
                },
              ],
            },
          ],
          response_format: { type: 'audio' },
          generation_config: { speech_config: [{ voice: character.voice }] },
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (!upstream.ok) {
        console.warn('Gemini TTS upstream failed:', upstream.status);
        return jsonResponse({ error: 'AI voice is temporarily unavailable' }, 502);
      }

      const data = (await upstream.json()) as {
        steps?: Array<{ type?: string; content?: Array<{ type?: string; data?: string }> }>;
      };
      const audio = data.steps
        ?.filter(step => step.type === 'model_output')
        .flatMap(step => step.content || [])
        .filter(part => part.type === 'audio' && part.data)
        .at(-1)?.data;

      if (!audio) {
        return jsonResponse({ error: 'AI voice returned no audio' }, 502);
      }

      const wav = base64ToUint8Array(audio);
      const riff = String.fromCharCode(wav[0], wav[1], wav[2], wav[3]);
      const wave = String.fromCharCode(wav[8], wav[9], wav[10], wav[11]);
      if (wav.length < 44 || riff !== 'RIFF' || wave !== 'WAVE') {
        return jsonResponse({ error: 'AI voice returned invalid audio' }, 502);
      }

      return new Response(wav, {
        status: 200,
        headers: {
          'Content-Type': 'audio/wav',
          'Cache-Control': 'private, no-store',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (err) {
      console.warn('Gemini TTS error:', err instanceof Error ? err.message : err);
      return jsonResponse({ error: 'AI voice is temporarily unavailable' }, 502);
    }
  }

  return jsonResponse({ error: 'AI voice could not be generated' }, 503);
}

export default async function handler(req: any, res?: any): Promise<Response | void> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const elevenKey = process.env.ELEVENLABS_API_KEY;

  // Case A: Node.js Serverless runtime (req: IncomingMessage, res: ServerResponse)
  if (res && typeof res.writeHead === 'function') {
    try {
      let body = req.body;
      if (req.method === 'POST' && body === undefined) {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(Buffer.from(chunk));
          if (chunks.reduce((size: number, part: Buffer) => size + part.length, 0) > 16384) {
            res.writeHead(413).end();
            return;
          }
        }
        if (chunks.length > 0) {
          try {
            body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Invalid JSON' }));
            return;
          }
        }
      }

      const response = await processSpeech(req.method || 'GET', body, geminiKey, elevenKey);
      res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
      const arrayBuffer = await response.arrayBuffer();
      res.end(Buffer.from(arrayBuffer));
    } catch (err) {
      console.error('Node handler error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Internal Error' }));
    }
    return;
  }

  // Case B: Edge Runtime (req: Request) -> returns Response
  const webReq = req as Request;
  let body: unknown;
  if (webReq.method === 'POST') {
    try {
      body = await webReq.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON' }, 400);
    }
  }

  return processSpeech(webReq.method, body, geminiKey, elevenKey);
}
