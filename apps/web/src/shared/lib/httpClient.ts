// Baked into the bundle at build time. A hardcoded localhost here means every
// visitor's browser calls *their own* machine, not your API — set
// VITE_API_URL to the same public origin as the API's PUBLIC_API_URL.
const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:3001").replace(
  /\/+$/,
  "",
);

const TOKEN_STORAGE_KEY = "appwright.token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else localStorage.removeItem(TOKEN_STORAGE_KEY);
}

function authHeaders(
  extra: Record<string, string> = {},
): Record<string, string> {
  const token = getToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

function messageFromErrorBody(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object" || !("error" in body)) return fallback;
  const error = body.error;
  if (typeof error === "string" && error.length > 0) return error;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
}

async function rejectIfBad(res: Response): Promise<void> {
  if (res.status === 401) {
    setToken(null);
    window.dispatchEvent(new Event("appwright:unauthorized"));
    throw new Error("Your session expired. Please sign in again.");
  }
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => ({}));
    throw new Error(messageFromErrorBody(body, res.statusText));
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  await rejectIfBad(res);
  return res.json();
}

function request(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: authHeaders(init.headers as Record<string, string> | undefined),
  });
}

// Centralized client every feature's api module goes through — one place to
// carry auth, base URL, and 401 handling. Never call fetch() directly.
//
// `signal` lets a caller wire in TanStack Query's per-queryFn AbortSignal, so
// a superseded request (fast file switching, rapid navigation) is actually
// cancelled on the wire instead of just having its result discarded.
export const httpClient = {
  get: <T>(path: string, signal?: AbortSignal) =>
    request(path, { signal }).then((r) => parseJson<T>(r)),
  post: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request(path, {
      method: "POST",
      headers: JSON_HEADERS,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    }).then((r) => parseJson<T>(r)),
  postMaybeStream: async (path: string, body?: unknown, signal?: AbortSignal) => {
    const res = await request(path, {
      method: "POST",
      headers: JSON_HEADERS,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
    await rejectIfBad(res);
    const type = res.headers.get("content-type") ?? "";
    if (type.includes("text/event-stream")) {
      await res.body?.cancel();
      return;
    }
    await res.json().catch(() => undefined);
  },
  // No Content-Type here on purpose — the browser sets the multipart
  // boundary itself when the body is a FormData; overriding it breaks parsing.
  postForm: <T>(path: string, formData: FormData, signal?: AbortSignal) =>
    request(path, { method: "POST", body: formData, signal }).then((r) => parseJson<T>(r)),
  put: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request(path, {
      method: "PUT",
      headers: JSON_HEADERS,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    }).then((r) => parseJson<T>(r)),
  delete: <T = void>(path: string, signal?: AbortSignal) =>
    request(path, { method: "DELETE", signal }).then((r) => parseJson<T>(r)),
  getBlob: async (path: string, signal?: AbortSignal): Promise<Blob | null> => {
    const res = await request(path, { signal });
    if (res.status === 404) return null;
    await rejectIfBad(res);
    return res.blob();
  },
  // EventSource cannot set headers, so the JWT rides as a query param here —
  // the API accepts it on stream routes only.
  streamUrl: (path: string) => {
    const sep = path.includes("?") ? "&" : "?";
    return `${API_BASE}${path}${sep}token=${encodeURIComponent(getToken() ?? "")}`;
  },
};
