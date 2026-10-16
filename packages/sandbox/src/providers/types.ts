import type { Sandbox } from "../client";

export interface CreateSandboxOptions {
  projectId: string;
  sandboxId?: string;
  workspaceDir: string;
  snapshot?: string;
  port?: number;
  // Separate from any per-command exec timeout: a sandbox running a
  // generated dev server, or a command loop that never individually times
  // out, still needs a hard ceiling on total lifetime. Doc: "A sandbox
  // running an infinite loop in generated code looks perfectly healthy —
  // only a hard deadline catches it."
  maxWallClockMs?: number;
  onWallClockExceeded?: () => void;
}

export interface SandboxProvider {
  create(opts: CreateSandboxOptions): Promise<Sandbox>;
  destroy(id: string): Promise<void>;
  destroyAll(): Promise<void>;
}
