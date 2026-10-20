import { ALL_TRAFFIC, Sandbox as E2BSandbox } from "e2b";
import { createLogger } from "@repo/logger";
import { SandboxClient } from "../client";
import { WarmPool } from "../pool";
import { getSupervisorBundle } from "./e2b-bundle";
import { collectUploadEntries } from "./e2b-upload";
import { readWarmPoolSize } from "./e2b-warm-size";
import type { CreateSandboxOptions, SandboxProvider } from "./types";

const log = createLogger("e2b");

const SUPERVISOR_PORT = 39911;
const SUPERVISOR_PATH = "/tmp/supervisor.mjs";
const WORKSPACE_ROOT = "/workspace";
const BOX_READY_TIMEOUT_MS = 30_000;
const BOX_READY_POLL_MS = 500;
const WARM_BOX_TIMEOUT_MS = 10 * 60_000;

// Closes O1/D25: npm/pip/GitHub need to work, nothing else should. Doc's
// Slice 6 trap table names this explicitly; this is the one provider where
// it's actually enforceable — Local shares the host's own network.
export const EGRESS_ALLOWLIST = [
  "registry.npmjs.org",
  "*.npmjs.org",
  "github.com",
  "*.github.com",
  "codeload.github.com",
  "raw.githubusercontent.com",
  "pypi.org",
  "*.pypi.org",
  "files.pythonhosted.org",
];

// E2B 400s domain allow-lists unless the rest of the internet is denied.
export const EGRESS_NETWORK = {
  allowOut: EGRESS_ALLOWLIST,
  denyOut: [ALL_TRAFFIC],
};

// E2B's commands.run default timeout is 60s and applies to background
// processes. When it fires, the supervisor is killed, port forwarding
// drops, and every later tool call fails. 0 disables the command timeout;
// the box TTL (maxWallClockMs) still kills the sandbox.
export const SUPERVISOR_RUN_OPTS = {
  background: true as const,
  timeoutMs: 0,
};

// Upload skips `.git`. A fresh repo in the box has no identity, so `git commit`
// exits 1 with "empty ident name" unless we set one here (same as local
// `initProjectGit`).
export const WORKSPACE_SNAPSHOT_COMMAND =
  "git config --global --add safe.directory /workspace && git init -q && git config user.name Appwright && git config user.email agent@appwright.local && git add -A && git commit -q -m snapshot --allow-empty";

function commandFailure(action: string, err: unknown, sandboxId: string): Error {
  const message = err instanceof Error ? err.message : String(err);
  const stderr =
    err !== null &&
    typeof err === "object" &&
    "stderr" in err &&
    typeof err.stderr === "string"
      ? err.stderr.trim()
      : "";
  const error = new Error(
    stderr
      ? `${action} [sandboxId=${sandboxId}]: ${message} (${stderr})`
      : `${action} [sandboxId=${sandboxId}]: ${message}`,
  );
  Object.assign(error, { sandboxId });
  return error;
}

function requireApiKey(): void {
  if (!process.env.E2B_API_KEY) {
    throw new Error(
      "E2B_API_KEY is not set. Get one from your E2B dashboard and add it to .env.",
    );
  }
}

async function waitForHealth(client: SandboxClient): Promise<void> {
  const deadline = Date.now() + BOX_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const health = await client.checkHealth();
      if (health.ok) return;
    } catch {
      // supervisor not listening yet
    }
    await new Promise((r) => setTimeout(r, BOX_READY_POLL_MS));
  }
  throw new Error("E2B supervisor did not become healthy in time");
}

// Same wire contract as LocalSandboxProvider (D22): this provisions a real
// E2B box, uploads and starts the identical supervisor inside it, and
// returns the same SandboxClient pointed at the box's public URL instead
// of localhost. Caller code (SandboxRuntime, agent-core, tools) is
// unchanged either way.
interface WarmBox {
  box: E2BSandbox;
  client: SandboxClient;
}

export class E2BSandboxProvider implements SandboxProvider {
  private readonly boxes = new Map<string, E2BSandbox>();
  private readonly pool: WarmPool<WarmBox>;

  constructor(warmPoolSize: number = readWarmPoolSize(process.env.SANDBOX_WARM_POOL_SIZE)) {
    this.pool = new WarmPool<WarmBox>({
      size: warmPoolSize,
      boot: () => this.bootBox(WARM_BOX_TIMEOUT_MS),
      dispose: (warm) => warm.box.kill().then(() => undefined),
      onBootError: (error) => log.error("E2B warm box failed to boot", { err: String(error) }),
    });
    this.pool.refill();
  }

  async create(opts: CreateSandboxOptions): Promise<SandboxClient> {
    requireApiKey();
    const warm = this.pool.take() ?? (await this.bootBox(opts.maxWallClockMs));
    try {
      if (opts.maxWallClockMs) await warm.box.setTimeout(opts.maxWallClockMs);
      await this.loadWorkspace(warm.box, opts.workspaceDir);
      this.boxes.set(warm.box.sandboxId, warm.box);
      log.info("sandbox ready for job", {
        sandboxId: warm.box.sandboxId,
        projectId: opts.projectId,
      });
      return warm.client;
    } catch (err) {
      log.error("sandbox create failed, killing box", {
        sandboxId: warm.box.sandboxId,
        projectId: opts.projectId,
        err: err instanceof Error ? err.message : String(err),
      });
      await warm.box.kill().catch(() => {});
      throw err;
    }
  }

  async destroy(id: string): Promise<void> {
    const box = this.boxes.get(id);
    if (!box) return;
    log.info("sandbox destroying", { sandboxId: id });
    await box.kill();
    this.boxes.delete(id);
  }

  async destroyAll(): Promise<void> {
    await this.pool.close();
    await Promise.all(Array.from(this.boxes.values()).map((b) => b.kill()));
    this.boxes.clear();
  }

  private async bootBox(timeoutMs: number | undefined): Promise<WarmBox> {
    requireApiKey();
    const box = await E2BSandbox.create("base", { timeoutMs, network: EGRESS_NETWORK });
    log.info("sandbox created", { sandboxId: box.sandboxId });
    try {
      const bundle = await getSupervisorBundle();
      await box.files.write(SUPERVISOR_PATH, bundle);
      // `/` is root-owned on the E2B `base` template; `user` can sudo without a password.
      try {
        await box.commands.run(
          `sudo -n mkdir -p ${WORKSPACE_ROOT} && sudo -n chown user:user ${WORKSPACE_ROOT}`,
        );
      } catch (err) {
        throw commandFailure("E2B mkdir /workspace failed", err, box.sandboxId);
      }
      try {
        await box.commands.run(`node ${SUPERVISOR_PATH}`, {
          ...SUPERVISOR_RUN_OPTS,
          envs: { SUPERVISOR_PORT: String(SUPERVISOR_PORT), SUPERVISOR_ROOT: WORKSPACE_ROOT },
        });
      } catch (err) {
        throw commandFailure("E2B supervisor start failed", err, box.sandboxId);
      }
      const client = new SandboxClient(box.sandboxId, `https://${box.getHost(SUPERVISOR_PORT)}`);
      try {
        await waitForHealth(client);
      } catch (err) {
        throw commandFailure("E2B supervisor health check failed", err, box.sandboxId);
      }
      log.info("sandbox supervisor healthy", { sandboxId: box.sandboxId });
      return { box, client };
    } catch (err) {
      log.error("sandbox boot failed, killing box", {
        sandboxId: box.sandboxId,
        err: err instanceof Error ? err.message : String(err),
      });
      await box.kill().catch(() => {});
      throw err;
    }
  }

  private async loadWorkspace(box: E2BSandbox, workspaceDir: string): Promise<void> {
    const entries = collectUploadEntries(workspaceDir);
    if (entries.length > 0) {
      await box.files.write(
        entries.map((e) => ({ path: `${WORKSPACE_ROOT}/${e.path}`, data: e.data })),
      );
    }
    try {
      await box.commands.run(WORKSPACE_SNAPSHOT_COMMAND, { cwd: WORKSPACE_ROOT });
    } catch (err) {
      throw commandFailure("E2B workspace snapshot failed", err, box.sandboxId);
    }
  }
}
