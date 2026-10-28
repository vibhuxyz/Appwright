import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { $ } from "bun";
import { EFFECTS, PATTERNS, planPatternDelivery } from "@repo/ui-system";
import { PATTERNS_SOURCE_DIR, readPatternFiles } from "@repo/ui-system/server";
import type { DesignCase } from "./cases";
import { showcaseCss, showcasePage } from "./showcase-files";

const REPO_ROOT = path.resolve(import.meta.dir, "../../../..");
const TEMPLATE_DIR = path.join(REPO_ROOT, "templates/nextjs-fullstack");
const GLOBALS_CSS = "src/app/globals.css";
const EXAMPLES_SOURCE = path.join(PATTERNS_SOURCE_DIR, "examples");
const EXAMPLES_TARGET = "src/examples";

export class ShowcaseBuildError extends Error {}

async function writeAll(workspaceDir: string, files: readonly { path: string; content: string }[]): Promise<void> {
  await Promise.all(
    files.map(async (file) => {
      const target = path.join(workspaceDir, file.path);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, file.content, "utf8");
    }),
  );
}

async function exampleFiles(cases: readonly DesignCase[]): Promise<{ path: string; content: string }[]> {
  return Promise.all(
    cases.map(async (designCase) => ({
      path: `${EXAMPLES_TARGET}/${designCase.exampleFile}`,
      content: await readFile(path.join(EXAMPLES_SOURCE, designCase.exampleFile), "utf8"),
    })),
  );
}

export async function buildShowcase(workspaceDir: string, cases: readonly DesignCase[]): Promise<void> {
  const copy = await $`cp -cR ${TEMPLATE_DIR}/. ${workspaceDir}`.quiet().nothrow();
  if (copy.exitCode !== 0) throw new ShowcaseBuildError(`Cannot copy ${TEMPLATE_DIR}: ${copy.stderr.toString().trim()}`);
  const patterns = await readPatternFiles(planPatternDelivery(PATTERNS.map((pattern) => pattern.id), EFFECTS.map((effect) => effect.id)).files, { useClientDirective: true });
  const globals = await readFile(path.join(workspaceDir, GLOBALS_CSS), "utf8");
  await writeAll(workspaceDir, [
    ...patterns,
    ...(await exampleFiles(cases)),
    ...cases.map((designCase) => ({ path: `src/app${designCase.route}/page.tsx`, content: showcasePage(designCase) })),
    { path: GLOBALS_CSS, content: showcaseCss(cases, globals) },
  ]);
  const build = await $`bun run build`.cwd(workspaceDir).quiet().nothrow();
  if (build.exitCode !== 0) {
    const output = `${build.stdout.toString()}\n${build.stderr.toString()}`.trim().slice(-3000);
    throw new ShowcaseBuildError(`next build failed in ${workspaceDir}:\n${output}`);
  }
}
