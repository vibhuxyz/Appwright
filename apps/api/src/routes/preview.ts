import {
  request as httpRequest,
  type IncomingHttpHeaders,
  type IncomingMessage,
  type OutgoingHttpHeaders,
} from "node:http";
import { prisma } from "@repo/db";
import { Router, type Request, type Response } from "express";
import {
  PREVIEW_COOKIE,
  allowFraming,
  cookieValue,
  injectInspector,
  isApiPath,
  isHtmlResponse,
} from "../preview";
import { startSessionDevServer } from "../workspace/manager";

export const previewRouter = Router();

function subpathFrom(params: { subpath?: string | string[] }): string {
  const raw = params.subpath;
  if (raw === undefined) return "/";
  const joined = Array.isArray(raw) ? raw.join("/") : raw;
  return joined.startsWith("/") ? joined : `/${joined}`;
}

function withQuery(pathname: string, originalUrl: string): string {
  const q = originalUrl.indexOf("?");
  return q === -1 ? pathname : `${pathname}${originalUrl.slice(q)}`;
}

function previewCookie(token: string): string {
  return `${PREVIEW_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
}

function outgoingHeaders(
  headers: IncomingHttpHeaders,
  token?: string,
): OutgoingHttpHeaders {
  const out = allowFraming({ ...headers });
  if (!token) return out;
  const extra = previewCookie(token);
  const existing = out["set-cookie"];
  const prior = Array.isArray(existing)
    ? existing.map(String)
    : existing === undefined
      ? []
      : [String(existing)];
  out["set-cookie"] = [...prior, extra];
  return out;
}

function wantsHtml(req: Request): boolean {
  return (req.headers.accept ?? "").includes("text/html");
}

function relayHtmlWithInspector(
  upstreamRes: IncomingMessage,
  res: Response,
  token?: string,
): void {
  const chunks: Buffer[] = [];
  upstreamRes.on("data", (chunk: Buffer) => chunks.push(chunk));
  upstreamRes.on("end", () => {
    const body = injectInspector(Buffer.concat(chunks).toString("utf8"));
    const headers = outgoingHeaders(upstreamRes.headers, token);
    delete headers["content-length"];
    delete headers["content-encoding"];
    delete headers["transfer-encoding"];
    headers["content-length"] = Buffer.byteLength(body, "utf8");
    res.writeHead(upstreamRes.statusCode ?? 502, headers);
    res.end(body);
  });
}

const PROXY_DEADLINE_MS = 90_000;

function isConnectionRefused(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error.code === "ECONNREFUSED" || error.code === "ECONNRESET")
  );
}

function proxyToDevServer(
  req: Request,
  res: Response,
  port: number,
  upstreamPath: string,
  token?: string,
  onRefused?: () => void,
): void {
  const requestHeaders = { ...req.headers, host: `127.0.0.1:${port}` };
  if (wantsHtml(req)) requestHeaders["accept-encoding"] = "identity";
  const deadline = new AbortController();
  const deadlineTimer = setTimeout(() => deadline.abort(), PROXY_DEADLINE_MS);
  const upstream = httpRequest(
    {
      host: "127.0.0.1",
      port,
      method: req.method,
      path: upstreamPath,
      headers: requestHeaders,
      signal: deadline.signal,
    },
    (upstreamRes: IncomingMessage) => {
      if (isHtmlResponse(upstreamRes.headers["content-type"])) {
        relayHtmlWithInspector(upstreamRes, res, token);
        return;
      }
      res.writeHead(
        upstreamRes.statusCode ?? 502,
        outgoingHeaders(upstreamRes.headers, token),
      );
      upstreamRes.pipe(res);
    },
  );
  upstream.on("close", () => clearTimeout(deadlineTimer));
  upstream.on("error", (error: unknown) => {
    if (res.headersSent) {
      res.end();
      return;
    }
    if (onRefused && isConnectionRefused(error)) {
      onRefused();
      return;
    }
    res.status(502).json({
      error: { code: "BAD_GATEWAY", message: "preview server unreachable" },
    });
  });
  req.pipe(upstream);
}

interface PreviewSession {
  id: string;
  projectId: string;
  devPort: number;
}

export async function sessionPort(token: string): Promise<number | null> {
  const session = await previewSession(token);
  return session?.devPort ?? null;
}

async function previewSession(token: string): Promise<PreviewSession | null> {
  const session = await prisma.session.findUnique({
    where: { previewToken: token },
    select: { id: true, projectId: true, devPort: true },
  });
  if (!session?.devPort) return null;
  return { id: session.id, projectId: session.projectId, devPort: session.devPort };
}

function servePreview(
  req: Request,
  res: Response,
  session: PreviewSession,
  upstreamPath: string,
  token?: string,
): void {
  const restart = () => {
    void startSessionDevServer(session.projectId, session.id)
      .then(async (devPort) => {
        await prisma.session.update({ where: { id: session.id }, data: { devPort } });
        proxyToDevServer(req, res, devPort, upstreamPath, token);
      })
      .catch(() => {
        if (!res.headersSent) {
          res.status(502).json({
            error: { code: "BAD_GATEWAY", message: "preview server unreachable" },
          });
        }
      });
  };
  const canRestart = req.method === "GET" || req.method === "HEAD";
  proxyToDevServer(req, res, session.devPort, upstreamPath, token, canRestart ? restart : undefined);
}

// Cookie catch-all: Next/Vite emit root-absolute `/_next/...` and `/@vite/...`
// from HTML served at `/preview/:token`. Those requests carry the cookie set
// on the HTML response, not the token in the path.
previewRouter.use(async (req, res, next) => {
  if (isApiPath(req.path)) {
    next();
    return;
  }
  const token = cookieValue(req.headers.cookie, PREVIEW_COOKIE);
  if (!token) {
    next();
    return;
  }
  const session = await previewSession(token);
  if (!session) {
    next();
    return;
  }
  servePreview(req, res, session, req.originalUrl);
});

previewRouter.use("/preview/:token{/*subpath}", async (req, res) => {
  const token = String(req.params.token ?? "");
  const session = await previewSession(token);
  if (!session) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "preview not found" } });
    return;
  }
  servePreview(req, res, session, withQuery(subpathFrom(req.params), req.originalUrl), token);
});
