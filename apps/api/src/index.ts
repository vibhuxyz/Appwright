import "./env"; // must be the first import — sets WORKSPACE_ROOT before @repo/contracts loads

import { requireAuth } from "@repo/auth";
import cors from "cors";
import express from "express";
import { log } from "./log";
import { authRouter } from "./routes/auth";
import { conversationRouter, streamRouter } from "./routes/conversation";
import { filesRouter } from "./routes/files";
import { projectRouter } from "./routes/project";
import { sessionRouter } from "./routes/session";
import { vercelCallbackRouter, vercelRouter } from "./routes/vercel";

const PORT = Number(process.env.PORT ?? 3001);

const app = express();
app.use(cors());
app.use(express.json());
app.disable("x-powered-by");

// One line per request, once it's actually finished — `res.on("finish")`
// fires after the status code is set, `app.use` at the top would only know
// the method and path. Skips /health so uptime pings don't fill the log.
app.use((req, res, next) => {
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

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "api" });
});

// ── Public ─────────────────────────────────────────────────────────────
// Login/register, and the OAuth callback Vercel calls with no session of
// ours (it is trusted via its signed `state`, not a token).
app.use(authRouter);
app.use(vercelCallbackRouter);

// SSE sits between the two: authenticated, but EventSource cannot send an
// Authorization header, so it verifies the same JWT from a query param.
app.use(streamRouter);

// ── The auth wall ──────────────────────────────────────────────────────
// One line, one place. Previously each router applied requireAuth with its
// own `.use()`, which looked local but was not: a root-mounted `.use()` runs
// for every request reaching it, not only the paths that router defines, and
// requireAuth answers 401 rather than calling next(). That silently made
// every public route mounted after it unreachable. Stating the wall once,
// here, is what makes it impossible to reintroduce by reordering.
app.use(requireAuth);

// ── Authenticated ──────────────────────────────────────────────────────
app.use(projectRouter);
app.use(sessionRouter);
app.use(conversationRouter);
app.use(filesRouter);
app.use(vercelRouter);

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

app.listen(PORT, () => log.info("api listening", { port: PORT }));
