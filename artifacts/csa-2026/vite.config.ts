import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { copyFileSync, mkdirSync, readdirSync, existsSync } from "fs";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

function copyDirSync(src: string, dest: string) {
  if (!existsSync(src)) return;
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, name.name);
    const destPath = path.join(dest, name.name);
    if (name.isDirectory()) copyDirSync(srcPath, destPath);
    else copyFileSync(srcPath, destPath);
  }
}

const isBuild = process.argv.includes("build");

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : 3000;

const basePath = process.env.BASE_PATH || "/";

if (!isBuild && !rawPort) {
  // Only warn in dev; don't throw during build
  console.warn("PORT not set, defaulting to 3000");
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "copy-static",
      closeBundle() {
        const staticDir = path.resolve(import.meta.dirname, "static");
        const outDir = path.resolve(import.meta.dirname, "dist");
        copyDirSync(staticDir, outDir);
      },
    },
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined
      ? await (async () => {
          try {
            const [carto, banner] = await Promise.all([
              import("@replit/vite-plugin-cartographer"),
              import("@replit/vite-plugin-dev-banner"),
            ]);
            return [
              carto.cartographer({ root: path.resolve(import.meta.dirname, "..") }),
              banner.devBanner(),
            ];
          } catch {
            return [];
          }
        })()
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    publicDir: path.resolve(import.meta.dirname, "static"),
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.API_SERVER_PORT || 8080}`,
        changeOrigin: true,
      },
      "/uploads": {
        target: `http://localhost:${process.env.API_SERVER_PORT || 8080}`,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
