import { createLogger } from "@repo/logger";
import { createSandboxProviderFromEnv, type SandboxProvider } from "@repo/sandbox";
import { startHealthServer } from "./health";
import { startPoller, type Poller } from "./poller";

const log = createLogger("agent-worker");
const DEFAULT_HEALTH_PORT = 3003;

export { executeAgentJob } from "./worker";
export type { AgentJobResult } from "./worker";
export { startPoller } from "./poller";

export function startAgentWorker(): {
  sandboxProvider: SandboxProvider;
  poller: Poller;
  stop: () => Promise<void>;
} {
  const sandboxProvider = createSandboxProviderFromEnv();
  const poller = startPoller(sandboxProvider);

  log.info("agent worker started, polling for jobs");

  return {
    sandboxProvider,
    poller,
    stop: async () => {
      poller.stop();
      await sandboxProvider.destroyAll();
    },
  };
}

if (import.meta.main) {
  const worker = startAgentWorker();
  let isShuttingDown = false;
  const health = startHealthServer({
    port: Number(process.env.HEALTH_PORT ?? DEFAULT_HEALTH_PORT),
    isReady: () => !isShuttingDown,
  });
  const shutdown = async (): Promise<void> => {
    isShuttingDown = true;
    log.info("shutting down, finishing in-flight work");
    health.stop();
    await worker.stop();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
