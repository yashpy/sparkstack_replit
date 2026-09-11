// Local development API server.
//
// In production the API runs as Vercel serverless functions in /api. For local
// dev we mount the exact same handlers on a tiny Express server so `npm run dev`
// behaves like production (Vite proxies /api here on port 3000).

import express from "express";
import { handleGenerate, handleRefine, handleHealth } from "./api/_lib/handlers.js";

const app = express();
app.use(express.json({ limit: "2mb" }));

app.all("/api/generate", (req, res) => handleGenerate(req, res));
app.all("/api/refine", (req, res) => handleRefine(req, res));
app.all("/api/health", (req, res) => handleHealth(req, res));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`  ⚡ Sparkstack dev API on http://localhost:${PORT} (Vite serves the UI on :5173)`);
});
