import { readdir } from "node:fs/promises";
import { join } from "node:path";

const APP_DIRECTORIES = ["src/app", "app"] as const;

function isNotFound(error: unknown): boolean {
  return error instanceof Error && "code" in error && (error.code === "ENOENT" || error.code === "ENOTDIR");
}

export async function listPageFiles(workspaceDir: string): Promise<string[]> {
  const listings = await Promise.all(
    APP_DIRECTORIES.map(async (directory) => {
      try {
        const entries = await readdir(join(workspaceDir, directory), { recursive: true });
        return entries.map((entry) => `${directory}/${entry}`);
      } catch (error) {
        if (isNotFound(error)) return [];
        throw error;
      }
    }),
  );
  return listings.flat().sort();
}
