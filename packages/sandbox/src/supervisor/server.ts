import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import {
  BROWSER_ROUTE_PREFIX,
  DEFAULT_LEASE_DURATION_MS,
  EXEC_ROUTE,
  FILE_READ_ROUTE,
  FILE_WRITE_ROUTE,
  GIT_CLONE_ROUTE,
  GIT_COMMIT_ROUTE,
  GIT_PUSH_ROUTE,
  HEALTH_ROUTE,
} from "../contract/constants";
import {
  ExecRequestSchema,
  FileReadRequestSchema,
  FileWriteRequestSchema,
  GitCloneRequestSchema,
  GitCommitRequestSchema,
  GitPushRequestSchema,
} from "../contract/schemas";
import { FenceViolationError } from "./fence";
import {
  handleExec,
  handleFileRead,
  handleFileWrite,
  handleGitClone,
  handleGitCommit,
  handleGitPush,
} from "./handlers";
import type { SupervisorConfig, SupervisorInstance } from "./types";

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function sendError(res: ServerResponse, status: number, code: string, message: string): void {
  sendJson(res, status, { error: { code, message } });
}

export async function startSupervisor(config: SupervisorConfig): Promise<SupervisorInstance> {
  const startTime = Date.now();
  const leaseDuration = config.leaseDurationMs ?? DEFAULT_LEASE_DURATION_MS;

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const pathname = url.pathname;
    const method = req.method ?? "GET";

    if (pathname.startsWith(BROWSER_ROUTE_PREFIX)) {
      sendError(res, 501, "NOT_IMPLEMENTED", "Browser control is reserved for V5");
      return;
    }

    try {
      if (method === "GET" && pathname === HEALTH_ROUTE) {
        sendJson(res, 200, {
          ok: true,
          leaseExpiresAt: new Date(Date.now() + leaseDuration).toISOString(),
          uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
        });
        return;
      }

      if (method === "POST" && pathname === EXEC_ROUTE) {
        const body = ExecRequestSchema.parse(await readBody(req));
        const result = await handleExec(config.sandboxRoot, body);
        sendJson(res, 200, result);
        return;
      }

      if (method === "POST" && pathname === FILE_READ_ROUTE) {
        const body = FileReadRequestSchema.parse(await readBody(req));
        const result = await handleFileRead(config.sandboxRoot, body);
        sendJson(res, 200, result);
        return;
      }

      if (method === "POST" && pathname === FILE_WRITE_ROUTE) {
        const body = FileWriteRequestSchema.parse(await readBody(req));
        const result = await handleFileWrite(config.sandboxRoot, body);
        sendJson(res, 200, result);
        return;
      }

      if (method === "POST" && pathname === GIT_CLONE_ROUTE) {
        const body = GitCloneRequestSchema.parse(await readBody(req));
        const result = await handleGitClone(config.sandboxRoot, body);
        sendJson(res, result.ok ? 200 : 400, result);
        return;
      }

      if (method === "POST" && pathname === GIT_COMMIT_ROUTE) {
        const body = GitCommitRequestSchema.parse(await readBody(req));
        const result = await handleGitCommit(config.sandboxRoot, body);
        sendJson(res, result.ok ? 200 : 400, result);
        return;
      }

      if (method === "POST" && pathname === GIT_PUSH_ROUTE) {
        const body = GitPushRequestSchema.parse(await readBody(req));
        const result = await handleGitPush(config.sandboxRoot, body);
        sendJson(res, result.ok ? 200 : 400, result);
        return;
      }

      sendError(res, 404, "NOT_FOUND", `Endpoint ${method} ${pathname} not found`);
    } catch (err) {
      if (err instanceof FenceViolationError) {
        sendError(res, 403, "FENCE_VIOLATION", err.message);
        return;
      }
      sendError(res, 400, "BAD_REQUEST", err instanceof Error ? err.message : String(err));
    }
  });

  await new Promise<void>((resolveServer) => {
    server.listen(config.port, "127.0.0.1", () => resolveServer());
  });

  const address = server.address();
  const actualPort = typeof address === "object" && address ? address.port : config.port;
  const baseUrl = `http://127.0.0.1:${actualPort}`;

  return {
    port: actualPort,
    baseUrl,
    stop: () => new Promise<void>((resolveStop) => server.close(() => resolveStop())),
  };
}
