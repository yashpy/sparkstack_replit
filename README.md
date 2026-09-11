# ⚡ Sparkstack

**Describe an app in plain English → get a live, runnable, editable app → refine it with follow-up instructions → save it.**

Sparkstack is a miniature *agentic app builder* — a deliberate, small-scale echo of Replit's own core loop (natural language in, working software out), built as my submission for the **Software Engineer, New Grad (2027)** role.

![engine: template + LLM](https://img.shields.io/badge/engine-template%20%2B%20LLM-6d5efc) ![stack: React · Node · Serverless](https://img.shields.io/badge/stack-React%20%C2%B7%20Node%20%C2%B7%20Serverless-00b894) ![deploy: Vercel](https://img.shields.io/badge/deploy-Vercel-black)

---

## What it does

1. **Generate** — Type "a todo list app" (or a calculator, pomodoro timer, notes app, landing page…). Sparkstack returns a complete, self-contained single-file web app and renders it live.
2. **Preview** — The generated app runs immediately inside a sandboxed `<iframe>`.
3. **Edit** — Flip to the Code tab and edit the source; the preview updates.
4. **Refine** — Give follow-up instructions like *"make it dark mode"* or *"use a green accent"*. Sparkstack applies the change and keeps a history of every step.
5. **Save** — Persist projects (stored client-side) and reopen them from the sidebar.

---

## Why this project for this role

| What the JD asks for | Where you'll see it in this repo |
| --- | --- |
| **Agentic creation from natural language** | The whole product is a prompt → app loop with iterative refinement (`api/_lib/generator.js`, `client/src/App.tsx`). |
| **Full-stack: React, Node.js** | React 18 + TypeScript (Vite) client, Node serverless functions for the API. |
| **Focus on automation & self-healing** | The generator **degrades gracefully**: it uses an LLM when a key is present and a deterministic template engine otherwise, so `/api/generate` *never* returns an unusable result. |
| **Monitoring / observability** | A `/api/health` function reports uptime + active engine; the UI polls it and shows a live status badge. |
| **Communicating complex ideas** | This README + heavily commented, single-responsibility modules. |

---

## Architecture (serverless, Vercel-ready)

```
┌──────────────────────────────┐          ┌─────────────────────────────────┐
│  React + TypeScript (Vite)    │  fetch   │  Vercel serverless functions     │
│   → static site (client/dist) │ ───────▶ │   /api/generate                  │
│                               │          │   /api/refine                    │
│  • Prompt bar / refine bar    │          │   /api/health                    │
│  • Sandboxed iframe preview   │ ◀─────── │       │                          │
│  • Editable code panel        │  JSON    │       ▼                          │
│  • Saved projects (localStorage)         │   generator (LLM ⇄ template)     │
│  • Live health badge          │          └─────────────────────────────────┘
└──────────────────────────────┘
```

### Key design decisions

- **Stateless & serverless.** The API is pure functions (`/api/*`), and saved projects live in `localStorage`, so there's no server or database to provision — it deploys to Vercel with zero config. The persistence layer (`client/src/api.ts`) keeps an async interface so it can later be swapped for a hosted DB without touching the UI.
- **Graceful degradation over hard dependency.** `OPENAI_API_KEY` is *optional*. Without it, a keyword-routed template engine produces real, functional apps (todo, calculator, pomodoro, notes, counter, landing page). With it, the same endpoints generate freeform apps via `gpt-4o-mini`. If an LLM call fails or times out, the server logs it and falls back to templates instead of erroring — the "self-healing" principle applied to a code path.
- **Safe previews.** Generated apps render in an `<iframe sandbox="allow-scripts">` — their JS runs, but they can't reach Sparkstack's origin, storage, or cookies.
- **Self-contained output.** Every generated app is a single HTML file with inline CSS/JS and no external requests, so it's portable and safe to sandbox.

### Project layout

```
sparkstack/
├── api/                      # Vercel serverless functions (Node, ESM)
│   ├── generate.js
│   ├── refine.js
│   ├── health.js
│   └── _lib/
│       ├── handlers.js       # shared (req,res) handlers
│       ├── generator.js      # LLM vs. template orchestration + fallback
│       └── templates.js      # deterministic prompt → single-file app engine
├── client/                   # React + TS (Vite) → builds to client/dist
│   └── src/
│       ├── App.tsx           # the generate / refine / save loop
│       ├── api.ts            # typed fetch + localStorage project store
│       ├── types.ts
│       └── components/       # PromptBar, Preview, CodePanel, Sidebar, HealthBadge
├── dev-server.js             # local Express server that mounts the same handlers
├── vercel.json               # build + output config
└── package.json              # npm workspaces
```

---

## Deploy to Vercel (via GitHub)

1. Push this repo to GitHub (already done if you're reading this on GitHub).
2. Go to **vercel.com → Add New → Project → Import** this GitHub repo.
3. Vercel auto-detects `vercel.json`: build `npm run build`, output `client/dist`, functions in `/api`. Leave the defaults and click **Deploy**.
4. *(Optional)* Add an Environment Variable `OPENAI_API_KEY` to enable freeform LLM generation, then redeploy. Without it, the app runs on the offline template engine.

That's it — no database or server setup required.

## Run locally

```bash
# Node 18+ required
npm install
npm run dev      # Vite UI on http://localhost:5173, API on :3000 (proxied)
```

To just produce the static build: `npm run build` → `client/dist`.

### Optional configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | *(unset)* | Enables LLM generation; falls back to templates when unset |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model used for generation/refinement |

---

## API reference

| Method | Endpoint | Body | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | — | Status, uptime, active engine |
| `POST` | `/api/generate` | `{ prompt }` | Generate a new app → `{ title, code, engine, note? }` |
| `POST` | `/api/refine` | `{ code, instruction, prompt }` | Apply a change → `{ code, engine, note? }` |

Saved projects are managed client-side in `localStorage` (see `client/src/api.ts`).

---

## Known limitations & next steps

- The **template engine** covers a fixed set of app types; the LLM path handles arbitrary prompts. Next: expand template coverage and add structured validation of LLM output.
- **Persistence** is per-browser (localStorage). Swapping in a hosted DB (Vercel Postgres / KV) + user auth would make it multi-device and multi-user — the async `api.ts` interface is designed for exactly that swap.
- Previews are client-side static apps; running server-side languages would need the kind of sandboxed execution infrastructure Replit specializes in — a fun direction to grow this into.

---

Built by a 2027 new grad who wants to help make software creation accessible to everyone. 🚀
