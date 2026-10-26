import type { Tool } from "@repo/agent-core";
import {
  editFileArgs,
  editFileTool,
  listFilesArgs,
  listFilesTool,
  readFileArgs,
  readFileTool,
  writeFileArgs,
  writeFileTool,
} from "./fs";
import { grepArgs, grepTool } from "./search";
import { bashArgs, execBash } from "./shell";

export * from "./fence";
export * from "./untrusted";
export * from "./fs";
export * from "./shell";
export * from "./search";
export * from "./git";
export {
  ConflictResolution,
  ConflictSide,
  ResolveConflictsRequest,
  detectConflicts,
  resolveConflicts,
  withRepoLock,
} from "./conflict";
export type { ConflictFile, ConflictReport, ResolveResult } from "./conflict";
export { guardTools, type RunGuardStats } from "./run-guard";

export const TOOLS_VERSION = "0.0.0";

export function hello(): { message: string } {
  return { message: "hello from @repo/tools" };
}

export const listFiles: Tool = {
  name: "list_files",
  description: "List files under a workspace-relative directory.",
  capabilityHint: "Inspect workspace file tree and discover existing structure.",
  args: listFilesArgs,
  executionMode: "parallel",
  execute: (args, ctx) => listFilesTool(listFilesArgs.parse(args), ctx.runtime),
};

export const readFile: Tool = {
  name: "read_file",
  description: "Read a workspace-relative file, with line numbers.",
  capabilityHint: "Read existing code and configuration before making changes.",
  args: readFileArgs,
  executionMode: "parallel",
  execute: (args, ctx) => readFileTool(readFileArgs.parse(args), ctx.runtime),
};

export const writeFile: Tool = {
  name: "write_file",
  description: "Write (overwrite) a workspace-relative file.",
  capabilityHint: "Create new components, styles, or overwrite files cleanly.",
  args: writeFileArgs,
  executionMode: "sequential",
  execute: (args, ctx) => writeFileTool(writeFileArgs.parse(args), ctx.runtime),
};

export const editFile: Tool = {
  name: "edit_file",
  description:
    "Replace an exact, unique substring in a workspace-relative file. Throws if oldString is missing or ambiguous.",
  capabilityHint: "Surgically patch existing files without altering untouched code.",
  args: editFileArgs,
  executionMode: "sequential",
  execute: (args, ctx) => editFileTool(editFileArgs.parse(args), ctx.runtime),
};

export const grep: Tool = {
  name: "grep",
  description: "Search for a pattern under a workspace-relative path.",
  capabilityHint: "Search code identifiers, imports, or text across the workspace.",
  args: grepArgs,
  executionMode: "parallel",
  execute: (args, ctx) => grepTool(grepArgs.parse(args), ctx.runtime),
};

export const bash: Tool = {
  name: "bash",
  description: "Run a shell command as an argv array, workspace-scoped.",
  capabilityHint:
    "Run commands (strictly guarded by deps.allow.json — unauthorized npm installs blocked).",
  args: bashArgs,
  executionMode: "sequential",
  execute: (args, ctx) => execBash(bashArgs.parse(args), ctx.runtime),
};

export const ALL_TOOLS: Tool[] = [
  listFiles,
  readFile,
  writeFile,
  editFile,
  grep,
  bash,
];

/**
 * Dynamically formats all registered tools and their capabilities for use in
 * system prompts, planners, and prompt enhancers. Automatically reflects any
 * new tools added to ALL_TOOLS without modifying prompt templates.
 */
export function describeTools(tools: Tool[] = ALL_TOOLS): string {
  return tools
    .map((t) => {
      const hint = t.capabilityHint ? ` (${t.capabilityHint})` : "";
      return `- \`${t.name}\`: ${t.description}${hint}`;
    })
    .join("\n");
}
