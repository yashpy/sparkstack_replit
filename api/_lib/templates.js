// Deterministic template engine.
//
// This is the offline fallback for the generator: it turns a natural-language
// prompt into a complete, self-contained single-file web app (HTML + inline CSS
// + vanilla JS) with no build step and no external requests, so it renders
// safely inside a sandboxed <iframe srcdoc>. It means Sparkstack produces a
// real, runnable app on the very first click — even with no API key configured.

/**
 * Wrap a body + script in a polished, consistent HTML shell.
 * Every generated app shares the same design language so previews look cohesive.
 */
function buildDoc({ title, accent = "#6d5efc", styles = "", body, script = "" }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
  :root { --accent: ${accent}; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    background: radial-gradient(1200px 600px at 10% -10%, #eef0ff, #f7f8fc 60%);
    color: #1b1b2b;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px 16px;
  }
  .app {
    width: 100%;
    max-width: 460px;
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 20px 50px rgba(40, 40, 90, 0.12);
    padding: 28px;
  }
  h1 { font-size: 1.5rem; margin: 0 0 4px; }
  .subtitle { color: #6b6b80; margin: 0 0 22px; font-size: 0.92rem; }
  button {
    cursor: pointer;
    border: none;
    border-radius: 10px;
    background: var(--accent);
    color: #fff;
    font-weight: 600;
    padding: 10px 16px;
    font-size: 0.95rem;
    transition: transform 0.05s ease, filter 0.15s ease;
  }
  button:hover { filter: brightness(1.05); }
  button:active { transform: translateY(1px); }
  input, textarea {
    font: inherit;
    padding: 10px 12px;
    border: 1px solid #dcdce8;
    border-radius: 10px;
    outline: none;
    width: 100%;
  }
  input:focus, textarea:focus { border-color: var(--accent); }
  ${styles}
</style>
</head>
<body>
  <div class="app">
    ${body}
  </div>
  <script>
  ${script}
  </script>
</body>
</html>`;
}

// --- Individual app templates ---------------------------------------------

function todoApp() {
  return buildDoc({
    title: "Todo List",
    accent: "#6d5efc",
    styles: `
      .row { display: flex; gap: 8px; margin-bottom: 16px; }
      ul { list-style: none; padding: 0; margin: 0; }
      li { display: flex; align-items: center; gap: 10px; padding: 10px 8px; border-bottom: 1px solid #f0f0f6; }
      li.done span { text-decoration: line-through; color: #a2a2b5; }
      li span { flex: 1; }
      .del { background: #ff5a7a; padding: 6px 10px; font-size: 0.8rem; }
      .empty { color: #9a9ab0; text-align: center; padding: 20px 0; }
    `,
    body: `
      <h1>✅ Todo List</h1>
      <p class="subtitle">Stays in your browser via localStorage.</p>
      <div class="row">
        <input id="field" placeholder="What needs doing?" />
        <button id="add">Add</button>
      </div>
      <ul id="list"></ul>
    `,
    script: `
      const KEY = "sparkstack.todos";
      let todos = JSON.parse(localStorage.getItem(KEY) || "[]");
      const list = document.getElementById("list");
      const field = document.getElementById("field");
      function save(){ localStorage.setItem(KEY, JSON.stringify(todos)); }
      function render(){
        list.innerHTML = "";
        if (!todos.length){ list.innerHTML = '<p class="empty">Nothing yet — add your first task!</p>'; return; }
        todos.forEach((t, i) => {
          const li = document.createElement("li");
          if (t.done) li.className = "done";
          const box = document.createElement("input");
          box.type = "checkbox"; box.checked = t.done; box.style.width = "18px";
          box.onchange = () => { todos[i].done = box.checked; save(); render(); };
          const span = document.createElement("span"); span.textContent = t.text;
          const del = document.createElement("button"); del.className = "del"; del.textContent = "Delete";
          del.onclick = () => { todos.splice(i,1); save(); render(); };
          li.append(box, span, del); list.appendChild(li);
        });
      }
      function add(){
        const v = field.value.trim(); if(!v) return;
        todos.push({ text: v, done: false }); field.value = ""; save(); render();
      }
      document.getElementById("add").onclick = add;
      field.addEventListener("keydown", e => { if(e.key === "Enter") add(); });
      render();
    `,
  });
}

function calculatorApp() {
  return buildDoc({
    title: "Calculator",
    accent: "#00b894",
    styles: `
      .screen { background:#0f1720; color:#fff; border-radius:12px; padding:18px; text-align:right; font-size:2rem; margin-bottom:14px; min-height:64px; word-break:break-all; }
      .grid { display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; }
      .grid button { background:#eef0f5; color:#1b1b2b; padding:18px 0; font-size:1.1rem; }
      .grid button.op { background:#e3fbef; color:#00976e; }
      .grid button.eq { background: var(--accent); color:#fff; grid-column: span 2; }
      .grid button.clr { background:#ffe3ea; color:#d63a5c; }
    `,
    body: `
      <h1>🧮 Calculator</h1>
      <p class="subtitle">Basic arithmetic, keyboard-friendly.</p>
      <div class="screen" id="screen">0</div>
      <div class="grid" id="pad"></div>
    `,
    script: `
      const screen = document.getElementById("screen");
      let expr = "";
      const keys = ["7","8","9","/","4","5","6","*","1","2","3","-","0",".","+"];
      const pad = document.getElementById("pad");
      keys.forEach(k => {
        const b = document.createElement("button");
        b.textContent = k;
        if ("/*-+".includes(k)) b.className = "op";
        b.onclick = () => press(k);
        pad.appendChild(b);
      });
      const clr = document.createElement("button"); clr.textContent="C"; clr.className="clr"; clr.onclick=()=>{expr="";update();};
      const eq = document.createElement("button"); eq.textContent="="; eq.className="eq"; eq.onclick=evaluate;
      pad.append(clr, eq);
      function update(){ screen.textContent = expr || "0"; }
      function press(k){ expr += k; update(); }
      function evaluate(){
        try { expr = String(Function("return (" + expr + ")")()); }
        catch { expr = "Error"; }
        update();
      }
      document.addEventListener("keydown", e => {
        if ("0123456789.+-*/".includes(e.key)) press(e.key);
        else if (e.key === "Enter" || e.key === "=") evaluate();
        else if (e.key === "Escape") { expr=""; update(); }
        else if (e.key === "Backspace") { expr = expr.slice(0,-1); update(); }
      });
      update();
    `,
  });
}

function pomodoroApp() {
  return buildDoc({
    title: "Pomodoro Timer",
    accent: "#ff7043",
    styles: `
      .clock { font-size: 4rem; font-weight: 700; text-align:center; font-variant-numeric: tabular-nums; margin: 10px 0 18px; }
      .controls { display:flex; gap:10px; justify-content:center; }
      .controls .ghost { background:#fff; color:var(--accent); border:1px solid var(--accent); }
      .modes { display:flex; gap:8px; justify-content:center; margin-bottom:8px; }
      .modes button { background:#f2f2f7; color:#555; font-size:0.8rem; padding:6px 12px; }
      .modes button.active { background:var(--accent); color:#fff; }
    `,
    body: `
      <h1>🍅 Pomodoro</h1>
      <p class="subtitle">Focus in 25-minute sprints.</p>
      <div class="modes">
        <button data-min="25" class="active">Focus</button>
        <button data-min="5">Short break</button>
        <button data-min="15">Long break</button>
      </div>
      <div class="clock" id="clock">25:00</div>
      <div class="controls">
        <button id="toggle">Start</button>
        <button id="reset" class="ghost">Reset</button>
      </div>
    `,
    script: `
      let total = 25*60, left = total, running = false, tick = null;
      const clock = document.getElementById("clock");
      const toggle = document.getElementById("toggle");
      function fmt(s){ const m=String(Math.floor(s/60)).padStart(2,"0"); const ss=String(s%60).padStart(2,"0"); return m+":"+ss; }
      function render(){ clock.textContent = fmt(left); }
      function start(){ running=true; toggle.textContent="Pause"; tick=setInterval(()=>{ if(left>0){left--; render();} else { stop(); alert("Time's up!"); } },1000); }
      function stop(){ running=false; toggle.textContent="Start"; clearInterval(tick); }
      toggle.onclick = () => running ? stop() : start();
      document.getElementById("reset").onclick = () => { stop(); left=total; render(); };
      document.querySelectorAll(".modes button").forEach(b => {
        b.onclick = () => {
          document.querySelectorAll(".modes button").forEach(x=>x.classList.remove("active"));
          b.classList.add("active");
          stop(); total = +b.dataset.min*60; left = total; render();
        };
      });
      render();
    `,
  });
}

function notesApp() {
  return buildDoc({
    title: "Quick Notes",
    accent: "#0984e3",
    styles: `
      textarea { min-height: 220px; resize: vertical; margin-bottom: 10px; }
      .status { font-size: 0.8rem; color: #8a8a9c; }
    `,
    body: `
      <h1>📝 Quick Notes</h1>
      <p class="subtitle">Auto-saves as you type.</p>
      <textarea id="pad" placeholder="Start writing..."></textarea>
      <div class="status" id="status">Saved</div>
    `,
    script: `
      const KEY = "sparkstack.notes";
      const pad = document.getElementById("pad");
      const status = document.getElementById("status");
      pad.value = localStorage.getItem(KEY) || "";
      let t;
      pad.addEventListener("input", () => {
        status.textContent = "Saving…";
        clearTimeout(t);
        t = setTimeout(() => {
          localStorage.setItem(KEY, pad.value);
          status.textContent = "Saved ✓ (" + pad.value.length + " chars)";
        }, 300);
      });
    `,
  });
}

function counterApp() {
  return buildDoc({
    title: "Counter",
    accent: "#e84393",
    styles: `
      .count { font-size: 5rem; font-weight: 800; text-align:center; margin: 10px 0 20px; color: var(--accent); }
      .controls { display:flex; gap:12px; justify-content:center; }
      .controls button { font-size: 1.4rem; width: 64px; height: 64px; border-radius: 50%; }
      .controls .reset { background:#f2f2f7; color:#555; font-size: 0.9rem; }
    `,
    body: `
      <h1>🔢 Counter</h1>
      <p class="subtitle">Tap to count. Persists across reloads.</p>
      <div class="count" id="count">0</div>
      <div class="controls">
        <button id="dec">−</button>
        <button class="reset" id="reset">reset</button>
        <button id="inc">+</button>
      </div>
    `,
    script: `
      const KEY = "sparkstack.counter";
      let n = +(localStorage.getItem(KEY) || 0);
      const el = document.getElementById("count");
      function render(){ el.textContent = n; localStorage.setItem(KEY, n); }
      document.getElementById("inc").onclick = () => { n++; render(); };
      document.getElementById("dec").onclick = () => { n--; render(); };
      document.getElementById("reset").onclick = () => { n=0; render(); };
      render();
    `,
  });
}

function landingApp(prompt) {
  const topic = prompt.replace(/landing|page|website|site|for|a|an|the/gi, "").trim() || "Your Idea";
  const headline = topic.charAt(0).toUpperCase() + topic.slice(1);
  return buildDoc({
    title: headline + " — Landing Page",
    accent: "#6c5ce7",
    styles: `
      .app { max-width: 620px; text-align: center; }
      .hero h1 { font-size: 2.2rem; margin-bottom: 10px; }
      .hero p { color:#5a5a70; font-size: 1.05rem; }
      .cta { margin: 22px 0; display:flex; gap:12px; justify-content:center; }
      .cta .ghost { background:#fff; color:var(--accent); border:1px solid var(--accent); }
      .features { display:grid; grid-template-columns: repeat(auto-fit, minmax(140px,1fr)); gap:14px; margin-top:26px; }
      .feature { background:#f6f5ff; border-radius:12px; padding:16px; }
      .feature h3 { margin:6px 0; font-size:1rem; }
      .feature p { font-size:0.85rem; color:#6b6b80; margin:0; }
    `,
    body: `
      <div class="hero">
        <h1>${headline}</h1>
        <p>The fastest way to bring your idea to life. Built in seconds with Sparkstack.</p>
      </div>
      <div class="cta">
        <button>Get started</button>
        <button class="ghost">Learn more</button>
      </div>
      <div class="features">
        <div class="feature"><div>⚡</div><h3>Fast</h3><p>Ships instantly.</p></div>
        <div class="feature"><div>🎨</div><h3>Beautiful</h3><p>Polished by default.</p></div>
        <div class="feature"><div>🔧</div><h3>Editable</h3><p>Tweak the code freely.</p></div>
      </div>
    `,
  });
}

function genericApp(prompt) {
  const safe = prompt ? prompt.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "your app";
  return buildDoc({
    title: "Sparkstack App",
    accent: "#6d5efc",
    styles: `
      .app { text-align:center; }
      .prompt { background:#f6f5ff; border-radius:10px; padding:12px 14px; margin:14px 0; color:#4b4b66; font-style:italic; }
      .clicker { font-size:2rem; margin:16px 0; }
    `,
    body: `
      <h1>✨ Your App</h1>
      <p class="subtitle">A starter scaffold generated from your prompt.</p>
      <div class="prompt">“${safe}”</div>
      <div class="clicker" id="out">Click the button 👇</div>
      <button id="go">Do something</button>
    `,
    script: `
      const msgs = ["🚀 Nice!", "🎉 Again!", "🔥 Keep going!", "💡 You got it!", "⭐ Awesome!"];
      let i = 0;
      document.getElementById("go").onclick = () => {
        document.getElementById("out").textContent = msgs[i % msgs.length];
        i++;
      };
    `,
  });
}

// --- Router ----------------------------------------------------------------

const MATCHERS = [
  { test: /\b(todo|task|checklist|to-do)\b/i, title: "Todo List", make: () => todoApp() },
  { test: /\b(calculator|calc|arithmetic)\b/i, title: "Calculator", make: () => calculatorApp() },
  { test: /\b(pomodoro|timer|countdown|stopwatch|clock)\b/i, title: "Pomodoro Timer", make: () => pomodoroApp() },
  { test: /\b(note|notes|memo|scratch)\b/i, title: "Quick Notes", make: () => notesApp() },
  { test: /\b(counter|tally|count|clicker)\b/i, title: "Counter", make: () => counterApp() },
  { test: /\b(landing|portfolio|website|homepage|marketing|site)\b/i, title: "Landing Page", make: (p) => landingApp(p) },
];

/**
 * Turn a prompt into { title, code } using keyword matching.
 */
export function templateFromPrompt(prompt) {
  const p = (prompt || "").trim();
  for (const m of MATCHERS) {
    if (m.test.test(p)) {
      return { title: m.title, code: m.make(p) };
    }
  }
  return { title: "Custom App", code: genericApp(p) };
}

/**
 * Best-effort refinement without an LLM. We apply a few deterministic CSS/text
 * transforms for common instructions; anything else regenerates from the
 * combined intent so the user always gets a coherent result.
 */
export function refineTemplate(currentCode, instruction, originalPrompt) {
  const i = (instruction || "").toLowerCase();
  let code = currentCode;
  let changed = false;

  if (/\bdark( mode)?\b/.test(i)) {
    code = code
      .replace(/background: radial-gradient\([^;]+;/, "background: #12121c;")
      .replace(/color: #1b1b2b;/, "color: #e8e8f2;")
      .replace(/background: #fff;/g, "background: #1e1e2e;")
      .replace(/border: 1px solid #dcdce8;/g, "border: 1px solid #3a3a52;");
    changed = true;
  }

  const colorMap = { red: "#e74c3c", green: "#00b894", blue: "#0984e3", purple: "#6c5ce7", orange: "#ff7043", pink: "#e84393", teal: "#009688" };
  for (const [name, hex] of Object.entries(colorMap)) {
    if (new RegExp("\\b" + name + "\\b").test(i)) {
      code = code.replace(/--accent: #[0-9a-fA-F]{6};/, `--accent: ${hex};`);
      changed = true;
      break;
    }
  }

  if (/\b(bigger|larger|large) (text|font)\b/.test(i)) {
    code = code.replace("body {", "body { font-size: 1.15rem;");
    changed = true;
  }

  if (changed) {
    return { code, note: "Applied local transform (no API key set — using template engine)." };
  }

  // Fall back to regenerating from combined intent.
  const combined = `${originalPrompt} ${instruction}`.trim();
  const regenerated = templateFromPrompt(combined);
  return {
    code: regenerated.code,
    note: "Regenerated from combined intent (template engine). Add OPENAI_API_KEY for freeform edits.",
  };
}
