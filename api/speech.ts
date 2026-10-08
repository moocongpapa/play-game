import type { IncomingMessage, ServerResponse } from 'http';
import { handleSpeechRequest } from '../src/server/speech';

export default async function handler(req: IncomingMessage | Request, res?: ServerResponse) {
  // 1. If invoked as a standard Node.js Serverless Function (req, res)
  if (res && 'writeHead' in res && 'method' in req) {
    try {
      const nodeReq = req as IncomingMessage;
      const chunks: Buffer[] = [];
      for await (const chunk of nodeReq) {
        chunks.push(Buffer.from(chunk));
        if (chunks.reduce((size, part) => size + part.length, 0) > 8192) {
          res.writeHead(413).end();
          return;
        }
      }
      const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : undefined;
      const response = await handleSpeechRequest(nodeReq.method || 'GET', body, {
        geminiApiKey: process.env.GEMINI_API_KEY,
        elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
      });

      res.writeHead(response.status, Object.fromEntries(response.headers));
      const arrayBuffer = await response.arrayBuffer();
      res.end(Buffer.from(arrayBuffer));
    } catch (err) {
      console.error('API /api/speech error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Internal Server Error' }));
    }
    return;
  }

  // 2. If invoked as Web Standard Request (Edge or fetch)
  const webReq = req as Request;
  let body: unknown;
  if (webReq.method === 'POST') {
    try {
      body = await webReq.json();
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 });
    }
  }
  return handleSpeechRequest(webReq.method, body, {
    geminiApiKey: process.env.GEMINI_API_KEY,
    elevenLabsApiKey: process.env.ELEVENLABS_API_KEY,
  });
}


