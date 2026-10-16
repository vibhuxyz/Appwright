import type { Runtime } from "@repo/agent-core";
import type { Sandbox } from "../client";

export class SandboxRuntime implements Runtime {
  constructor(private readonly sandbox: Sandbox) {}

  async readFile(workspacePath: string): Promise<string> {
    const res = await this.sandbox.readFile(workspacePath);
    return res.content;
  }

  async writeFile(workspacePath: string, content: string): Promise<void> {
    await this.sandbox.writeFile(workspacePath, content);
  }

  async listDir(workspacePath: string): Promise<string[]> {
    const res = await this.sandbox.exec({
      argv: [
        "find",
        ".",
        "-maxdepth",
        "5",
        "-not",
        "-path",
        "*/.*",
        "-not",
        "-path",
        "*node_modules*",
        "-not",
        "-path",
        "*dist*",
      ],
      cwd: workspacePath === "." ? undefined : workspacePath,
    });
    if (res.code !== 0) {
      return [];
    }
    return res.stdout
      .split("\n")
      .map((p) => p.replace(/^\.\//, "").trim())
      .filter((p) => p.length > 0 && p !== ".");
  }

  async exec(
    argv: string[],
    opts: { timeoutMs: number; cwd?: string },
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const res = await this.sandbox.exec({
      argv,
      timeoutMs: opts.timeoutMs,
      cwd: opts.cwd,
    });
    return {
      stdout: res.stdout,
      stderr: res.stderr,
      exitCode: res.code,
    };
  }
}
