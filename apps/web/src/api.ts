// Baked into the bundle at build time. A hardcoded localhost here means
// every visitor's browser calls *their own* machine, not your API — set
// VITE_API_URL to the same public origin as the API's PUBLIC_API_URL.
const API = (import.meta.env.VITE_API_URL ?? "http://localhost:3001").replace(
  /\/+$/,
  "",
);

export type ProjectStatus = "PROVISIONING" | "BUILDING" | "READY" | "ERROR";
export type SessionStatus = "IDLE" | "RUNNING" | "ERROR";

export interface Project {
  id: string;
  name: string;
  templateId: string;
  status: ProjectStatus;
  previewUrl: string | null;
  createdAt: string;
}

export interface Session {
  id: string;
  projectId: string;
  title: string | null;
  model: string;
  cost: number;
  tokenIn: number;
  tokenOut: number;
  status: SessionStatus;
  createdAt: string;
}

export interface Msg {
  id: string;
  seq: number;
  role: string;
  type: "text" | "toolCall" | "toolResponse";
  content: string;
  data: {
    toolCallId?: string;
    toolName?: string;
    args?: Record<string, unknown>;
  } | null;
  createdAt: string;
}

// `url` is this one build, frozen forever. `aliasUrl` is the project's
// production address and only points here once readyState is READY.
export interface Deployment {
  id: string;
  url: string;
  aliasUrl: string | null;
  readyState: string;
  errorMessage?: string | null;
}

export interface User {
  id: string;
  email: string;
}

const TOKEN_STORAGE_KEY = "appwright.token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(TOKEN_STORAGE_KEY);
}

// Every call goes through here so the header cannot be forgotten on a new
// endpoint. A 401 means the token is gone or expired — clear it and let the
// app fall back to the login screen rather than showing a broken page.
function authHeaders(
  extra: Record<string, string> = {},
): Record<string, string> {
  const token = getToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

function request(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${API}${path}`, {
    ...init,
    headers: authHeaders(init.headers as Record<string, string> | undefined),
  });
}

async function json<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    setToken(null);
    window.dispatchEvent(new Event("appwright:unauthorized"));
    throw new Error("Your session expired. Please sign in again.");
  }
  if (!res.ok)
    throw new Error(
      (await res.json().catch(() => ({}))).error ?? res.statusText,
    );
  return res.json();
}

export const api = {
  register: (email: string, password: string) =>
    request("/auth/register", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ email, password }),
    }).then((r) => json<{ token: string; user: User }>(r)),
  login: (email: string, password: string) =>
    request("/auth/login", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ email, password }),
    }).then((r) => json<{ token: string; user: User }>(r)),
  me: () => request("/auth/me").then((r) => json<User>(r)),

  listProjects: () => request("/projects").then((r) => json<Project[]>(r)),
  getProject: (id: string) =>
    request(`/project/${id}`).then((r) => json<Project>(r)),
  createProject: (name: string, templateId: string = "vite-react") =>
    request("/project", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ name, templateId }),
    }).then((r) => json<Project>(r)),
  deleteProject: (id: string) =>
    request(`/project/${id}`, { method: "DELETE" }),

  listSessions: (projectId: string) =>
    request(`/project/${projectId}/sessions`).then((r) => json<Session[]>(r)),
  createSession: (projectId: string, title?: string) =>
    request(`/project/${projectId}/session`, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ title }),
    }).then((r) => json<Session>(r)),
  getSession: (id: string) =>
    request(`/session/${id}`).then((r) => json<Session>(r)),
  updateSessionModel: (id: string, model: string) =>
    request(`/session/${id}`, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: JSON.stringify({ model }),
    }).then((r) => json<Session>(r)),

  getConversation: (sessionId: string, afterSeq = -1) =>
    request(`/conversations/${sessionId}?afterSeq=${afterSeq}`).then((r) =>
      json<Msg[]>(r),
    ),
  sendMessage: (sessionId: string, prompt: string) =>
    request("/conversation", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({ sessionId, prompt }),
    }),
  // EventSource cannot set headers, so the JWT rides as a query param here
  // and the API accepts it on this route only.
  streamUrl: (sessionId: string, afterSeq: number) =>
    `${API}/stream/${sessionId}?afterSeq=${afterSeq}&token=${encodeURIComponent(getToken() ?? "")}`,

  // Connection status is per user now, not per project — one connect covers
  // every app they ever create.
  getVercelStatus: () =>
    request("/vercel/status").then((r) =>
      json<{
        connected: boolean;
        teamId: string | null;
        connectedAt: string | null;
      }>(r),
    ),
  // A POST that returns the URL, rather than an <a href> to a redirect: a
  // top-level navigation carries no Authorization header, so the server
  // would not know which user is connecting.
  startVercelConnect: (projectId: string) =>
    request(`/project/${projectId}/vercel/connect`, { method: "POST" }).then(
      (r) => json<{ url: string }>(r),
    ),
  disconnectVercel: () => request("/vercel/connection", { method: "DELETE" }),
  deploy: (projectId: string) =>
    request(`/project/${projectId}/deploy`, { method: "POST" }).then((r) =>
      json<Deployment>(r),
    ),
  getDeployment: (projectId: string, deploymentId: string) =>
    request(`/project/${projectId}/deployment/${deploymentId}`).then((r) =>
      json<Deployment>(r),
    ),

  listFiles: (projectId: string) =>
    request(`/files/${projectId}`).then((r) => json<{ paths: string[] }>(r)),
  readFile: (projectId: string, path: string) =>
    request(
      `/files/${projectId}/content?path=${encodeURIComponent(path)}`,
    ).then((r) => json<{ path: string; content: string }>(r)),
};
