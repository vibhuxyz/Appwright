#!/usr/bin/env bun
import path from "node:path";
import {
  CLIENT_COMPONENTS,
  COMPONENT_FILES,
  renderComponent,
} from "../src/emit/components";
import { emitTokensCss } from "../src/emit/css";

// Templates are copied to `.workspaces/<id>/` and run standalone, outside
// the monorepo — they cannot `import "@repo/ui-system"` at runtime. So the
// tokens are emitted INTO each template as a generated CSS file.
//
// That is a real trade-off, recorded here rather than hidden: a generated
// artifact can drift from its source if someone edits it by hand or forgets
// to re-run this. `--check` is the answer — it fails loudly instead of
// letting two design systems quietly appear, which is the exact failure
// V1.1 exists to prevent.

const REPO_ROOT = path.resolve(import.meta.dir, "../../../..");

interface Target {
  /** Where the generated tokens stylesheet goes. */
  tokensCss: string;
  /** Where `src/components/ui/` lives for this template. */
  componentsDir: string;
  /** Next needs "use client"; Vite does not, and adding it there only
   *  produces a bundler warning about a module-level directive. */
  useClientDirectives: boolean;
}

const TARGETS: Target[] = [
  {
    tokensCss: "templates/vite-react/src/tokens.css",
    componentsDir: "templates/vite-react/src/components/ui",
    useClientDirectives: false,
  },
  {
    tokensCss: "templates/nextjs-fullstack/src/app/tokens.css",
    componentsDir: "templates/nextjs-fullstack/src/components/ui",
    useClientDirectives: true,
  },
];

const check = process.argv.includes("--check");
let drifted = false;

async function sync(rel: string, contents: string): Promise<void> {
  const abs = path.join(REPO_ROOT, rel);
  const file = Bun.file(abs);
  const current = (await file.exists()) ? await file.text() : null;

  if (current === contents) {
    console.log(`  = ${rel}`);
    return;
  }
  if (check) {
    console.error(`  ✗ ${rel} is out of date with libs/ts/ui-system/`);
    drifted = true;
    return;
  }
  await Bun.write(abs, contents);
  console.log(`  ✓ ${rel}`);
}

const css = emitTokensCss();
const componentSrc = path.join(REPO_ROOT, "libs/ts/ui-system/components");

for (const target of TARGETS) {
  await sync(target.tokensCss, css);
  for (const file of COMPONENT_FILES) {
    const source = await Bun.file(path.join(componentSrc, file)).text();
    const needsUseClient =
      target.useClientDirectives && CLIENT_COMPONENTS.has(file);
    await sync(
      path.join(target.componentsDir, file),
      renderComponent(file, source, needsUseClient),
    );
  }
}

if (drifted) {
  console.error(
    "\nRun `bun --filter @repo/ui-system emit` and commit the result.",
  );
  process.exit(1);
}
