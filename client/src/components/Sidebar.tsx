import type { ProjectSummary } from "../types";

interface Props {
  projects: ProjectSummary[];
  activeId: number | null;
  onOpen: (id: number) => void;
  onDelete: (id: number) => void;
  onNew: () => void;
}

export function Sidebar({ projects, activeId, onOpen, onDelete, onNew }: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="logo">⚡</span>
        <div>
          <div className="brand-name">Sparkstack</div>
          <div className="brand-tag">describe → build → refine</div>
        </div>
      </div>

      <button className="new-btn" onClick={onNew}>+ New app</button>

      <div className="saved-label">Saved projects</div>
      <div className="project-list">
        {projects.length === 0 && <p className="muted small pad">No saved projects yet.</p>}
        {projects.map((p) => (
          <div
            key={p.id}
            className={`project-item ${activeId === p.id ? "active" : ""}`}
            onClick={() => onOpen(p.id)}
          >
            <div className="project-info">
              <div className="project-title">{p.title}</div>
              <div className="project-sub muted small">{p.prompt}</div>
            </div>
            <button
              className="trash"
              title="Delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(p.id);
              }}
            >
              🗑
            </button>
          </div>
        ))}
      </div>

      <div className="sidebar-footer muted small">
        Built for the Replit new-grad submission.
      </div>
    </aside>
  );
}
