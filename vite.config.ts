import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'https://graduation-test-production.up.railway.app',
            changeOrigin: true,
            secure: false,
            timeout: 1800000,
            proxyTimeout: 1800000,
            headers: {
              'ngrok-skip-browser-warning': 'true'
            },
            configure: (proxy, options) => {
              proxy.on('error', (err, req, res) => {
                console.error('[Vite Proxy Error]:', err.message);
                if (err.message.includes('EPIPE')) {
                  console.error('  -> Broken pipe detected. This usually means the backend closed the connection unexpectedly during upload.');
                }
              });
              proxy.on('proxyRes', (proxyRes, req, res) => {
                if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
                  console.log(`[Vite Proxy] Target responded with status: ${proxyRes.statusCode} for ${req.url}`);
                }
              });
            }
          },
          '/media': {
            target: 'https://graduation-test-production.up.railway.app',
            changeOrigin: true,
            secure: false,
            timeout: 1800000,
            proxyTimeout: 1800000,
            headers: {
              'ngrok-skip-browser-warning': 'true'
            }
          }
        }
      },
      plugins: [react(), tailwindcss()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
