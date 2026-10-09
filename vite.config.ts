import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';
import { createSpeechEndpoint } from './src/server/speechEndpoint';
import { createLocalSpeechQuota } from './src/server/speechQuota';

function localSpeechApi(keys: { geminiApiKey?: string; elevenLabsApiKey?: string }): Plugin {
  const endpoint = createSpeechEndpoint(keys, createLocalSpeechQuota());
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
          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(',') : value);
          const method = req.method || 'GET';
          const request = new Request(`http://${req.headers.host}/api/speech`, { method, headers, ...(method === 'POST' ? { body: Buffer.concat(chunks) } : {}) });
          const response = await endpoint(request, req.socket.remoteAddress || 'local');
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
  const env = loadEnv(mode, process.cwd(), '');
  const geminiApiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
  const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY || env.ELEVENLABS_API_KEY;
  return {
    plugins: [react(), tailwindcss(), localSpeechApi({ geminiApiKey, elevenLabsApiKey })],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react/') || id.includes('react-dom/')) {
                return 'vendor-react';
              }
              if (id.includes('motion') || id.includes('framer-motion')) {
                return 'vendor-motion';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('canvas-confetti')) {
                return 'vendor-media';
              }
            }
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
