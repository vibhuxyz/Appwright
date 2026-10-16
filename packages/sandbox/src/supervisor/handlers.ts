import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  DEFAULT_EXEC_TIMEOUT_MS,
  MAX_FILE_READ_BYTES,
} from "../contract/constants";
import { buildExecEnv } from "./exec-env";
import type {
  ExecRequest,
  ExecResponse,
  FileReadRequest,
  FileReadResponse,
  FileWriteRequest,
  FileWriteResponse,
  GitCloneRequest,
  GitCommitRequest,
  GitPushRequest,
  GitResponse,
} from "../contract/types";
import { resolveSafePath } from "./fence";

export async function handleExec(
  sandboxRoot: string,
  req: ExecRequest,
): Promise<ExecResponse> {
  const binary = req.argv[0];
  if (!binary) {
    return { stdout: "", stderr: "Empty argv provided", code: 1 };
  }

  const effectiveCwd = req.cwd
    ? resolveSafePath(sandboxRoot, req.cwd)
    : sandboxRoot;
  const timeoutMs = req.timeoutMs ?? DEFAULT_EXEC_TIMEOUT_MS;

  return new Promise((resolveResult) => {
    const child = spawn(binary, req.argv.slice(1), {
      cwd: effectiveCwd,
      env: buildExecEnv(req.env),
      stdio: ["ignore", "pipe", "pipe"] as const,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolveResult({
        stdout,
        stderr: stderr ? `${stderr}\n${err.message}` : err.message,
        code: 1,
      });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (timedOut) {
        resolveResult({
          stdout,
          stderr: `${stderr}\nCommand timed out after ${timeoutMs}ms`.trim(),
          code: 124,
        });
        return;
      }
      resolveResult({ stdout, stderr, code: code ?? 0 });
    });
  });
}

export async function handleFileRead(
  sandboxRoot: string,
  req: FileReadRequest,
): Promise<FileReadResponse> {
  const safePath = resolveSafePath(sandboxRoot, req.path);
  if (!existsSync(safePath)) {
    throw new Error(`File not found: ${req.path}`);
  }

  const stats = statSync(safePath);
  if (stats.isDirectory()) {
    throw new Error(`Cannot read directory as file: ${req.path}`);
  }

  const truncated = stats.size > MAX_FILE_READ_BYTES;
  const buffer = readFileSync(safePath);
  const content = truncated
    ? buffer.subarray(0, MAX_FILE_READ_BYTES).toString("utf8")
    : buffer.toString("utf8");

  return { content, truncated };
}

export async function handleFileWrite(
  sandboxRoot: string,
  req: FileWriteRequest,
): Promise<FileWriteResponse> {
  const safePath = resolveSafePath(sandboxRoot, req.path);
  mkdirSync(dirname(safePath), { recursive: true });
  writeFileSync(safePath, req.content, "utf8");
  return { ok: true };
}

export async function handleGitClone(
  sandboxRoot: string,
  req: GitCloneRequest,
): Promise<GitResponse> {
  const target = resolveSafePath(sandboxRoot, req.targetDir);
  const args = ["clone", req.repoUrl, target];
  if (req.branch) {
    args.push("-b", req.branch);
  }
  const result = await handleExec(sandboxRoot, { argv: ["git", ...args] });
  return {
    ok: result.code === 0,
    output: (result.stdout + "\n" + result.stderr).trim(),
  };
}

export async function handleGitCommit(
  sandboxRoot: string,
  req: GitCommitRequest,
): Promise<GitResponse> {
  const cwd = req.cwd ? resolveSafePath(sandboxRoot, req.cwd) : sandboxRoot;
  const addResult = await handleExec(sandboxRoot, {
    argv: ["git", "add", "-A"],
    cwd,
  });
  if (addResult.code !== 0) {
    return { ok: false, output: addResult.stderr };
  }

  const commitArgs = ["commit", "-m", req.message];
  if (req.authorName && req.authorEmail) {
    commitArgs.push("--author", `${req.authorName} <${req.authorEmail}>`);
  }

  const commitResult = await handleExec(sandboxRoot, {
    argv: ["git", ...commitArgs],
    cwd,
  });
  if (commitResult.code !== 0) {
    return { ok: false, output: commitResult.stderr || commitResult.stdout };
  }

  const shaResult = await handleExec(sandboxRoot, {
    argv: ["git", "rev-parse", "HEAD"],
    cwd,
  });
  const sha = shaResult.code === 0 ? shaResult.stdout.trim() : undefined;

  return { ok: true, sha, output: commitResult.stdout.trim() };
}

export async function handleGitPush(
  sandboxRoot: string,
  req: GitPushRequest,
): Promise<GitResponse> {
  const cwd = req.cwd ? resolveSafePath(sandboxRoot, req.cwd) : sandboxRoot;
  const remote = req.remote ?? "origin";
  const args = ["push", remote];
  if (req.branch) {
    args.push(req.branch);
  }
  const result = await handleExec(sandboxRoot, {
    argv: ["git", ...args],
    cwd,
  });
  return {
    ok: result.code === 0,
    output: (result.stdout + "\n" + result.stderr).trim(),
  };
}
