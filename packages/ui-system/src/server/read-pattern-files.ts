import { readFile } from "node:fs/promises";
import path from "node:path";
import type { DeliveredFile, PatternFile } from "../patterns";

export const PATTERNS_SOURCE_DIR = path.resolve(
  import.meta.dir,
  "../../patterns",
);
const USE_CLIENT = '"use client";\n\n';
const COMPONENT_FILE = /\.tsx$/;

export interface ReadPatternOptions {
  readonly useClientDirective: boolean;
}

function insideSourceDir(source: string): string {
  const resolved = path.resolve(PATTERNS_SOURCE_DIR, source);
  if (!resolved.startsWith(`${PATTERNS_SOURCE_DIR}${path.sep}`)) {
    throw new Error(`Pattern file ${source} escapes ${PATTERNS_SOURCE_DIR}`);
  }
  return resolved;
}

export async function readPatternFiles(
  files: readonly PatternFile[],
  options: ReadPatternOptions,
): Promise<DeliveredFile[]> {
  return Promise.all(
    files.map(async (file) => {
      const content = await readFile(insideSourceDir(file.source), "utf8");
      return {
        path: file.target,
        content:
          options.useClientDirective && COMPONENT_FILE.test(file.source)
            ? `${USE_CLIENT}${content}`
            : content,
      };
    }),
  );
}
