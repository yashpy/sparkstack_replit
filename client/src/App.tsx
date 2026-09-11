import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import type { Engine, HistoryStep, ProjectSummary } from "./types";
import { Sidebar } from "./components/Sidebar";
import { PromptBar } from "./components/PromptBar";
import { Preview } from "./components/Preview";
import { CodePanel } from "./components/CodePanel";
import { HealthBadge } from "./components/HealthBadge";

type Tab = "preview" | "code";

export default function App() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);

  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [engine, setEngine] = useState<Engine>("template");
  const [history, setHistory] = useState<HistoryStep[]>([]);

  const [tab, setTab] = useState<Tab>("preview");
  const [busy, setBusy] = useState(false);
  const [refineText, setRefineText] = useState("");
  const [banner, setBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshProjects = useCallback(async () => {
    try {
      setProjects(await api.listProjects());
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    refreshProjects();
  }, [refreshProjects]);

  const notify = (msg: string | null) => {
    setBanner(msg);
    if (msg) setTimeout(() => setBanner(null), 4000);
  };

  const resetToNew = () => {
    setActiveId(null);
    setPrompt("");
    setTitle("");
    setCode("");
    setHistory([]);
    setRefineText("");
    setTab("preview");
    setError(null);
  };

  const handleGenerate = async (p: string) => {
    setBusy(true);
    setError(null);
    try {
      const result = await api.generate(p);
      setPrompt(p);
      setTitle(result.title);
      setCode(result.code);
      setEngine(result.engine);
      setHistory([{ kind: "create", input: p, engine: result.engine, at: new Date().toISOString() }]);
      setActiveId(null);
      setTab("preview");
      notify(result.note ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleRefine = async () => {
    const instruction = refineText.trim();
    if (!instruction || busy || !code) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api.refine(code, instruction, prompt);
      setCode(result.code);
      setEngine(result.engine);
      setHistory((h) => [
        ...h,
        { kind: "refine", input: instruction, engine: result.engine, at: new Date().toISOString() },
      ]);
      setRefineText("");
      setTab("preview");
      notify(result.note ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (!code || !prompt) return;
    setBusy(true);
    setError(null);
    try {
      if (activeId) {
        await api.updateProject(activeId, { title, prompt, code, engine, history });
        notify("Project updated ✓");
      } else {
        const created = await api.createProject({ title: title || "Untitled", prompt, code, engine, history });
        setActiveId(created.id);
        notify("Project saved ✓");
      }
      await refreshProjects();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleOpen = async (id: number) => {
    setBusy(true);
    setError(null);
    try {
      const project = await api.getProject(id);
      setActiveId(project.id);
      setPrompt(project.prompt);
      setTitle(project.title);
      setCode(project.code);
      setEngine(project.engine);
      setHistory(project.history ?? []);
      setTab("preview");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteProject(id);
      if (activeId === id) resetToNew();
      await refreshProjects();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const hasApp = Boolean(code);

  return (
    <div className="layout">
      <Sidebar
        projects={projects}
        activeId={activeId}
        onOpen={handleOpen}
        onDelete={handleDelete}
        onNew={resetToNew}
      />

      <main className="main">
        <header className="topbar">
          <div className="topbar-title">
            {hasApp ? (
              <input
                className="title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled app"
              />
            ) : (
              <span className="tagline">Describe an app in plain English — get a running app.</span>
            )}
          </div>
          <HealthBadge />
        </header>

        <PromptBar onGenerate={handleGenerate} busy={busy} />

        {error && <div className="banner error">{error}</div>}
        {banner && <div className="banner info">{banner}</div>}

        <div className="workspace">
          <div className="workspace-toolbar">
            <div className="tabs">
              <button className={tab === "preview" ? "active" : ""} onClick={() => setTab("preview")} disabled={!hasApp}>
                Preview
              </button>
              <button className={tab === "code" ? "active" : ""} onClick={() => setTab("code")} disabled={!hasApp}>
                Code
              </button>
            </div>
            <div className="workspace-actions">
              {hasApp && <span className="engine-pill">{engine === "llm" ? "🤖 LLM" : "🧩 template"}</span>}
              <button className="primary small" onClick={handleSave} disabled={!hasApp || busy}>
                {activeId ? "Update" : "Save"}
              </button>
            </div>
          </div>

          <div className="workspace-body">
            {tab === "preview" ? (
              <Preview code={code} />
            ) : (
              <CodePanel code={code} onChange={setCode} />
            )}
          </div>

          {hasApp && (
            <div className="refinebar">
              <input
                value={refineText}
                disabled={busy}
                placeholder='Refine it — e.g. “make it dark mode”, “use a green accent”, “bigger text”'
                onChange={(e) => setRefineText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRefine()}
              />
              <button className="primary" onClick={handleRefine} disabled={busy || !refineText.trim()}>
                {busy ? "Working…" : "Refine ↻"}
              </button>
            </div>
          )}

          {hasApp && history.length > 0 && (
            <div className="history">
              <span className="muted small">History:</span>
              {history.map((h, i) => (
                <span key={i} className="history-step" title={h.at}>
                  {h.kind === "create" ? "✨" : "↻"} {h.input}
                </span>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
