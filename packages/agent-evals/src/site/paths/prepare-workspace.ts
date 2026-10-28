import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { $ } from "bun";
import { LocalRuntime } from "@repo/agent-core";
import { PROJECT_ID_PREFIX, SITE_TEMPLATE } from "../constants";

export class WorkspaceCloneError extends Error {}

export interface SiteWorkspace {
  readonly projectId: string;
  readonly directory: string;
  readonly runtime: LocalRuntime;
  dispose(): Promise<void>;
}

export async function cloneTemplate(templateDir: string, directory: string): Promise<void> {
  await mkdir(directory, { recursive: true });
  const copy = await $`cp -cR ${templateDir}/. ${directory}`.quiet().nothrow();
  if (copy.exitCode !== 0) throw new WorkspaceCloneError(`Cannot clone ${templateDir}: ${copy.stderr.toString().trim()}`);
  await rm(path.join(directory, ".next"), { recursive: true, force: true });
  const init = await $`git init -q`.cwd(directory).quiet().nothrow();
  if (init.exitCode !== 0) throw new WorkspaceCloneError(`Cannot git init ${directory}: ${init.stderr.toString().trim()}`);
}

export async function prepareWorkspace(input: {
  templatesRoot: string;
  workspacesRoot: string;
  briefId: string;
  group: string;
  runId: string;
}): Promise<SiteWorkspace> {
  const projectId = `${PROJECT_ID_PREFIX}-${input.runId}-${input.briefId}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const groupRoot = path.join(input.workspacesRoot, input.group);
  process.env.WORKSPACE_ROOT = groupRoot;
  const directory = path.join(groupRoot, projectId);
  await cloneTemplate(path.join(input.templatesRoot, SITE_TEMPLATE), directory);
  return { projectId, directory, runtime: new LocalRuntime(projectId), dispose: () => rm(directory, { recursive: true, force: true }) };
}
