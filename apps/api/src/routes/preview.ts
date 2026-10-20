import {
  request as httpRequest,
  type IncomingHttpHeaders,
  type IncomingMessage,
  type OutgoingHttpHeaders,
} from "node:http";
import { prisma } from "@repo/db";
import { Router, type Request, type Response } from "express";
import { injectInspector, isHtmlResponse } from "../preview";

export const previewRouter = Router();

const PREVIEW_COOKIE = "aw_preview";
const API_PREFIXES = [
  "/auth",
  "/health",
  "/session",
  "/project",
  "/projects",
  "/conversation",
  "/conversations",
  "/stream",
  "/models",
  "/files",
  "/vercel",
  "/prompt",
  "/approval",
  "/user",
  "/preview",
];

function isApiPath(pathname: string): boolean {
  return API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function cookieValue(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

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
  const out: OutgoingHttpHeaders = { ...headers };
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
    headers["content-length"] = Buffer.byteLength(body, "utf8");
    res.writeHead(upstreamRes.statusCode ?? 502, headers);
    res.end(body);
  });
}

function proxyToDevServer(
  req: Request,
  res: Response,
  port: number,
  upstreamPath: string,
  token?: string,
): void {
  const requestHeaders = { ...req.headers, host: `127.0.0.1:${port}` };
  if (wantsHtml(req)) requestHeaders["accept-encoding"] = "identity";
  const upstream = httpRequest(
    {
      host: "127.0.0.1",
      port,
      method: req.method,
      path: upstreamPath,
      headers: requestHeaders,
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
  upstream.setTimeout(15_000, () => upstream.destroy());
  upstream.on("error", () => {
    if (!res.headersSent) {
      res.status(502).json({
        error: { code: "BAD_GATEWAY", message: "preview server unreachable" },
      });
    } else {
      res.end();
    }
  });
  req.pipe(upstream);
}

async function sessionPort(token: string): Promise<number | null> {
  const session = await prisma.session.findUnique({
    where: { previewToken: token },
    select: { devPort: true },
  });
  return session?.devPort ?? null;
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
  const port = await sessionPort(token);
  if (!port) {
    next();
    return;
  }
  proxyToDevServer(req, res, port, req.originalUrl);
});

previewRouter.use("/preview/:token{/*subpath}", async (req, res) => {
  const token = String(req.params.token ?? "");
  const port = await sessionPort(token);
  if (!port) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "preview not found" } });
    return;
  }
  proxyToDevServer(
    req,
    res,
    port,
    withQuery(subpathFrom(req.params), req.originalUrl),
    token,
  );
});
