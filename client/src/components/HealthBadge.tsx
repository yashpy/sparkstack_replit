import { useEffect, useState } from "react";
import { api } from "../api";
import type { Health } from "../types";

// Polls /api/health so the UI always reflects backend + DB liveness and which
// generation engine is active. Demonstrates the "observability" angle.
export function HealthBadge() {
  const [health, setHealth] = useState<Health | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const h = await api.health();
        if (alive) {
          setHealth(h);
          setFailed(false);
        }
      } catch {
        if (alive) setFailed(true);
      }
    };
    poll();
    const id = setInterval(poll, 10_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const ok = !failed && health?.status === "ok";
  const engine = health?.engine === "llm" ? "LLM" : "Template";

  return (
    <div className="health" title={failed ? "API unreachable" : `Uptime ${health?.uptimeSeconds ?? 0}s`}>
      <span className={`dot ${ok ? "ok" : "bad"}`} />
      <span>{failed ? "offline" : health ? "healthy" : "…"}</span>
      {health && (
        <span className="engine-tag">{engine} engine</span>
      )}
    </div>
  );
}
