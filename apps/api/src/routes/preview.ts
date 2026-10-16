import { request as httpRequest } from "node:http";
import { prisma } from "@repo/db";
import { Router } from "express";

export const previewRouter = Router();

// No requireAuth here on purpose: a plain <iframe src> or browser tab can't
// attach an Authorization header, so the random previewToken itself is the
// capability — same model as a Figma/Vercel share link. Unguessable (a
// UUID) stands in where the old route leaked the real, small-range dev
// port directly. Known gap: WebSocket upgrades (Vite/Next HMR) aren't
// proxied, so a preview opened through this route won't live-reload.
previewRouter.get(/^\/preview\/([^/]+)(\/.*)?$/, async (req, res) => {
  const token = req.params[0];
  const subpath = req.params[1] ?? "/";

  const session = await prisma.session.findUnique({
    where: { previewToken: token },
    select: { devPort: true },
  });
  if (!session?.devPort) {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "preview not found" } });
    return;
  }

  const upstream = httpRequest(
    {
      host: "127.0.0.1",
      port: session.devPort,
      method: req.method,
      path: subpath,
      headers: { ...req.headers, host: `127.0.0.1:${session.devPort}` },
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    },
  );

  upstream.on("error", () => {
    if (!res.headersSent) {
      res.status(502).json({ error: { code: "BAD_GATEWAY", message: "preview server unreachable" } });
    } else {
      res.end();
    }
  });

  req.pipe(upstream);
});
