const HEALTHY_STATUS = 200;
const UNREADY_STATUS = 503;

export interface HealthServerOptions {
  port: number;
  isReady: () => boolean;
}

export interface HealthServer {
  port: number;
  stop: () => void;
}

export function startHealthServer(options: HealthServerOptions): HealthServer {
  const server = Bun.serve({
    port: options.port,
    fetch(request) {
      const { pathname } = new URL(request.url);
      if (pathname === "/healthz") return Response.json({ ok: true }, { status: HEALTHY_STATUS });
      if (pathname === "/readyz") {
        const isReady = options.isReady();
        return Response.json({ ok: isReady }, { status: isReady ? HEALTHY_STATUS : UNREADY_STATUS });
      }
      return Response.json({ error: { code: "NOT_FOUND", message: `No route ${pathname}` } }, { status: 404 });
    },
  });
  return { port: server.port ?? options.port, stop: () => void server.stop() };
}
