import { rm } from "node:fs/promises";
import type { Runtime } from "@repo/agent-core";
import { safeResolve, writeProjectFile } from "@repo/contracts/files";
import { createLogger } from "@repo/logger";
import { SandboxMirror, mightChangeFiles } from "../mirror";

const log = createLogger("agent-job");

const STATUS_TIMEOUT_MS = 15_000;
const STATUS_ARGV = ["git", "status", "--porcelain", "-z", "--untracked-files=all"];

export class HostMirrorRuntime implements Runtime {
  private readonly mirror: SandboxMirror;

  constructor(
    private readonly inner: Runtime,
    private readonly projectId: string,
    private readonly sessionId: string,
  ) {
    this.mirror = new SandboxMirror({
      listChanges: async () => {
        const status = await this.inner.exec(STATUS_ARGV, { timeoutMs: STATUS_TIMEOUT_MS });
        if (status.exitCode !== 0) throw new Error(`git status exited ${status.exitCode}: ${status.stderr.trim()}`);
        return status.stdout;
      },
      readSandboxFile: (path) => this.inner.readFile(path),
      writeHostFile: (path, content) => writeProjectFile(this.projectId, path, content, this.sessionId),
      removeHostFile: (path) => rm(safeResolve(this.projectId, path, this.sessionId), { force: true }),
    });
  }

  readFile(workspacePath: string): Promise<string> {
    return this.inner.readFile(workspacePath);
  }

  async writeFile(workspacePath: string, content: string): Promise<void> {
    await this.inner.writeFile(workspacePath, content);
    try {
      await writeProjectFile(this.projectId, workspacePath, content, this.sessionId);
      this.mirror.remember(workspacePath, content);
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

  async exec(
    argv: string[],
    opts: { timeoutMs: number; cwd?: string },
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const result = await this.inner.exec(argv, opts);
    if (mightChangeFiles(argv)) await this.syncSandboxChanges(argv[0] ?? "");
    return result;
  }

  flush(): Promise<void> {
    return this.syncSandboxChanges("flush");
  }

  private async syncSandboxChanges(command: string): Promise<void> {
    try {
      const report = await this.mirror.syncChanges();
      if (report.skipped.length > 0) {
        log.warn("host mirror skipped paths", {
          projectId: this.projectId,
          sessionId: this.sessionId,
          command,
          skipped: report.skipped.slice(0, 20),
        });
      }
    } catch (err) {
      log.warn("host mirror sync failed", {
        projectId: this.projectId,
        sessionId: this.sessionId,
        command,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
