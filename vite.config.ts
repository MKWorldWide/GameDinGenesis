import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { fileURLToPath } from 'node:url';

// Fix for __dirname in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  
  return {
    root: __dirname,
    base: isProd ? '/GameDin/' : '/',
    publicDir: 'public',
    envDir: '.',
    envPrefix: 'VITE_',
    define: {
      'process.env': {
        VITE_API_URL: JSON.stringify(process.env.VITE_API_URL || 'http://localhost:5173'),
        VITE_GEMINI_API_KEY: JSON.stringify(process.env.VITE_GEMINI_API_KEY || '')
      }
    },
    resolve: {
      alias: [
        {
          find: '@',
          replacement: path.resolve(__dirname, 'src')
        },
        {
          find: '@testing-library/react',
          replacement: path.resolve(__dirname, 'node_modules/@testing-library/react')
        },
        {
          find: 'vitest',
          replacement: path.resolve(__dirname, 'node_modules/vitest')
        }
      ]
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: isProd,
      target: 'esnext',
      minify: isProd ? 'terser' : false,
      terserOptions: isProd ? {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      } : undefined,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          manualChunks: (id: string) => {
            if (id.includes('node_modules')) {
              if (id.includes('@google/generative-ai')) {
                return 'vendor-google-ai';
              }
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                return 'vendor-react';
              }
              return 'vendor';
            }
          },
          assetFileNames: (assetInfo: { name?: string }) => {
            const info = assetInfo.name?.split('.');
            const ext = info?.[info.length - 1] || '';
            if (ext === 'mp3') {
              return 'assets/audio/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          }
        }
      }
    },
    server: {
      port: 5173,
      strictPort: true,
      open: true
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'GameDin Genesis',
          short_name: 'GameDin',
          description: 'AI-Powered Game Development Platform',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}']
        }
      })
    ]
  };
});
