import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { $ } from "bun";
import { GLOBALS_CSS_PATH } from "./constants";
import { withThemeImport } from "./theme";
import type { ApplyOptions, ApplyResult, ComposePlan, FileWrite } from "./types";

function assertInsideRoot(rootDir: string, targetPath: string): string {
  const resolved = path.resolve(rootDir, targetPath);
  if (!resolved.startsWith(rootDir)) {
    throw new Error(`Path ${targetPath} escapes root ${rootDir}`);
  }
  return resolved;
}

async function writePlanFiles(workspaceDir: string, writes: FileWrite[]): Promise<string[]> {
  const written: string[] = [];
  for (const item of writes) {
    const fullPath = assertInsideRoot(workspaceDir, item.path);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, item.content, "utf8");
    written.push(item.path);
  }
  return written;
}

async function updateGlobalsCss(workspaceDir: string): Promise<boolean> {
  const cssPath = path.join(workspaceDir, GLOBALS_CSS_PATH);
  if (!existsSync(cssPath)) return false;
  const current = await readFile(cssPath, "utf8");
  const updated = withThemeImport(current);
  if (updated === current) return false;
  await writeFile(cssPath, updated, "utf8");
  return true;
}

async function updatePackageJson(workspaceDir: string, dependencies: string[]): Promise<string[]> {
  const manifestPath = path.join(workspaceDir, "package.json");
  if (!existsSync(manifestPath) || dependencies.length === 0) return [];
  const raw = await readFile(manifestPath, "utf8");
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null) return [];

  const manifest = parsed as { dependencies?: Record<string, string> };
  const currentDeps = manifest.dependencies ?? {};
  const added: string[] = [];

  for (const dep of dependencies) {
    if (!currentDeps[dep]) {
      currentDeps[dep] = "latest";
      added.push(dep);
    }
  }

  if (added.length === 0) return [];
  const sorted: Record<string, string> = {};
  for (const key of Object.keys(currentDeps).sort()) {
    const val = currentDeps[key];
    if (val) sorted[key] = val;
  }
  manifest.dependencies = sorted;
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  return added;
}

async function installDeps(workspaceDir: string, dependencies: string[]): Promise<void> {
  if (dependencies.length === 0) return;
  await $`bun add ${dependencies}`.cwd(workspaceDir).quiet();
}

export async function applyComposition(
  workspaceDir: string,
  plan: ComposePlan,
  options: ApplyOptions = {},
): Promise<ApplyResult> {
  const root = path.resolve(workspaceDir);
  const written = await writePlanFiles(root, plan.writes);
  const updatedCss = await updateGlobalsCss(root);
  if (updatedCss) written.push(GLOBALS_CSS_PATH);

  const updatedDeps = await updatePackageJson(root, plan.dependencies);
  if (options.installDependencies && plan.dependencies.length > 0) {
    await installDeps(root, plan.dependencies);
  }

  return {
    writtenFiles: written,
    installedDependencies: updatedDeps,
  };
}
