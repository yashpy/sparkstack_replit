export type Engine = "llm" | "template";

export interface ProjectSummary {
  id: number;
  title: string;
  prompt: string;
  engine: Engine;
  created_at: string;
  updated_at: string;
}

export interface HistoryStep {
  kind: "create" | "refine";
  input: string;
  engine: Engine;
  at: string;
}

export interface Project extends ProjectSummary {
  code: string;
  history: HistoryStep[];
}

export interface GenerateResult {
  title: string;
  code: string;
  engine: Engine;
  note?: string;
}

export interface RefineResult {
  code: string;
  engine: Engine;
  note?: string;
}

export interface Health {
  status: "ok" | "degraded";
  uptimeSeconds: number;
  engine: Engine;
  timestamp: string;
}
