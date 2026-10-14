import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { WORKSPACES_DIR, pruneWorktrees } from "./manager";

export async function pruneAllWorktrees(): Promise<number> {
  if (!existsSync(WORKSPACES_DIR)) return 0;
  const projectIds = (await readdir(WORKSPACES_DIR)).sort();
  await Promise.all(projectIds.map((projectId) => pruneWorktrees(projectId)));
  return projectIds.length;
}
