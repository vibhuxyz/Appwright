import { truncate, type Runtime } from "@repo/agent-core";
import { z } from "zod";
import { isDenied, isGeneratedUiPrimitive, uiPrimitiveImportPath } from "./fence";
import { wrapUntrusted } from "./untrusted";

export const readFileArgs = z.object({ path: z.string() });
export const writeFileArgs = z.object({
  path: z.string(),
  content: z.string(),
});
export const editFileArgs = z.object({
  path: z.string(),
  oldString: z.string(),
  newString: z.string(),
});
export const listFilesArgs = z.object({ path: z.string() });

function withLineNumbers(content: string): string {
  return content
    .split("\n")
    .map((line, i) => `${i + 1}\t${line}`)
    .join("\n");
}

function uiPrimitiveReadStub(relPath: string): string {
  const importPath = uiPrimitiveImportPath(relPath);
  return [
    `This is a generated UI primitive, identical in every project.`,
    `Import it with \`import { … } from "${importPath}"\`.`,
    `Do not read or edit this file. The UI system section in your prompt is the API (variants, sizes, parts).`,
  ].join(" ");
}

export async function readFileTool(
  args: z.infer<typeof readFileArgs>,
  runtime: Runtime,
): Promise<string> {
  if (isDenied(args.path)) throw new Error(`Denied path: ${args.path}`);
  if (isGeneratedUiPrimitive(args.path)) {
    return wrapUntrusted(`read_file:${args.path}`, uiPrimitiveReadStub(args.path));
  }
  const content = await runtime.readFile(args.path);
  return wrapUntrusted(
    `read_file:${args.path}`,
    truncate(withLineNumbers(content)),
  );
}

function assertWritable(relPath: string): void {
  if (isDenied(relPath)) throw new Error(`Denied path: ${relPath}`);
  if (isGeneratedUiPrimitive(relPath)) {
    throw new Error(
      `Denied: ${relPath} is a generated UI primitive. Import it from ${uiPrimitiveImportPath(relPath)} instead of editing it.`,
    );
  }
}

export async function writeFileTool(
  args: z.infer<typeof writeFileArgs>,
  runtime: Runtime,
): Promise<string> {
  assertWritable(args.path);
  await runtime.writeFile(args.path, args.content);
  return wrapUntrusted(
    `write_file:${args.path}`,
    `wrote ${args.content.length} bytes to ${args.path}`,
  );
}

// edit_file — exact-match replace ONLY. Throw if oldString is not found,
// throw if it matches more than once. Never best-effort, never fuzzy (D16).
export async function editFileTool(
  args: z.infer<typeof editFileArgs>,
  runtime: Runtime,
): Promise<string> {
  assertWritable(args.path);
  const content = await runtime.readFile(args.path);

  const occurrences = content.split(args.oldString).length - 1;
  if (occurrences === 0) {
    throw new Error(`oldString not found in ${args.path}`);
  }
  if (occurrences > 1) {
    throw new Error(
      `oldString matches ${occurrences} times in ${args.path}; must match exactly once`,
    );
  }

  const updated = content.replace(args.oldString, args.newString);
  await runtime.writeFile(args.path, updated);
  return wrapUntrusted(`edit_file:${args.path}`, `edited ${args.path}`);
}

export async function listFilesTool(
  args: z.infer<typeof listFilesArgs>,
  runtime: Runtime,
): Promise<string> {
  const entries = await runtime.listDir(args.path);
  return wrapUntrusted(`list_files:${args.path}`, entries.join("\n"));
}
