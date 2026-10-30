#!/usr/bin/env bun
import path from "node:path";
import { PATTERNS } from "../src/patterns/manifest";
import { extractPropsSummary } from "../src/patterns/extract-props";

const PACKAGE_ROOT = path.resolve(import.meta.dir, "..");
const OUTPUT = path.join(PACKAGE_ROOT, "src/patterns/props.generated.ts");
const isCheck = process.argv.includes("--check");

async function propsFor(file: string, exportName: string): Promise<string | null> {
  return extractPropsSummary(await Bun.file(path.join(PACKAGE_ROOT, "patterns", file)).text(), exportName);
}

const entries = await Promise.all(
  [...PATTERNS].sort((left, right) => (left.id < right.id ? -1 : 1)).map(async (pattern) => [pattern.id, await propsFor(pattern.file, pattern.exportName)] as const),
);
const missing = entries.filter(([, props]) => props === null).map(([id]) => id);
if (missing.length > 0) throw new Error(`No Props interface for pattern(s): ${missing.join(", ")}`);

const body = entries.map(([id, props]) => `  ${JSON.stringify(id)}: ${JSON.stringify(props)},`).join("\n");
const contents = `export const PATTERN_PROPS: Readonly<Record<string, string>> = {\n${body}\n};\n`;
const current = (await Bun.file(OUTPUT).exists()) ? await Bun.file(OUTPUT).text() : null;

if (current === contents) {
  console.log("  = src/patterns/props.generated.ts");
} else if (isCheck) {
  console.error("  ✗ src/patterns/props.generated.ts is out of date: run bun run emit:props");
  process.exit(1);
} else {
  await Bun.write(OUTPUT, contents);
  console.log("  ✓ src/patterns/props.generated.ts");
}
