import { safeResolve } from "@repo/contracts";

// Runtime — the execution seam (D27). The agent is a CLIENT of a runtime, never
// a resident: it never touches node:fs / node:child_process, and it never
// handles an absolute path (D28 — /workspace is the only root).
//
// LocalRuntime satisfies that literally: it uses Bun's native globals
// (Bun.file, Bun.write, Bun.spawn, Bun.Glob) instead of `import ... from "node:fs"`.
// Same interface will have an HTTP-backed implementation at V3 (D22) — the
// caller code does not change.

const IGNORED_SEGMENTS = ["node_modules", ".git", "dist", ".vite", ".turbo"];

export interface Runtime {
  readFile(workspacePath: string): Promise<string>;
  writeFile(workspacePath: string, content: string): Promise<void>;
  listDir(workspacePath: string): Promise<string[]>;
  exec(
    argv: string[],
    opts: { timeoutMs: number; cwd?: string },
  ): Promise<{ stdout: string; stderr: string; exitCode: number }>;
}

// LocalRuntime resolves every workspace-relative path against one project's
// root via safeResolve() (@repo/contracts) — the same fence the API uses, so
// the agent and the file-tree UI never disagree about where a workspace is.
export class LocalRuntime implements Runtime {
  constructor(private readonly projectId: string) {}

  private resolve(workspacePath: string): string {
    return safeResolve(this.projectId, workspacePath);
  }

  async readFile(workspacePath: string): Promise<string> {
    return Bun.file(this.resolve(workspacePath)).text();
  }

  async writeFile(workspacePath: string, content: string): Promise<void> {
    await Bun.write(this.resolve(workspacePath), content);
  }

  async listDir(workspacePath: string): Promise<string[]> {
    const root = this.resolve(workspacePath);
    const glob = new Bun.Glob("**/*");
    const entries: string[] = [];
    for await (const entry of glob.scan({ cwd: root, dot: false })) {
      // node_modules alone can be tens of thousands of files — walking it
      // blows the tool result straight through truncate() and wastes the
      // agent's whole budget reading nothing useful.
      if (IGNORED_SEGMENTS.some((seg) => entry === seg || entry.startsWith(`${seg}/`) || entry.includes(`/${seg}/`))) {
        continue;
      }
      entries.push(entry);
    }
    return entries.sort();
  }

  async exec(
    argv: string[],
    opts: { timeoutMs: number; cwd?: string },
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const cwd = opts.cwd ? this.resolve(opts.cwd) : this.resolve(".");
    // NEVER shell: true with model-supplied input — argv array only.
    const proc = Bun.spawn(argv, {
      cwd,
      stdout: "pipe",
      stderr: "pipe",
    });

    const timeout = setTimeout(() => proc.kill(), opts.timeoutMs);
    try {
      const [stdout, stderr, exitCode] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
      ]);
      return { stdout, stderr, exitCode };
    } finally {
      clearTimeout(timeout);
    }
  }
}
