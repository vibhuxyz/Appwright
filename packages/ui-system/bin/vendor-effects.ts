#!/usr/bin/env bun
import path from "node:path";
import { z } from "zod";
import {
  VENDORED_EFFECTS,
  adaptEffectSource,
  effectBanner,
} from "../src/patterns";

const REPO_ROOT = path.resolve(import.meta.dir, "../../..");
const PATTERNS_DIR = path.join(REPO_ROOT, "packages/ui-system/patterns");
const FETCH_TIMEOUT_MS = 20_000;

const RegistryItemSchema = z.object({
  files: z.array(z.object({ content: z.string().min(1) })).min(1),
});

async function fetchSource(url: string): Promise<string> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!response.ok)
    throw new Error(`Cannot fetch effect ${url}: HTTP ${response.status}`);
  const item = RegistryItemSchema.parse(await response.json());
  const [first] = item.files;
  if (!first) throw new Error(`Effect ${url} has no files`);
  return first.content;
}

const check = process.argv.includes("--check");
const results = await Promise.all(
  VENDORED_EFFECTS.map(async (effect) => {
    const content = `${effectBanner(effect)}${adaptEffectSource(await fetchSource(effect.vendor.url), effect)}`;
    const target = path.join(PATTERNS_DIR, effect.file);
    const file = Bun.file(target);
    const current = (await file.exists()) ? await file.text() : null;
    if (current === content)
      return { file: effect.file, status: "same" as const };
    if (check) return { file: effect.file, status: "drifted" as const };
    await Bun.write(target, content);
    return { file: effect.file, status: "written" as const };
  }),
);

for (const result of results)
  console.log(`  ${result.status.padEnd(8)} ${result.file}`);
if (results.some((result) => result.status === "drifted")) process.exit(1);
