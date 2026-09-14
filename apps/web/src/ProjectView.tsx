import { useEffect, useRef, useState } from "react";
import {
  api,
  type Deployment,
  type Msg,
  type Project,
  type Session,
} from "./api";

function useProject(projectId: string): Project | null {
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      const p = await api.getProject(projectId);
      if (cancelled) return;
      setProject(p);
      if (!p.previewUrl) timer = setTimeout(poll, 1500);
    };
    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [projectId]);

  return project;
}

// Module-level, keyed by projectId — not component state — because React's
// dev-mode StrictMode double-invokes effects on mount. Two concurrent
// invocations would otherwise both see an empty session list and both
// create one: two sessions for one project load, and the UI ends up
// watching whichever one didn't get the prompt.
const sessionRequests = new Map<string, Promise<Session>>();

function getOrCreateSession(projectId: string): Promise<Session> {
  let inFlight = sessionRequests.get(projectId);
  if (!inFlight) {
    inFlight = api
      .listSessions(projectId)
      .then((sessions) => sessions[0] ?? api.createSession(projectId));
    sessionRequests.set(projectId, inFlight);
  }
  return inFlight;
}

export interface SessionUsage {
  cost: number;
  tokenIn: number;
  tokenOut: number;
}

function useSession(projectId: string) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOrCreateSession(projectId).then((existing) => {
      if (!cancelled) setSession(existing);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return [session, setSession] as const;
}

function useConversation(
  sessionId: string | undefined,
  onUsage?: (u: SessionUsage) => void,
) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [delta, setDelta] = useState("");
  const [running, setRunning] = useState(false);
  const lastSeq = useRef(-1);
  // Held in a ref so a new callback identity does not tear down and
  // re-open the EventSource on every parent render.
  const onUsageRef = useRef(onUsage);
  onUsageRef.current = onUsage;

  useEffect(() => {
    if (!sessionId) return;
    let source: EventSource | undefined;
    let cancelled = false;

    (async () => {
      const history = await api.getConversation(sessionId, -1);
      if (cancelled) return;
      setMessages(history);
      lastSeq.current = history.at(-1)?.seq ?? -1;

      source = new EventSource(api.streamUrl(sessionId, lastSeq.current));
      source.addEventListener("message", (e) => {
        const frame = JSON.parse((e as MessageEvent).data);
        setDelta("");
        setMessages((prev) => {
          if (prev.some((m) => m.seq === frame.message.seq)) return prev;
          lastSeq.current = Math.max(lastSeq.current, frame.message.seq);
          return [...prev, frame.message].sort((a, b) => a.seq - b.seq);
        });
        if (
          frame.message.role === "assistant" &&
          frame.message.type === "text"
        ) {
          setRunning(false);
        }
      });
      source.addEventListener("delta", (e) => {
        const frame = JSON.parse((e as MessageEvent).data);
        setDelta((d) => d + frame.delta);
      });
      // Server-authoritative totals, not a client-side sum. A tab that
      // joined mid-run never saw the earlier turns, so adding up what it
      // received would show a number lower than what was actually spent.
      source.addEventListener("usage", (e) => {
        const frame = JSON.parse((e as MessageEvent).data);
        onUsageRef.current?.({
          cost: frame.cost,
          tokenIn: frame.tokenIn,
          tokenOut: frame.tokenOut,
        });
      });
    })();

    return () => {
      cancelled = true;
      source?.close();
    };
  }, [sessionId]);

  const send = async (prompt: string) => {
    if (!sessionId) return;
    setRunning(true);
    await api.sendMessage(sessionId, prompt);
  };

  return { messages, delta, running, send };
}

const TERMINAL_STATES = new Set(["READY", "ERROR", "CANCELED"]);
const POLL_MS = 3000;

const host = (url: string) =>
  url.replace(/^https?:\/\//, "").replace(/\/$/, "");

function statusLabel(readyState: string): string {
  if (readyState === "READY") return "Live";
  if (readyState === "ERROR") return "Failed";
  if (readyState === "CANCELED") return "Canceled";
  return "Building…";
}

function DeployControl({ projectId }: { projectId: string }) {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [result, setResult] = useState<Deployment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getVercelStatus().then((r) => setConnected(r.connected));
  }, []);

  useEffect(() => {
    if (
      new URLSearchParams(window.location.hash.split("?")[1]).get("vercel") ===
      "connected"
    ) {
      setConnected(true);
    }
  }, []);

  // The OAuth flow finishes in the tab it opened in, not this one — recheck
  // status when the user tabs back here so "Connect" flips to "Deploy"
  // without a manual refresh.
  useEffect(() => {
    if (connected) return;
    const recheck = () =>
      api.getVercelStatus().then((r) => setConnected(r.connected));
    window.addEventListener("focus", recheck);
    return () => window.removeEventListener("focus", recheck);
  }, [connected]);

  // The server signs the userId into the OAuth state and hands back a URL;
  // we only navigate. Doing it as a plain link would send no auth header,
  // and the server would not know whose account is being connected.
  const connect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const { url } = await api.startVercelConnect(projectId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setConnecting(false);
    }
  };

  const deploy = async () => {
    setDeploying(true);
    setError(null);
    setResult(null);
    try {
      const r = await api.deploy(projectId);
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeploying(false);
    }
  };

  // The POST returns while Vercel is still building, so the first result is
  // always stale — and until the build finishes the production URL still
  // serves the *previous* app. Poll until it settles, then stop; a timer
  // left running would hit the API for the rest of the session.
  const deploymentId = result?.id;
  const readyState = result?.readyState;
  useEffect(() => {
    if (!deploymentId || !readyState || TERMINAL_STATES.has(readyState)) return;
    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const next = await api.getDeployment(projectId, deploymentId);
        if (!cancelled) setResult(next);
      } catch {
        // A failed poll is usually transient — the next tick retries rather
        // than tearing down a build the user can still see in Vercel.
      }
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [projectId, deploymentId, readyState]);

  if (connected === null) return null;

  if (!connected) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={connect}
          disabled={connecting}
          className="rounded bg-white px-3 py-1 text-xs font-medium text-black hover:bg-zinc-200 disabled:opacity-50"
        >
          {connecting ? "Opening…" : "Connect Vercel"}
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={deploy}
        disabled={deploying}
        className="rounded bg-white px-3 py-1 text-xs font-medium text-black hover:bg-zinc-200 disabled:opacity-50"
      >
        {deploying ? "Deploying…" : "Deploy"}
      </button>
      {result && (
        <div className="flex items-center gap-2 text-xs">
          <span
            className={
              result.readyState === "READY" ? "text-green-400" : "text-zinc-400"
            }
          >
            {statusLabel(result.readyState)}
          </span>
          {/* Two links, because they answer two questions. The alias is the
              address to share — it never changes. The deployment URL is this
              one build, and it is the only one worth watching while the
              build runs, since the alias still serves the old app. */}
          {result.aliasUrl && (
            <a
              href={result.aliasUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Production URL — the same for every deploy"
              className={
                result.readyState === "READY"
                  ? "text-blue-400 underline"
                  : "text-zinc-500 underline"
              }
            >
              {host(result.aliasUrl)}
            </a>
          )}
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`This build only — ${host(result.url)}`}
            className="text-zinc-500 underline"
          >
            this build
          </a>
          {result.errorMessage && (
            <span className="text-red-400">{result.errorMessage}</span>
          )}
        </div>
      )}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

function ToolCallRow({ call, response }: { call: Msg; response?: Msg }) {
  const [open, setOpen] = useState(false);
  const failed = response?.content.startsWith("Error:");

  return (
    <div className="rounded border border-zinc-800 bg-zinc-900 text-xs">
      <button
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span>{failed ? "✗" : response ? "✓" : "●"}</span>
        <span className="font-mono">{call.content}</span>
        <span className="ml-auto text-zinc-500">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="max-h-64 overflow-y-auto border-t border-zinc-800 px-3 py-2 font-mono whitespace-pre-wrap text-zinc-400">
          {JSON.stringify(call.data?.args, null, 2)}
          {response && (
            <div className="mt-2 border-t border-zinc-800 pt-2">
              {response.content}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChatPane({
  messages,
  delta,
  running,
  onSend,
}: {
  messages: Msg[];
  delta: string;
  running: boolean;
  onSend: (prompt: string) => void;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, delta]);

  const responsesByCallId = new Map(
    messages
      .filter((m) => m.type === "toolResponse")
      .map((m) => [m.data?.toolCallId, m]),
  );

  const submit = () => {
    if (!input.trim() || running) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col border-r border-zinc-800">
      <div className="flex-1 overflow-auto p-3 flex flex-col gap-2">
        {messages
          .filter((m) => m.type !== "toolResponse")
          .map((m) =>
            m.type === "toolCall" ? (
              <ToolCallRow
                key={m.id}
                call={m}
                response={responsesByCallId.get(m.data?.toolCallId)}
              />
            ) : (
              <div
                key={m.id}
                className={`max-w-[85%] rounded px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "self-end bg-blue-700"
                    : "self-start bg-zinc-800"
                }`}
              >
                {m.content}
              </div>
            ),
          )}
        {delta && (
          <div className="max-w-[85%] self-start whitespace-pre-wrap rounded bg-zinc-800 px-3 py-2 text-sm">
            {delta}
          </div>
        )}
        {running && !delta && (
          <div className="text-xs text-zinc-500">working…</div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 border-t border-zinc-800 p-2">
        <input
          className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none"
          placeholder="Ask the agent to change something…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button
          className="rounded bg-blue-600 px-3 py-2 text-sm font-medium disabled:opacity-50"
          onClick={submit}
          disabled={running}
        >
          Send
        </button>
      </div>
    </div>
  );
}

function FilesPane({
  projectId,
  touched,
}: {
  projectId: string;
  touched: Set<string>;
}) {
  const [paths, setPaths] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState("");

  useEffect(() => {
    api.listFiles(projectId).then((r) => setPaths(r.paths));
  }, [projectId, touched.size]);

  useEffect(() => {
    if (!selected) return;
    api.readFile(projectId, selected).then((r) => setContent(r.content));
  }, [projectId, selected]);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col border-r border-zinc-800">
      <div className="max-h-[35%] overflow-auto border-b border-zinc-800">
        {paths.map((p) => (
          <div
            key={p}
            onClick={() => setSelected(p)}
            className={`cursor-pointer px-3 py-1 font-mono text-xs ${
              selected === p ? "bg-zinc-800 text-zinc-100" : "text-zinc-400"
            }`}
          >
            {touched.has(p) && <span className="mr-1 text-amber-400">●</span>}
            {p}
          </div>
        ))}
      </div>
      <pre className="flex-1 overflow-auto whitespace-pre p-3 font-mono text-xs text-zinc-300">
        {content}
      </pre>
    </div>
  );
}

function PreviewPane({ project }: { project: Project | null }) {
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2 text-xs text-zinc-400">
        <span>{project?.previewUrl ?? "starting dev server…"}</span>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          disabled={!project?.previewUrl}
        >
          ⟳
        </button>
      </div>
      {project?.previewUrl ? (
        <iframe
          key={reloadKey}
          title="preview"
          src={project.previewUrl}
          className="flex-1 bg-white"
        />
      ) : (
        <div className="flex-1 p-4 text-sm text-zinc-500">
          preview not ready yet
        </div>
      )}
    </div>
  );
}

export function ProjectView({ projectId }: { projectId: string }) {
  const project = useProject(projectId);
  const [session, setSession] = useSession(projectId);
  const { messages, delta, running, send } = useConversation(
    session?.id,
    (usage) => setSession((prev) => (prev ? { ...prev, ...usage } : prev)),
  );

  const touched = new Set(
    messages
      .filter(
        (m) =>
          m.type === "toolCall" &&
          (m.data?.toolName === "write_file" ||
            m.data?.toolName === "edit_file"),
      )
      .map((m) => String(m.data?.args?.path)),
  );

  return (
    <div className="flex h-screen flex-col text-zinc-100">
      <div className="flex items-center gap-4 border-b border-zinc-800 px-4 py-2 text-sm">
        <a href="#/" className="text-zinc-400 hover:text-zinc-200">
          ← Projects
        </a>
        <span className="font-medium">{project?.name ?? projectId}</span>
        <DeployControl projectId={projectId} />
        {session && (
          <span className="ml-auto flex items-center gap-4 text-xs text-zinc-400">
            <select
              className="bg-zinc-800 text-zinc-300 border border-zinc-700 rounded px-2 py-1 outline-none cursor-pointer"
              value={session.model}
              onChange={async (e) => {
                const newModel = e.target.value;
                setSession({ ...session, model: newModel });
                await api.updateSessionModel(session.id, newModel);
              }}
              disabled={running}
            >
              <optgroup label="OpenAI">
                <option value="gpt-5.4-mini">gpt-5.4-mini — default</option>
                <option value="gpt-5.4">gpt-5.4</option>
                <option value="gpt-5.2-codex">gpt-5.2-codex</option>
              </optgroup>
              <optgroup label="Gemini">
                <option value="gemini-3.7-flash">gemini-3.7-flash</option>
                <option value="gemini-3.1-pro-preview">gemini-3.1-pro</option>
              </optgroup>
              <optgroup label="Groq — free, fast, for iterating">
                <option value="openai/gpt-oss-120b">gpt-oss-120b</option>
                <option value="openai/gpt-oss-20b">gpt-oss-20b</option>
                <option value="llama-3.3-70b-versatile">llama-3.3-70b</option>
              </optgroup>
              <option value="grok-beta">grok-beta (xAI)</option>
              <option value="llama3-groq-70b-8192-tool-use-preview">
                llama3-70b (Groq)
              </option>
            </select>
            <span>${session.cost.toFixed(4)}</span>
            <span>
              {session.tokenIn}↑ {session.tokenOut}↓
            </span>
          </span>
        )}
      </div>
      <div className="grid flex-1 grid-cols-3 overflow-hidden">
        <ChatPane
          messages={messages}
          delta={delta}
          running={running}
          onSend={send}
        />
        <FilesPane projectId={projectId} touched={touched} />
        <PreviewPane project={project} />
      </div>
    </div>
  );
}
