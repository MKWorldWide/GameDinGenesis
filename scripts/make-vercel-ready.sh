#!/usr/bin/env bash
# scripts/make-vercel-ready.sh
set -euo pipefail

echo "▶ GameDinGenesis → Vercel-ready refactor"
ROOT="$(pwd)"

# --- pick package manager -----------------------------------------------------
if [[ -f pnpm-lock.yaml ]]; then
  PM="pnpm"; INSTALL="pnpm install"; RUN="pnpm run"
elif [[ -f yarn.lock ]]; then
  PM="yarn"; INSTALL="yarn install"; RUN="yarn"
else
  PM="npm"; INSTALL="npm install"; RUN="npm run"
fi
echo "• Using package manager: $PM"

mkdir -p "$ROOT/scripts"

# --- vercel.json (SPA routing + headers + output dir) -------------------------
cat > "$ROOT/vercel.json" <<'JSON'
{
  "version": 2,
  "framework": "vite",
  "outputDirectory": "dist",
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(.*)\\.(js|css|svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot|map)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    }
  ],
  "routes": [
    { "handle": "filesystem" },
    { "src": "/.*", "dest": "/index.html" }
  ]
}
JSON

# --- .vercelignore to keep deploys lean --------------------------------------
cat > "$ROOT/.vercelignore" <<'EOF'
node_modules
dist
coverage
.storybook
.vscode
.idea
*.log
*.local
*.swp
.DS_Store
tmp
EOF

# --- Node helper: patch package.json and write vite override ------------------
cat > "$ROOT/scripts/vercel-prepare.mjs" <<'JS'
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
JS

# --- run the helper, then install to sync lockfile ---------------------------------
node "$ROOT/scripts/vercel-prepare.mjs"

echo "• Installing deps to sync lockfile…"
$INSTALL >/dev/null

# --- optional: commit on a new branch so you can review -----------------------
if [ -d .git ]; then
  echo "• Creating git commit on branch chore/vercel-ready"
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || true
  git checkout -b chore/vercel-ready >/dev/null 2>&1 || true
  git add vercel.json .vercelignore scripts/vercel-prepare.mjs vite.config.vercel.ts package.json
  git commit -m "chore: make Vercel-ready (SPA fallback, headers, vite prod overrides)" >/dev/null 2>&1 || true
fi

echo ""
echo "✅ All set."
echo ""
echo "What changed:"
echo "  • vercel.json — configures SPA fallback, cache headers, output dir"
echo "  • .vercelignore — trims deploy size"
echo "  • package.json — standardized dev/build/preview scripts for Vercel"
echo "  • vite.config.vercel.ts — merges your existing config with safe prod tweaks"
echo "  • .env.example — reminder to use VITE_* envs"
echo ""
echo "Next steps:"
echo "  1) Locally test the prod build:   $RUN build && npx serve -s dist"
echo "  2) Link & deploy to Vercel:"
echo "       npx vercel link         # once per machine/repo"
echo "       $RUN build          # uses vite.config.vercel.ts"
echo "       npx vercel deploy --prebuilt"
