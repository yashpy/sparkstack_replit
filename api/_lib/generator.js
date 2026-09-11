// The generation engine.
//
// Design goal (maps to the JD's "self-healing / automation" value): the code
// path degrades gracefully. If OPENAI_API_KEY is present we generate freeform
// apps with an LLM; otherwise we fall back to the deterministic template engine.
// Either way the caller always gets a valid, runnable single-file app back —
// there is no configuration in which /api/generate returns an unusable result.

import { templateFromPrompt, refineTemplate } from "./templates.js";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const TIMEOUT_MS = 30_000;

export function llmEnabled() {
  return Boolean(process.env.OPENAI_API_KEY);
}

const SYSTEM_PROMPT = `You are a code generator that outputs a SINGLE, self-contained HTML document.
Rules:
- Return ONLY the raw HTML. No markdown fences, no commentary.
- Everything (CSS in <style>, JS in <script>) must be inline in one file.
- No external network requests, no CDNs, no imports. It must run offline inside a sandboxed iframe.
- Make it visually polished, responsive, and fully functional.
- Use localStorage for any persistence.`;

async function callOpenAI(messages) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model: MODEL, temperature: 0.7, messages }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`OpenAI ${res.status}: ${detail.slice(0, 200)}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || "";
  } finally {
    clearTimeout(timer);
  }
}

// Strip accidental markdown fences the model may add despite instructions.
function stripFences(text) {
  return text
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function deriveTitle(prompt) {
  const words = (prompt || "app").trim().split(/\s+/).slice(0, 5).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Create a new app from a prompt.
 * @returns {Promise<{title:string, code:string, engine:string, note?:string}>}
 */
export async function generate(prompt) {
  const cleanPrompt = (prompt || "").trim();
  if (!cleanPrompt) throw new Error("Prompt is required.");

  if (llmEnabled()) {
    try {
      const raw = await callOpenAI([
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Build this as a single HTML file: ${cleanPrompt}` },
      ]);
      const code = stripFences(raw);
      if (code.toLowerCase().includes("<html")) {
        return { title: deriveTitle(cleanPrompt), code, engine: "llm" };
      }
      // Model returned something unusable — fall through to templates.
    } catch (err) {
      // Self-healing: log and degrade to the template engine instead of failing.
      console.warn("[generator] LLM generate failed, using template engine:", err.message);
    }
  }

  const t = templateFromPrompt(cleanPrompt);
  return {
    title: t.title,
    code: t.code,
    engine: "template",
    note: llmEnabled() ? "LLM unavailable — served a template." : undefined,
  };
}

/**
 * Refine an existing app given the current code and an instruction.
 */
export async function refine(currentCode, instruction, originalPrompt = "") {
  const clean = (instruction || "").trim();
  if (!clean) throw new Error("Instruction is required.");
  if (!currentCode) throw new Error("No current code to refine.");

  if (llmEnabled()) {
    try {
      const raw = await callOpenAI([
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content:
            `Here is the current single-file app:\n\n${currentCode}\n\n` +
            `Apply this change and return the full updated HTML file: ${clean}`,
        },
      ]);
      const code = stripFences(raw);
      if (code.toLowerCase().includes("<html")) {
        return { code, engine: "llm" };
      }
    } catch (err) {
      console.warn("[generator] LLM refine failed, using template engine:", err.message);
    }
  }

  const { code, note } = refineTemplate(currentCode, clean, originalPrompt);
  return { code, engine: "template", note };
}
