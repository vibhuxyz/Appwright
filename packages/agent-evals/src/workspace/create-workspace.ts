import { cp, mkdir, rm, symlink } from "node:fs/promises";
import path from "node:path";

const COPY_EXCLUDED = new Set(["node_modules", "dist", ".vite", ".turbo", ".next"]);

export interface EvalWorkspace {
  readonly projectId: string;
  readonly directory: string;
  dispose(): Promise<void>;
}

export interface CreateWorkspaceParams {
  readonly templateDir: string;
  readonly workspacesRoot: string;
  readonly projectId: string;
}

export async function createWorkspace(params: CreateWorkspaceParams): Promise<EvalWorkspace> {
  const directory = path.join(params.workspacesRoot, params.projectId);
  await mkdir(params.workspacesRoot, { recursive: true });
  await cp(params.templateDir, directory, {
    recursive: true,
    filter: (source) => !COPY_EXCLUDED.has(path.basename(source)),
  });
  await symlink(
    path.join(params.templateDir, "node_modules"),
    path.join(directory, "node_modules"),
    "dir",
  );
  return {
    projectId: params.projectId,
    directory,
    dispose: () => rm(directory, { recursive: true, force: true }),
  };
}
