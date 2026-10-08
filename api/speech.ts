import { handleSpeechRequest } from '../src/server/speech';

export const config = { runtime: 'edge' };

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
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    } });
  }
  const response = await handleSpeechRequest(method, body, { geminiApiKey: geminiKey, elevenLabsApiKey: elevenKey });
  response.headers.set('Access-Control-Allow-Origin', '*');
  return response;
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
