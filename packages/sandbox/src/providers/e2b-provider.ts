import { Sandbox as E2BSandbox } from "e2b";
import { SandboxClient } from "../client";
import { getSupervisorBundle } from "./e2b-bundle";
import { collectUploadEntries } from "./e2b-upload";
import type { CreateSandboxOptions, SandboxProvider } from "./types";

const SUPERVISOR_PORT = 39911;
const SUPERVISOR_PATH = "/tmp/supervisor.mjs";
const WORKSPACE_ROOT = "/workspace";
const BOX_READY_TIMEOUT_MS = 30_000;
const BOX_READY_POLL_MS = 500;

// Closes O1/D25: npm/pip/GitHub need to work, nothing else should. Doc's
// Slice 6 trap table names this explicitly; this is the one provider where
// it's actually enforceable — Local shares the host's own network.
const EGRESS_ALLOWLIST = [
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
export class E2BSandboxProvider implements SandboxProvider {
  private readonly boxes = new Map<string, E2BSandbox>();

  async create(opts: CreateSandboxOptions): Promise<SandboxClient> {
    requireApiKey();

    const box = await E2BSandbox.create({
      timeoutMs: opts.maxWallClockMs,
      network: { allowOut: EGRESS_ALLOWLIST },
    });

    try {
      const bundle = await getSupervisorBundle();
      const uploadEntries = collectUploadEntries(opts.workspaceDir);

      await box.files.write([
        { path: SUPERVISOR_PATH, data: bundle },
        ...uploadEntries.map((e) => ({ path: `${WORKSPACE_ROOT}/${e.path}`, data: e.data })),
      ]);

      await box.commands.run(`git init -q && git add -A && git commit -q -m snapshot --allow-empty`, {
        cwd: WORKSPACE_ROOT,
      });

      await box.commands.run(`node ${SUPERVISOR_PATH}`, {
        background: true,
        envs: { SUPERVISOR_PORT: String(SUPERVISOR_PORT), SUPERVISOR_ROOT: WORKSPACE_ROOT },
      });

      const baseUrl = `https://${box.getHost(SUPERVISOR_PORT)}`;
      const client = new SandboxClient(box.sandboxId, baseUrl);
      await waitForHealth(client);

      this.boxes.set(box.sandboxId, box);
      return client;
    } catch (err) {
      await box.kill().catch(() => {});
      throw err;
    }
  }

  async destroy(id: string): Promise<void> {
    const box = this.boxes.get(id);
    if (!box) return;
    await box.kill();
    this.boxes.delete(id);
  }

  async destroyAll(): Promise<void> {
    await Promise.all(Array.from(this.boxes.values()).map((b) => b.kill()));
    this.boxes.clear();
  }
}
