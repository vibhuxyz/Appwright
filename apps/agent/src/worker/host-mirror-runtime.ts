import type { Runtime } from "@repo/agent-core";
import { writeProjectFile } from "@repo/contracts/files";
import { createLogger } from "@repo/logger";

const log = createLogger("agent-job");

// SandboxRuntime talks only to the box. The Files pane, local preview, and
// git checkpoints read the host session worktree, so every successful write
// is mirrored there. A host failure must not fail the tool — the sandbox
// copy is what the agent loop reads next.
export class HostMirrorRuntime implements Runtime {
  constructor(
    private readonly inner: Runtime,
    private readonly projectId: string,
    private readonly sessionId: string,
  ) {}

  readFile(workspacePath: string): Promise<string> {
    return this.inner.readFile(workspacePath);
  }

  async writeFile(workspacePath: string, content: string): Promise<void> {
    await this.inner.writeFile(workspacePath, content);
    try {
      await writeProjectFile(
        this.projectId,
        workspacePath,
        content,
        this.sessionId,
      );
    } catch (err) {
      log.warn("host mirror write failed", {
        projectId: this.projectId,
        sessionId: this.sessionId,
        path: workspacePath,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }

  listDir(workspacePath: string): Promise<string[]> {
    return this.inner.listDir(workspacePath);
  }

  exec(
    argv: string[],
    opts: { timeoutMs: number; cwd?: string },
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return this.inner.exec(argv, opts);
  }
}