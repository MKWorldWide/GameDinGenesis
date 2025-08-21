import fs from "node:fs";
import path from "node:path";

const pkgPath = path.resolve("package.json");
if (!fs.existsSync(pkgPath)) {
  console.error("package.json not found. run this in your project root.");
  process.exit(1);
}
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

pkg.scripts = pkg.scripts ?? {};
// keep existing dev/preview if present; force a vercel-aware build that uses override config
pkg.scripts.dev = pkg.scripts.dev ?? "vite";
pkg.scripts.preview = pkg.scripts.preview ?? "vite preview --port 4173";
pkg.scripts.build = "vite build --config vite.config.vercel.ts";

pkg.engines = pkg.engines ?? {};
pkg.engines.node = pkg.engines.node ?? ">=18.18.0";

pkg.type = pkg.type ?? "module";

// ensure vite is present (don't pin other deps to avoid collisions)
pkg.devDependencies = pkg.devDependencies ?? {};
if (!pkg.devDependencies.vite) pkg.devDependencies.vite = "^5.4.0";

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log("✓ package.json scripts/engines updated");

// Write a Vite override config that *merges* your existing config
const viteConfig = `// vite.config.vercel.ts
import { defineConfig, mergeConfig, type UserConfigExport } from "vite";

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
    // IMPORTANT: don't re-add plugins here; we only tighten prod build for Vercel
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
          // one big vendor chunk keeps cold-starts quick on serverless CDNs
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
`;
fs.writeFileSync("vite.config.vercel.ts", viteConfig);

if (!fs.existsSync(".env.example")) {
  fs.writeFileSync(
    ".env.example",
    `# Vercel exposes only VITE_* to the client. Set these in Vercel → Project Settings → Environment Variables
VITE_APP_ENV=production
# VITE_GEMINI_API_KEY=...
`
  );
}

console.log("✓ wrote vite.config.vercel.ts and .env.example");
