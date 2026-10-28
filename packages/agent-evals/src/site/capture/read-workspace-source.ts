import { readFile } from "node:fs/promises";
import path from "node:path";

const SOURCE_GLOB = "{src,public}/**/*";
const MAX_SOURCE_BYTES = 400_000;
const TEXT_EXTENSIONS = /\.(tsx?|jsx?|css|json|md|svg|mjs)$/;

export interface WorkspaceSource {
  readonly files: ReadonlyMap<string, string>;
  readonly skipped: readonly { readonly path: string; readonly reason: string }[];
}

export async function readWorkspaceSource(workspaceDir: string): Promise<WorkspaceSource> {
  const files = new Map<string, string>();
  const skipped: { path: string; reason: string }[] = [];
  const paths = (await Array.fromAsync(new Bun.Glob(SOURCE_GLOB).scan({ cwd: workspaceDir }))).sort();
  for (const relative of paths) {
    if (!TEXT_EXTENSIONS.test(relative)) continue;
    const content = await readFile(path.join(workspaceDir, relative), "utf8");
    if (Buffer.byteLength(content, "utf8") > MAX_SOURCE_BYTES) {
      skipped.push({ path: relative, reason: `larger than ${MAX_SOURCE_BYTES} bytes` });
      continue;
    }
    files.set(relative, content);
  }
  return { files, skipped };
}
