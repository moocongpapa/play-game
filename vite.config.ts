import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';
import { handleSpeechRequest } from './src/server/speech';

function localSpeechApi(apiKey: string | undefined): Plugin {
  return {
    name: 'local-speech-api',
    configureServer(server) {
      server.middlewares.use('/api/speech', async (req, res) => {
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(Buffer.from(chunk));
            if (chunks.reduce((size, part) => size + part.length, 0) > 4096) {
              res.writeHead(413).end();
              return;
            }
          }
          const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : undefined;
          const response = await handleSpeechRequest(req.method || 'GET', body, apiKey);
          res.writeHead(response.status, Object.fromEntries(response.headers));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Invalid request' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const apiKey = process.env.GEMINI_API_KEY || loadEnv(mode, process.cwd(), '').GEMINI_API_KEY;
  return {
    plugins: [react(), tailwindcss(), localSpeechApi(apiKey)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
