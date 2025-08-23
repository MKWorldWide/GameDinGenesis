// vite.config.vercel.ts
import { defineConfig, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  
  // Base configuration
  const config: UserConfig = {
    define: {
      'process.env': {}
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'esnext',
      },
      include: ['react', 'react-dom', 'react-router-dom'],
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'GameDin Genesis',
          short_name: 'GameDin',
          description: 'Your gaming social network',
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
              type: 'image/png'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}']
        }
      })
    ],
    envPrefix: "VITE_",
    base: '/',
    build: {
      outDir: 'dist',
      sourcemap: isProd,
      target: 'esnext',
      minify: isProd ? 'esbuild' : false,
      cssCodeSplit: true,
      assetsInlineLimit: 4096, // 4kb
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          globals: {
            '@google/generative-ai': 'google.genai'
          }
        }
      }
    },
    server: { 
      port: 5173, 
      strictPort: true 
    },
    preview: {
      port: 4173,
      strictPort: true
    }
  };
  
  return config;
});
