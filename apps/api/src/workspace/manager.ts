import { existsSync } from "node:fs";
import { lstat, mkdir, rm, unlink } from "node:fs/promises";
import path from "node:path";
import { $ } from "bun";
import { tryGetProjectRuntimeEnv } from "@repo/db";
import {
  projectRepoPath,
  sessionWorktreePath,
  workspacePath,
  WORKSPACES_DIR,
} from "@repo/workspace";
import { writeProjectRuntimeEnvFile } from "../project-database/write-runtime-env";

export { projectRepoPath, sessionWorktreePath, workspacePath, WORKSPACES_DIR };

const REPO_ROOT = path.resolve(import.meta.dir, "../../../..");
const TEMPLATES_DIR = path.join(REPO_ROOT, "templates");

const LOCKFILES = ["bun.lock", "bun.lockb", "package-lock.json"];

const BUILD_OUTPUT = ["dist", ".next", ".turbo"];
const RSYNC_EXCLUDES = [
  "node_modules",
  ".git",
  ...LOCKFILES,
  ...BUILD_OUTPUT,
].flatMap((f) => ["--exclude", f]);

export async function createWorkspace(
  projectId: string,
  templateId: string,
): Promise<string> {
  const src = path.join(TEMPLATES_DIR, templateId);
  const repoDir = projectRepoPath(projectId);

  await rm(workspacePath(projectId), { recursive: true, force: true });
  await mkdir(repoDir, { recursive: true });
  await $`rsync -a ${RSYNC_EXCLUDES} ${src}/ ${repoDir}/`.quiet();
  await initProjectGit(repoDir);

  return repoDir;
}

export async function createSessionWorktree(
  projectId: string,
  sessionId: string,
): Promise<string> {
  const repoDir = projectRepoPath(projectId);
  const worktreeDir = sessionWorktreePath(projectId, sessionId);
  const branchName = `agent/${sessionId}`;

  if (existsSync(worktreeDir)) {
    await unlinkNodeModulesSymlink(worktreeDir);
    return worktreeDir;
  }

  const branchExists = await $`git -C ${repoDir} rev-parse --verify ${branchName}`
    .quiet()
    .then(() => true)
    .catch(() => false);

  if (branchExists) {
    await $`git -C ${repoDir} worktree add ${worktreeDir} ${branchName}`.quiet();
  } else {
    await $`git -C ${repoDir} worktree add ${worktreeDir} -b ${branchName} main`.quiet();
  }

  await unlinkNodeModulesSymlink(worktreeDir);
  return worktreeDir;
}

function isEnoent(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    err.code === "ENOENT"
  );
}

/** Next/Turbopack panics when node_modules is a symlink that leaves the nested git root. */
export async function unlinkNodeModulesSymlink(dir: string): Promise<void> {
  const modules = path.join(dir, "node_modules");
  try {
    const st = await lstat(modules);
    if (st.isSymbolicLink()) {
      await unlink(modules);
    }
  } catch (err) {
    if (isEnoent(err)) return;
    throw err;
  }
}

export async function removeSessionWorktree(
  projectId: string,
  sessionId: string,
): Promise<void> {
  const repoDir = projectRepoPath(projectId);
  const worktreeDir = sessionWorktreePath(projectId, sessionId);
  const branchName = `agent/${sessionId}`;

  if (existsSync(repoDir)) {
    await $`git -C ${repoDir} worktree remove --force ${worktreeDir}`
      .quiet()
      .catch(() => {});
    await $`git -C ${repoDir} branch -D ${branchName}`.quiet().catch(() => {});
  }
}

export async function pruneWorktrees(projectId: string): Promise<void> {
  const repoDir = projectRepoPath(projectId);
  if (existsSync(repoDir)) {
    await $`git -C ${repoDir} worktree prune`.quiet().catch(() => {});
  }
}

export async function deleteWorkspace(projectId: string): Promise<void> {
  stopDevServer(projectId);
  await rm(workspacePath(projectId), { recursive: true, force: true });
}

interface DevServer {
  port: number;
  proc: ReturnType<typeof Bun.spawn>;
}

const servers = new Map<string, DevServer>();

const FIRST_PORT = 5174;
const LAST_PORT = 5274;


async function isPortFree(port: number): Promise<boolean> {
  try {
    const probe = Bun.listen({
      hostname: "127.0.0.1",
      port,
      socket: { data() {} },
    });
    probe.stop(true);
    return true;
  } catch {
    return false;
  }
}

async function allocatePort(): Promise<number> {
  const taken = new Set([...servers.values()].map((s) => s.port));
  for (let port = FIRST_PORT; port <= LAST_PORT; port++) {
    if (taken.has(port)) continue;
    if (await isPortFree(port)) return port;
  }
  throw new Error(
    `no free dev-server port between ${FIRST_PORT} and ${LAST_PORT}`,
  );
}

const DEV_SERVER_READY_TIMEOUT_MS = 90_000;
const DEV_SERVER_POLL_MS = 500;

async function isListening(port: number): Promise<boolean> {
  try {
    const socket = await Bun.connect({
      hostname: "127.0.0.1",
      port,
      socket: { data() {} },
    });
    socket.end();
    return true;
  } catch {
    return false;
  }
}

async function waitForServer(
  port: number,
  timeoutMs = DEV_SERVER_READY_TIMEOUT_MS,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isListening(port)) return true;
    await new Promise((r) => setTimeout(r, DEV_SERVER_POLL_MS));
  }
  return false;
}

function warmUpFirstPage(port: number): void {
  void fetch(`http://127.0.0.1:${port}/`).then(
    () => undefined,
    () => undefined,
  );
}

const starting = new Map<string, Promise<number>>();


async function devServerArgs(cwd: string, port: number): Promise<string[]> {
  const pkg = await Bun.file(path.join(cwd, "package.json")).json();
  const devScript: string = pkg.scripts?.dev ?? "";
  if (devScript.includes("next")) {
    return ["bun", "run", "dev", "--", "--port", String(port)];
  }
  return ["bun", "run", "dev", "--", "--port", String(port), "--strictPort"];
}


export function startDevServer(projectId: string): Promise<number> {
  return startServerAt(projectId, projectRepoPath(projectId), projectId);
}

export async function startSessionDevServer(
  projectId: string,
  sessionId: string,
): Promise<number> {
  const cwd = await createSessionWorktree(projectId, sessionId);
  await writeProjectRuntimeEnvFile({
    projectId,
    environment: "development",
    sessionId,
  }).catch(() => undefined);
  return startServerAt(sessionServerKey(sessionId), cwd, projectId);
}

export function sessionServerKey(sessionId: string): string {
  return `session:${sessionId}`;
}

async function startServerAt(
  serverKey: string,
  cwd: string,
  envProjectId: string,
): Promise<number> {
  const existing = servers.get(serverKey);
 
  if (existing && existing.proc.exitCode === null && !existing.proc.killed) {
    if (await isListening(existing.port)) return existing.port;
    existing.proc.kill();
    servers.delete(serverKey);
  }
  if (existing) servers.delete(serverKey);

  let promise = starting.get(serverKey);
  if (!promise) {
    promise = (async () => {
      try {
        await unlinkNodeModulesSymlink(cwd);
        const install = Bun.spawn(["bun", "install"], {
          cwd,
          stdout: "inherit",
          stderr: "inherit",
        });
        const installExit = await install.exited;
        if (installExit !== 0) {
          throw new Error(
            `bun install failed for project ${envProjectId} (exit ${installExit})`,
          );
        }

        const port = await allocatePort();
        const runtimeEnv = await tryGetProjectRuntimeEnv({
          projectId: envProjectId,
          environment: "development",
        });
        const proc = Bun.spawn(
          await devServerArgs(cwd, port),
          {
            cwd,
            stdout: "inherit",
            stderr: "inherit",
            env: { ...process.env, ...runtimeEnv },
          },
        );
        servers.set(serverKey, { port, proc });

        const healthy = await waitForServer(port);
        if (!healthy) {
          proc.kill();
          servers.delete(serverKey);
          throw new Error(
            `dev server for project ${envProjectId} never became healthy on :${port}`,
          );
        }

        warmUpFirstPage(port);
        return port;
      } finally {
        starting.delete(serverKey);
      }
    })();
    starting.set(serverKey, promise);
  }
  return promise;
}

export function getDevServerPort(projectId: string): number | undefined {
  return servers.get(projectId)?.port;
}

export function stopDevServer(projectId: string): void {
  const server = servers.get(projectId);
  if (!server) return;
  server.proc.kill();
  servers.delete(projectId);
}


export function stopAllDevServers(): void {
  for (const projectId of [...servers.keys()]) stopDevServer(projectId);
}

for (const signal of ["SIGINT", "SIGTERM", "exit"] as const) {
  process.on(signal, () => stopAllDevServers());
}


export async function initProjectGit(repoDir: string): Promise<void> {
  await $`git -C ${repoDir} init -b main`.quiet();
  await $`git -C ${repoDir} config user.name "Appwright"`.quiet();
  await $`git -C ${repoDir} config user.email "agent@appwright.local"`.quiet();
  await $`git -C ${repoDir} add .`.quiet();
  await $`git -C ${repoDir} commit -m "initial template"`.quiet();
}
