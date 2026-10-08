import { handleSpeechRequest } from '../src/server/speech';

export default {
  async fetch(request: Request) {
    let body: unknown;
    if (request.method === 'POST') {
      try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
    }
    return handleSpeechRequest(request.method, body, {
      geminiApiKey: process.env.GEMINI_API_KEY,
      elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
    });
  },
};

