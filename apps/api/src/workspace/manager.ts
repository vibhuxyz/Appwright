import { rm } from "node:fs/promises";
import path from "node:path";
import { $ } from "bun";

const REPO_ROOT = path.resolve(import.meta.dir, "../../../..");
const TEMPLATES_DIR = path.join(REPO_ROOT, "templates");
export const WORKSPACES_DIR = process.env.WORKSPACE_ROOT!;

const LOCKFILES = ["bun.lock", "bun.lockb", "package-lock.json"];
// Build output too, not just node_modules. A stale `dist/` or `.next/`
// copied into a fresh workspace is worse than slow — the dev server can
// serve the template's prebuilt page instead of the agent's edits, and the
// preview then lies about what was generated.
const BUILD_OUTPUT = ["dist", ".next", ".turbo"];
const RSYNC_EXCLUDES = [
  "node_modules",
  ".git",
  ...LOCKFILES,
  ...BUILD_OUTPUT,
].flatMap((f) => ["--exclude", f]);

export function workspacePath(projectId: string): string {
  return path.join(WORKSPACES_DIR, projectId);
}

// The two-directory model (V1_WEB_APP.md): templates/ is pristine and
// read-only, .workspaces/<projectId> is the agent's mutable copy. Reset =
// wipe + recopy, and it only ever happens here, on project creation — never
// on a follow-up message.
export async function createWorkspace(
  projectId: string,
  templateId: string,
): Promise<string> {
  const src = path.join(TEMPLATES_DIR, templateId);
  const dest = workspacePath(projectId);

  await rm(dest, { recursive: true, force: true });
  await $`rsync -a ${RSYNC_EXCLUDES} ${src}/ ${dest}/`.quiet();

  return dest;
}

export async function deleteWorkspace(projectId: string): Promise<void> {
  await rm(workspacePath(projectId), { recursive: true, force: true });
}

interface DevServer {
  port: number;
  proc: ReturnType<typeof Bun.spawn>;
}

const servers = new Map<string, DevServer>();

const FIRST_PORT = 5174;
const LAST_PORT = 5274;

// Ask the OS whether a port is genuinely free, rather than trusting a
// counter. The counter was module state: an API restart reset it to 5174
// while dev servers spawned by the PREVIOUS process were still alive and
// still holding those ports. The manager then handed 5174 to a new project
// and recorded it, and the preview iframe pointed at a different project's
// app — or, when that orphan was wedged, at nothing at all.
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

async function waitForServer(
  port: number,
  timeoutMs = 30_000,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://localhost:${port}`);
      if (res.ok || res.status < 500) return true;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

const starting = new Map<string, Promise<number>>();

// Next's CLI has no --strictPort — passing it crashes the dev process
// outright, so the port flags have to match the template's dev script.
async function devServerArgs(cwd: string, port: number): Promise<string[]> {
  const pkg = await Bun.file(path.join(cwd, "package.json")).json();
  const devScript: string = pkg.scripts?.dev ?? "";
  if (devScript.includes("next")) {
    return ["bun", "run", "dev", "--", "--port", String(port)];
  }
  return ["bun", "run", "dev", "--", "--port", String(port), "--strictPort"];
}

// bun install + dev server, on an allocated port, tracked in memory (V1 —
// this moves to the DB once more than one API process exists, at V3).
export async function startDevServer(projectId: string): Promise<number> {
  const existing = servers.get(projectId);
  // `killed` alone is not enough — a process that exited on its own (a
  // crash, an OOM) was never killed by us. Returning its port hands the
  // UI an address nothing is listening on.
  if (existing && existing.proc.exitCode === null && !existing.proc.killed) {
    return existing.port;
  }
  if (existing) servers.delete(projectId);

  let promise = starting.get(projectId);
  if (!promise) {
    promise = (async () => {
      try {
        const cwd = workspacePath(projectId);
        // Same undrained-pipe hazard as the dev server below, and worse here:
        // `bun install` is chatty, and if its buffer fills with nobody reading,
        // the child blocks mid-write and `.exited` never resolves — project
        // creation hangs forever with no error to show for it.
        const install = Bun.spawn(["bun", "install"], {
          cwd,
          stdout: "inherit",
          stderr: "inherit",
        });
        const installExit = await install.exited;
        if (installExit !== 0) {
          throw new Error(
            `bun install failed for project ${projectId} (exit ${installExit})`,
          );
        }

        const port = await allocatePort();
        const proc = Bun.spawn(
          await devServerArgs(cwd, port),
          // "inherit", not "pipe". A piped stream nobody reads fills its buffer
          // and then blocks the child mid-write — a dev server that accepts TCP
          // connections and never answers them, which looks exactly like a blank
          // preview. Inheriting sends the output to the API's own log, where it
          // is both drained by the OS and readable when a preview fails.
          { cwd, stdout: "inherit", stderr: "inherit" },
        );
        servers.set(projectId, { port, proc });

        const healthy = await waitForServer(port);
        if (!healthy) {
          proc.kill();
          servers.delete(projectId);
          throw new Error(
            `dev server for project ${projectId} never became healthy on :${port}`,
          );
        }

        return port;
      } finally {
        starting.delete(projectId);
      }
    })();
    starting.set(projectId, promise);
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

// Children are not killed when their parent dies — they get reparented and
// keep running, holding their ports. One API restart left a dev server from
// a deleted session pegged at 100% CPU for half an hour, squatting :5174,
// so the next project's preview pointed at a stranger's app.
export function stopAllDevServers(): void {
  for (const projectId of [...servers.keys()]) stopDevServer(projectId);
}

for (const signal of ["SIGINT", "SIGTERM", "exit"] as const) {
  process.on(signal, () => stopAllDevServers());
}
