import { useEffect, useState, type CSSProperties } from "react";

const API = "http://localhost:4000";

type Message = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};
type ProjectFile = { path: string; content: string };
type ProjectSnapshot = {
  summary: string;
  messageHistory: Message[];
  files: ProjectFile[];
  updatedAt: string;
  previewUrl: string;
};

export default function App() {
  const [snapshot, setSnapshot] = useState<ProjectSnapshot | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<"gemini" | "openai">("gemini");

  useEffect(() => {
    fetch(`${API}/api/project`)
      .then((r) => r.json())
      .then(setSnapshot)
      .catch(() => setError("Cannot reach backend on :4000"));
  }, []);

  const send = async () => {
    const content = input.trim();
    if (!content || loading) return;
    setInput("");
    setLoading(true);
    setError(null);
    setSnapshot((s) =>
      s
        ? {
            ...s,
            messageHistory: [
              ...s.messageHistory,
              { role: "user", content, createdAt: new Date().toISOString() },
            ],
          }
        : s,
    );
    try {
      const res = await fetch(`${API}/api/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content, provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "request failed");
      setSnapshot(data);
    } catch (e: any) {
      setError(e?.message ?? "request failed");
    } finally {
      setLoading(false);
    }
  };

  const files = snapshot?.files ?? [];
  const current =
    files.find((f) => f.path === selected) ??
    files.find((f) => f.path === "src/App.tsx") ??
    files[0];

  return (
    <div style={S.app}>
      <aside style={S.chat}>
        <div style={S.header}>Devian</div>
        <div style={S.messages}>
          {(snapshot?.messageHistory ?? []).map((m, i) => (
            <div
              key={i}
              style={{
                ...S.msg,
                ...(m.role === "user" ? S.user : S.assistant),
              }}
            >
              <div style={S.role}>{m.role}</div>
              <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
            </div>
          ))}
          {loading && <div style={{ ...S.msg, ...S.assistant }}>building…</div>}
          {error && <div style={{ ...S.msg, ...S.errorMsg }}>{error}</div>}
        </div>
        <div style={S.inputRow}>
          <select
            style={S.select}
            value={provider}
            onChange={(e) => setProvider(e.target.value as "gemini" | "openai")}
            title="Model provider"
          >
            <option value="gemini">Gemini</option>
            <option value="openai">OpenAI</option>
          </select>
          <input
            style={S.input}
            value={input}
            placeholder="Build a todo app…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button style={S.send} onClick={send} disabled={loading}>
            {loading ? "…" : "Send"}
          </button>
        </div>
      </aside>

      <section style={S.filesPane}>
        <div style={S.header}>Files</div>
        <div style={S.fileList}>
          {files.map((f) => (
            <div
              key={f.path}
              onClick={() => setSelected(f.path)}
              style={{
                ...S.fileItem,
                ...(current?.path === f.path ? S.fileActive : {}),
              }}
            >
              {f.path}
            </div>
          ))}
        </div>
        <pre style={S.code}>{current?.content ?? ""}</pre>
      </section>

      <section style={S.previewPane}>
        <div style={S.header}>Preview · {snapshot?.previewUrl ?? ""}</div>
        {snapshot?.previewUrl ? (
          <iframe title="preview" src={snapshot.previewUrl} style={S.iframe} />
        ) : (
          <div style={{ padding: 16 }}>no preview</div>
        )}
      </section>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  app: {
    display: "grid",
    gridTemplateColumns: "320px 1fr 1fr",
    height: "100vh",
    fontFamily: "ui-sans-serif, system-ui",
    color: "#e5e7eb",
    background: "#0b0f17",
  },
  chat: {
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid #1f2937",
    minWidth: 0,
  },
  filesPane: {
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid #1f2937",
    minWidth: 0,
  },
  previewPane: { display: "flex", flexDirection: "column", minWidth: 0 },
  header: {
    padding: "12px 14px",
    fontWeight: 700,
    borderBottom: "1px solid #1f2937",
    background: "#0f1623",
    fontSize: 13,
    color: "#9ca3af",
  },
  messages: {
    flex: 1,
    overflow: "auto",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  msg: { padding: "8px 10px", borderRadius: 8, fontSize: 13, lineHeight: 1.4 },
  user: { background: "#1d4ed8", alignSelf: "flex-end", maxWidth: "85%" },
  assistant: {
    background: "#1f2937",
    alignSelf: "flex-start",
    maxWidth: "85%",
  },
  errorMsg: { background: "#7f1d1d", alignSelf: "stretch" },
  role: {
    fontSize: 10,
    textTransform: "uppercase",
    opacity: 0.6,
    marginBottom: 2,
  },
  inputRow: {
    display: "flex",
    gap: 6,
    padding: 10,
    borderTop: "1px solid #1f2937",
  },
  input: {
    flex: 1,
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #374151",
    background: "#111827",
    color: "#e5e7eb",
    outline: "none",
  },
  select: {
    padding: "8px 6px",
    borderRadius: 8,
    border: "1px solid #374151",
    background: "#111827",
    color: "#e5e7eb",
    cursor: "pointer",
  },
  send: {
    padding: "8px 14px",
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
  },
  fileList: {
    maxHeight: "32%",
    overflow: "auto",
    borderBottom: "1px solid #1f2937",
  },
  fileItem: {
    padding: "6px 14px",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "ui-monospace, monospace",
    color: "#9ca3af",
  },
  fileActive: { background: "#111827", color: "#e5e7eb" },
  code: {
    flex: 1,
    overflow: "auto",
    margin: 0,
    padding: 14,
    fontSize: 12,
    fontFamily: "ui-monospace, monospace",
    color: "#d1d5db",
    whiteSpace: "pre",
  },
  iframe: { flex: 1, border: "none", background: "white" },
};
