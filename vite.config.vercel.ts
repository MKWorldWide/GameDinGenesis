// vite.config.vercel.ts
import { defineConfig, loadEnv, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'url';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory and its parent directories
  const env = loadEnv(mode, process.cwd(), '');
  
  // Check if running in GitHub Pages environment
  const isGHPages = process.env.GITHUB_ACTIONS === 'true';
  
  // Base configuration
  const config: UserConfig = {
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
    base: isGHPages ? '/GameDinGenesis/' : '/',
    build: {
      outDir: "dist",
      sourcemap: false,
      target: "es2020",
      cssCodeSplit: true,
      modulePreload: { polyfill: true },
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: (id: string) => {
            return id.includes("node_modules") ? "vendor" : undefined;
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
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  };
  
  return config;
});
