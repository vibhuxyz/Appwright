import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const PIXEL_THRESHOLD = 0.1;
const MAX_CHANGED_SHARE = 0.01;

export type BaselineResult =
  | { readonly status: "recorded"; readonly baseline: string }
  | { readonly status: "missing"; readonly baseline: string }
  | { readonly status: "size-changed"; readonly baseline: string; readonly before: string; readonly after: string }
  | { readonly status: "same" | "changed"; readonly baseline: string; readonly changedShare: number };

function isNotFound(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

async function readPng(file: string): Promise<PNG | null> {
  try {
    return PNG.sync.read(await readFile(file));
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export async function compareWithBaseline(
  shot: string,
  baseline: string,
  options: { readonly update: boolean },
): Promise<BaselineResult> {
  if (options.update) {
    await mkdir(path.dirname(baseline), { recursive: true });
    await copyFile(shot, baseline);
    return { status: "recorded", baseline };
  }
  const [before, after] = await Promise.all([readPng(baseline), readPng(shot)]);
  if (!after) throw new Error(`Screenshot ${shot} was not written`);
  if (!before) return { status: "missing", baseline };
  if (before.width !== after.width || before.height !== after.height) {
    return { status: "size-changed", baseline, before: `${before.width}x${before.height}`, after: `${after.width}x${after.height}` };
  }
  const changed = pixelmatch(before.data, after.data, undefined, after.width, after.height, { threshold: PIXEL_THRESHOLD });
  const changedShare = changed / (after.width * after.height);
  return { status: changedShare > MAX_CHANGED_SHARE ? "changed" : "same", baseline, changedShare };
}
