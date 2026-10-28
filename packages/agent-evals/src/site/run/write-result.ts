import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { GenerationResult } from "./result-types";

export async function writeGenerationResult(input: {
  directory: string;
  result: GenerationResult;
  sources: ReadonlyMap<string, string>;
}): Promise<void> {
  const { directory, result, sources } = input;
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "result.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  await Promise.all(
    [...sources.entries()].map(async ([relative, content]) => {
      const target = path.join(directory, "source", relative);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, content, "utf8");
    }),
  );
}
