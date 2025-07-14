import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";
import zip from "vite-plugin-zip-pack";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        popup: "index.html",
        options: "options.html",
      },
    },
  },
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
  plugins: [
    react(),
    crx({ manifest }),
    zip({ outDir: "release", outFileName: "release.zip" }),
  ],
});
