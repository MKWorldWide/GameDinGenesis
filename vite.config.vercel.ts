// vite.config.vercel.ts
import { defineConfig, mergeConfig, type UserConfigExport } from "vite";
import react from '@vitejs/plugin-react';

async function loadBase(env: any): Promise<UserConfigExport> {
  // Try TS first, then JS. If neither exists, return empty config.
  try {
    const m = await import("./vite.config.ts");
    return typeof m.default === "function" ? m.default(env) : (m.default ?? {});
  } catch {}
  try {
    const m = await import("./vite.config.js");
    return typeof m.default === "function" ? m.default(env) : (m.default ?? {});
  } catch {}
  return {};
}

export default defineConfig(async (env) => {
  const base = await loadBase(env);
  return mergeConfig(base, {
    plugins: [react()],
    envPrefix: "VITE_",
    build: {
      outDir: "dist",
      sourcemap: false,
      target: "es2020",
      cssCodeSplit: true,
      modulePreload: { polyfill: true },
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            return id.includes("node_modules") ? "vendor" : undefined;
          }
        }
      }
    },
    server: { port: 5173, strictPort: true },
    preview: { port: 4173, strictPort: true }
  });
});
