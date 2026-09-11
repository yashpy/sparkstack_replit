interface Props {
  code: string;
}

// Renders the generated app in a sandboxed iframe. `sandbox="allow-scripts"`
// lets the app's JS run but withholds same-origin access, so generated code
// cannot touch Sparkstack's cookies, storage, or DOM — a safe preview boundary.
export function Preview({ code }: Props) {
  if (!code) {
    return (
      <div className="preview-empty">
        <div className="preview-empty-inner">
          <div className="big-emoji">🪄</div>
          <p>Your live app preview will appear here.</p>
          <p className="muted">Describe something above, or pick an example.</p>
        </div>
      </div>
    );
  }

  return (
    <iframe
      className="preview-frame"
      title="App preview"
      sandbox="allow-scripts allow-modals"
      srcDoc={code}
    />
  );
}
