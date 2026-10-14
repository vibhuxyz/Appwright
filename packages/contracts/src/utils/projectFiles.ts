import type { ProjectFile } from "@repo/contracts";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

const REPO_ROOT = path.resolve(currentDirectory, "../../../..");
const TEMPLATES_DIR = path.join(REPO_ROOT, "templates");

function getProjectsDir(): string {
  return process.env.WORKSPACE_ROOT
    ? path.resolve(REPO_ROOT, process.env.WORKSPACE_ROOT)
    : path.resolve(REPO_ROOT, ".workspaces");
}

const editableExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".jsx",
  ".json",
  ".ts",
  ".tsx",
]);

const ignoredDirectories = new Set([
  "node_modules",
  "dist",
  ".vite",
  ".turbo",
  ".next",
]);

export function workspaceRoot(projectId: string, sessionId?: string): string {
  if (!/^[a-z0-9-]+$/.test(projectId)) {
    throw new Error(`Invalid project id: ${projectId}`);
  }

  const workspaceBase = path.join(getProjectsDir(), projectId);
  const templateBase = path.join(TEMPLATES_DIR, projectId);
  const base = existsSync(workspaceBase)
    ? workspaceBase
    : existsSync(templateBase)
      ? templateBase
      : workspaceBase;

  if (sessionId) {
    const sessionDir = path.join(base, `session-${sessionId}`);
    if (existsSync(sessionDir)) {
      return sessionDir;
    }
  }
  const repoPath = path.join(base, "repo");
  if (existsSync(repoPath)) {
    return repoPath;
  }
  return base;
}

async function walkProject(directory: string): Promise<string[]> {
  try {
    const entries = await readdir(directory, {
      withFileTypes: true,
    });

    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        if (!ignoredDirectories.has(entry.name)) {
          files.push(...(await walkProject(fullPath)));
        }
        continue;
      }

      if (entry.isFile() && editableExtensions.has(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }

    return files;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
      return [];
    }

    throw err;
  }
}

function toProjectPath(
  projectId: string,
  filePath: string,
  sessionId?: string,
): string {
  return path
    .relative(workspaceRoot(projectId, sessionId), filePath)
    .split(path.sep)
    .join("/");
}

export function safeResolve(
  projectId: string,
  relPath: string,
  sessionId?: string,
): string {
  const root = workspaceRoot(projectId, sessionId);
  const full = path.resolve(root, relPath);

  if (full !== root && !full.startsWith(root + path.sep)) {
    throw new Error(`Path escape blocked: ${relPath}`);
  }

  return full;
}

export async function listProjectFiles(
  projectId: string,
  sessionId?: string,
): Promise<ProjectFile[]> {
  const root = workspaceRoot(projectId, sessionId);
  const paths = await walkProject(root);

  const files = await Promise.all(
    paths.map(async (filePath) => ({
      path: toProjectPath(projectId, filePath, sessionId),
      content: await readFile(filePath, "utf8"),
    })),
  );

  return files.sort((a, b) => a.path.localeCompare(b.path));
}

export async function listProjectPaths(
  projectId: string,
  sessionId?: string,
): Promise<string[]> {
  const root = workspaceRoot(projectId, sessionId);
  const paths = await walkProject(root);

  return paths.map((filePath) => toProjectPath(projectId, filePath, sessionId));
}

export async function readProjectFile(
  projectId: string,
  relPath: string,
  sessionId?: string,
): Promise<string> {
  return readFile(safeResolve(projectId, relPath, sessionId), "utf8");
}

export async function writeProjectFile(
  projectId: string,
  relPath: string,
  content: string,
  sessionId?: string,
): Promise<void> {
  const full = safeResolve(projectId, relPath, sessionId);

  await mkdir(path.dirname(full), {
    recursive: true,
  });

  await writeFile(full, content, "utf8");
}
