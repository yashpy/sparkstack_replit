import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In dev, Vite serves the client on :5173 and proxies API calls to the Express
// server on :3000. In production, the Express server serves the built assets
// from client/dist directly, so no proxy is needed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
