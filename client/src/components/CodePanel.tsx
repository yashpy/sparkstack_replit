import { useState } from "react";

interface Props {
  code: string;
  onChange: (code: string) => void;
}

// Editable source view. Editing here immediately re-renders the preview,
// closing the generate → tweak → see-result loop by hand as well as via prompts.
export function CodePanel({ code, onChange }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked; ignore */
    }
  };

  const download = () => {
    const blob = new Blob([code], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sparkstack-app.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="codepanel">
      <div className="codepanel-toolbar">
        <span className="muted small">index.html · editable</span>
        <div className="codepanel-actions">
          <button className="ghost small" onClick={copy} disabled={!code}>
            {copied ? "Copied ✓" : "Copy"}
          </button>
          <button className="ghost small" onClick={download} disabled={!code}>
            Download
          </button>
        </div>
      </div>
      <textarea
        className="code-editor"
        spellCheck={false}
        value={code}
        placeholder="Generated code will appear here…"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
