import type {
  GenerateResult,
  Health,
  Project,
  ProjectSummary,
  RefineResult,
  HistoryStep,
} from "./types";

// --- Networked calls (Vercel serverless functions under /api) --------------

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore non-JSON error bodies */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// --- Client-side project store ---------------------------------------------
//
// Vercel functions are stateless with no persistent filesystem, so saved
// projects live in localStorage. This keeps the app fully serverless and
// zero-config to deploy — no database to provision. The store is namespaced
// and the API surface stays async so it could later be swapped for a hosted
// DB (e.g. Postgres/Redis) without touching the UI.

const STORE_KEY = "sparkstack.projects";
const now = () => new Date().toISOString();

function readStore(): Project[] {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeStore(projects: Project[]) {
  localStorage.setItem(STORE_KEY, JSON.stringify(projects));
}

function nextId(projects: Project[]): number {
  return projects.reduce((max, p) => Math.max(max, p.id), 0) + 1;
}

function toSummary(p: Project): ProjectSummary {
  const { id, title, prompt, engine, created_at, updated_at } = p;
  return { id, title, prompt, engine, created_at, updated_at };
}

export const api = {
  health: () => request<Health>("/api/health"),

  generate: (prompt: string) =>
    request<GenerateResult>("/api/generate", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),

  refine: (code: string, instruction: string, prompt: string) =>
    request<RefineResult>("/api/refine", {
      method: "POST",
      body: JSON.stringify({ code, instruction, prompt }),
    }),

  async listProjects(): Promise<ProjectSummary[]> {
    return readStore()
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .map(toSummary);
  },

  async getProject(id: number): Promise<Project> {
    const project = readStore().find((p) => p.id === id);
    if (!project) throw new Error("Not found.");
    return project;
  },

  async createProject(data: {
    title: string;
    prompt: string;
    code: string;
    engine: string;
    history: HistoryStep[];
  }): Promise<Project> {
    const projects = readStore();
    const ts = now();
    const project: Project = {
      id: nextId(projects),
      title: data.title,
      prompt: data.prompt,
      code: data.code,
      engine: data.engine as Project["engine"],
      history: data.history,
      created_at: ts,
      updated_at: ts,
    };
    projects.push(project);
    writeStore(projects);
    return project;
  },

  async updateProject(
    id: number,
    data: Partial<{ title: string; prompt: string; code: string; engine: string; history: HistoryStep[] }>,
  ): Promise<Project> {
    const projects = readStore();
    const idx = projects.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Not found.");
    projects[idx] = {
      ...projects[idx],
      ...data,
      engine: (data.engine as Project["engine"]) ?? projects[idx].engine,
      updated_at: now(),
    };
    writeStore(projects);
    return projects[idx];
  },

  async deleteProject(id: number): Promise<void> {
    writeStore(readStore().filter((p) => p.id !== id));
  },
};
