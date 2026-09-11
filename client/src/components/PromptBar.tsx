import { useState } from "react";

const EXAMPLES = [
  "a todo list app",
  "a calculator",
  "a pomodoro timer",
  "a quick notes app",
  "a landing page for a coffee shop",
];

interface Props {
  onGenerate: (prompt: string) => void;
  busy: boolean;
}

export function PromptBar({ onGenerate, busy }: Props) {
  const [value, setValue] = useState("");

  const submit = () => {
    const v = value.trim();
    if (v && !busy) onGenerate(v);
  };

  return (
    <div className="promptbar">
      <div className="promptbar-row">
        <input
          value={value}
          disabled={busy}
          placeholder="Describe an app to build…  e.g. “a todo list with dark mode”"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button className="primary" onClick={submit} disabled={busy || !value.trim()}>
          {busy ? "Building…" : "Generate ✨"}
        </button>
      </div>
      <div className="examples">
        <span className="examples-label">Try:</span>
        {EXAMPLES.map((ex) => (
          <button key={ex} className="chip" disabled={busy} onClick={() => { setValue(ex); onGenerate(ex); }}>
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
