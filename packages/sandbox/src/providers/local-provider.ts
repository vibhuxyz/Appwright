import { SandboxClient } from "../client";
import { startSupervisor } from "../supervisor";
import type { SupervisorInstance } from "../supervisor/types";
import type { CreateSandboxOptions, SandboxProvider } from "./types";

export class LocalSandboxProvider implements SandboxProvider {
  private readonly instances = new Map<string, SupervisorInstance>();
  private readonly wallClockTimers = new Map<string, ReturnType<typeof setTimeout>>();

  async create(opts: CreateSandboxOptions): Promise<SandboxClient> {
    const sandboxId =
      opts.sandboxId ??
      `${opts.projectId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    const supervisor = await startSupervisor({
      port: opts.port ?? 0,
      sandboxRoot: opts.workspaceDir,
    });

    this.instances.set(sandboxId, supervisor);
    const client = new SandboxClient(sandboxId, supervisor.baseUrl);

    const health = await client.checkHealth();
    if (!health.ok) {
      await supervisor.stop();
      this.instances.delete(sandboxId);
      throw new Error(`Supervisor failed health check for sandbox ${sandboxId}`);
    }

    if (opts.maxWallClockMs) {
      const timer = setTimeout(() => {
        opts.onWallClockExceeded?.();
        this.destroy(sandboxId).catch(() => {});
      }, opts.maxWallClockMs);
      this.wallClockTimers.set(sandboxId, timer);
    }

    return client;
  }

  async destroy(id: string): Promise<void> {
    const timer = this.wallClockTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.wallClockTimers.delete(id);
    }

    const supervisor = this.instances.get(id);
    if (!supervisor) return;
    await supervisor.stop();
    this.instances.delete(id);
  }

  async destroyAll(): Promise<void> {
    for (const timer of this.wallClockTimers.values()) clearTimeout(timer);
    this.wallClockTimers.clear();

    const stops = Array.from(this.instances.values()).map((s) => s.stop());
    await Promise.all(stops);
    this.instances.clear();
  }
}
