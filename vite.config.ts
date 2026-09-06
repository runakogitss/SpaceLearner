import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { loadProvidersFromEnv, handleKaizenProxy } from './api/kaizen';

// Dev middleware that mirrors the production serverless function (api/kaizen.ts):
// routes /api/kaizen to the provider chosen via the x-kaizen-provider header and
// injects that provider's API key server-side (no CORS, key never reaches the browser).
function kaizenProxyPlugin(env: Record<string, string>): Plugin {
  const providers = loadProvidersFromEnv(env);
  return {
    name: 'kaizen-proxy',
    configureServer(server) {
      server.middlewares.use('/api/kaizen', (req, res) => {
        void handleKaizenProxy(req, res, providers);
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), kaizenProxyPlugin(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      open: true,
    },
  };
});