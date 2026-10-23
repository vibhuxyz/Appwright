import "./env"; // must be the first import — sets WORKSPACE_ROOT before @repo/contracts loads

import { requireAuth } from "@repo/auth";
import cors from "cors";
import express from "express";
import { randomUUID } from "node:crypto";
import { runWithTrace, setTraceContext } from "@repo/logger";
import { log } from "./log";
import { authRouter } from "./routes/auth";
import { blueprintRouter } from "./routes/blueprint";
import { planRouter } from "./routes/plan";
import { planPreviewRouter } from "./routes/plan-preview";
import { themeRouter } from "./routes/theme";
import { conversationRouter, streamRouter } from "./routes/conversation";
import { filesRouter } from "./routes/files";
import { projectRouter } from "./routes/project";
import { projectDatabaseRouter } from "./routes/project-database";
import { promptRouter } from "./routes/prompt";
import { sessionRouter } from "./routes/session";
import { vercelCallbackRouter, vercelRouter } from "./routes/vercel";
import { gitRouter } from "./routes/git";
import { approvalRouter } from "./routes/approval";
import { assetsRouter } from "./routes/assets";
import { browserScreenshotsRouter } from "./routes/browser-screenshots";
import { unsplashRouter } from "./routes/unsplash";
import { handlePreviewUpgrade } from "./preview";
import { previewRouter, sessionPort } from "./routes/preview";
import { pruneAllWorktrees } from "./workspace/prune";

const PORT = Number(process.env.PORT ?? 3001);

const app = express();
app.use(cors());
app.use(express.json());
app.disable("x-powered-by");

// ── Trace Context & Request Logging ──────────────────────────────────────────
// Attaches requestId and traceId, scopes all downstream async operations within
// an AsyncLocalStorage trace context, and emits one structured log per request.
// Skips /health so uptime pings don't fill the log.
app.use((req, res, next) => {
  const reqIdHeader = req.headers["x-request-id"];
  const traceIdHeader = req.headers["x-trace-id"];
  const requestId =
    typeof reqIdHeader === "string" && reqIdHeader.trim()
      ? reqIdHeader.trim()
      : randomUUID();
  const traceId =
    typeof traceIdHeader === "string" && traceIdHeader.trim()
      ? traceIdHeader.trim()
      : undefined;

  res.setHeader("x-request-id", requestId);
  if (traceId) {
    res.setHeader("x-trace-id", traceId);
  }

  runWithTrace({ requestId, ...(traceId ? { traceId } : {}) }, () => {
    if (req.path === "/health") return next();
    const start = performance.now();
    res.on("finish", () => {
      log.info("request", {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        ms: Math.round(performance.now() - start),
      });
    });
    next();
  });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "api" });
});

// ── Public ───────────────────────────────────────────────────────────────────
// Login/register, and the OAuth callback Vercel calls with no session of
// ours (it is trusted via its signed `state`, not a token).
app.use(authRouter);
app.use(vercelCallbackRouter);

// Also public: a plain <iframe src> can't attach an Authorization header
// either. The random previewToken (not a JWT) is what gates this one.
// Mounted before streamRouter so a mistaken router-level auth middleware on
// the stream cannot shadow it (Express root-mounted .use() runs for every
// request that reaches that router, not only its declared paths).
app.use(previewRouter);

// SSE sits between the two: authenticated, but EventSource cannot send an
// Authorization header, so it verifies the same JWT from a query param.
app.use(streamRouter);

// ── The auth wall ────────────────────────────────────────────────────────────
// One line, one place. Previously each router applied requireAuth with its
// own `.use()`, which looked local but was not: a root-mounted `.use()` runs
// for every request reaching it, not only the paths that router defines, and
// requireAuth answers 401 rather than calling next(). That silently made
// every public route mounted after it unreachable. Stating the wall once,
// here, is what makes it impossible to reintroduce by reordering.
app.use(requireAuth);
app.use((req, _res, next) => {
  if (req.userId) {
    setTraceContext({ userId: req.userId });
  }
  next();
});

// ── Authenticated ────────────────────────────────────────────────────────────
app.use(projectRouter);
app.use(projectDatabaseRouter);
app.use(sessionRouter);
app.use(conversationRouter);
app.use(blueprintRouter);
app.use(planRouter);
app.use(planPreviewRouter);
app.use(themeRouter);
app.use(filesRouter);
app.use(vercelRouter);
app.use(promptRouter);
app.use(gitRouter);
app.use(approvalRouter);
app.use(assetsRouter);
app.use(browserScreenshotsRouter);
app.use(unsplashRouter);

app.use(
  (
    err: unknown,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    log.error("unhandled request error", {
      method: req.method,
      path: req.path,
      err: err instanceof Error ? err.stack : String(err),
    });
    if (res.headersSent) return;
    res
      .status(400)
      .json({ error: err instanceof Error ? err.message : String(err) });
  },
);

pruneAllWorktrees()
  .then((projects) => log.info("worktrees pruned", { projects }))
  .catch((err) => log.error("worktree prune failed", { err: String(err) }));

const server = app.listen(PORT, () => log.info("api listening", { port: PORT }));

server.on("upgrade", (request, socket, head) => {
  handlePreviewUpgrade(request, socket, head, sessionPort)
    .then((isHandled) => {
      if (!isHandled) socket.destroy();
    })
    .catch((error: unknown) => {
      log.error("preview upgrade failed", {
        url: request.url,
        message: error instanceof Error ? error.message : String(error),
      });
      socket.destroy();
    });
});
