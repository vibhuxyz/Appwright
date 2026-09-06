import type { ProjectFile } from "@repo/contracts";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

// D28 — /workspace is the only root, presented identically by every runtime
// (local, Docker, E2B). Locally that constant maps onto wherever the actual
// project template lives; that mapping is this one line, not one per tool.
// `apps/projects` was deleted 2026-08-10 — do not repoint at another
// relative path, it will rot the same way.
const PROJECTS_DIR =
  process.env.WORKSPACE_ROOT ??
  // currentDirectory: libs/ts/contracts/src/utils — five levels up is the repo root.
  path.resolve(currentDirectory, "../../../../../templates");

const editableExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".jsx",
  ".json",
  ".ts",
  ".tsx",
]);

const ignoredDirectories = new Set(["node_modules", "dist", ".vite", ".turbo", ".next"]);

export function workspaceRoot(projectId: string): string {
  if (!/^[a-z0-9-]+$/.test(projectId)) {
    throw new Error(`Invalid project id: ${projectId}`);
  }

  return path.join(PROJECTS_DIR, projectId);
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
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return [];
    }

    throw err;
  }
}

function toProjectPath(projectId: string, filePath: string): string {
  return path
    .relative(workspaceRoot(projectId), filePath)
    .split(path.sep)
    .join("/");
}

export function safeResolve(projectId: string, relPath: string): string {
  const root = workspaceRoot(projectId);
  const full = path.resolve(root, relPath);

  if (full !== root && !full.startsWith(root + path.sep)) {
    throw new Error(`Path escape blocked: ${relPath}`);
  }

  return full;
}

export async function listProjectFiles(
  projectId: string,
): Promise<ProjectFile[]> {
  const root = workspaceRoot(projectId);
  const paths = await walkProject(root);

  const files = await Promise.all(
    paths.map(async (filePath) => ({
      path: toProjectPath(projectId, filePath),
      content: await readFile(filePath, "utf8"),
    })),
  );

  return files.sort((a, b) => a.path.localeCompare(b.path));
}

export async function listProjectPaths(projectId: string): Promise<string[]> {
  const root = workspaceRoot(projectId);
  const paths = await walkProject(root);

  return paths.map((filePath) => toProjectPath(projectId, filePath));
}

export async function readProjectFile(
  projectId: string,
  relPath: string,
): Promise<string> {
  return readFile(safeResolve(projectId, relPath), "utf8");
}

export async function writeProjectFile(
  projectId: string,
  relPath: string,
  content: string,
): Promise<void> {
  const full = safeResolve(projectId, relPath);

  await mkdir(path.dirname(full), {
    recursive: true,
  });

  await writeFile(full, content, "utf8");
}
