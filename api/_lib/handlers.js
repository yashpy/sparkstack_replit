// Request handlers shared by the Vercel serverless functions.
//
// Each handler uses only (req, res) with res.status().json(), which is
// compatible with both Vercel's Node runtime and Express — so the exact same
// logic powers production (Vercel functions in /api) and the local dev server.

import { generate, refine, llmEnabled } from "./generator.js";

const START_TIME = Date.now();

function readBody(req) {
  // Vercel and Express both populate req.body for JSON requests.
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

export async function handleGenerate(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  const { prompt } = readBody(req);
  if (!prompt || !String(prompt).trim()) {
    return res.status(400).json({ error: "A 'prompt' is required." });
  }
  try {
    const result = await generate(prompt);
    return res.status(200).json(result);
  } catch (err) {
    console.error("[generate]", err);
    return res.status(500).json({ error: err.message || "Generation failed." });
  }
}

export async function handleRefine(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });
  const { code, instruction, prompt } = readBody(req);
  if (!code) return res.status(400).json({ error: "'code' is required." });
  if (!instruction || !String(instruction).trim()) {
    return res.status(400).json({ error: "An 'instruction' is required." });
  }
  try {
    const result = await refine(code, instruction, prompt || "");
    return res.status(200).json(result);
  } catch (err) {
    console.error("[refine]", err);
    return res.status(500).json({ error: err.message || "Refine failed." });
  }
}

export function handleHealth(req, res) {
  return res.status(200).json({
    status: "ok",
    uptimeSeconds: Math.round((Date.now() - START_TIME) / 1000),
    engine: llmEnabled() ? "llm" : "template",
    timestamp: new Date().toISOString(),
  });
}
