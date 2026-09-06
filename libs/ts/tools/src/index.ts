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

export const TOOLS_VERSION = "0.0.0";

export function hello(): { message: string } {
  return { message: "hello from @repo/tools" };
}

export const listFiles: Tool = {
  name: "list_files",
  description: "List files under a workspace-relative directory.",
  args: listFilesArgs,
  executionMode: "parallel",
  execute: (args, ctx) => listFilesTool(listFilesArgs.parse(args), ctx.runtime),
};

export const readFile: Tool = {
  name: "read_file",
  description: "Read a workspace-relative file, with line numbers.",
  args: readFileArgs,
  executionMode: "parallel",
  execute: (args, ctx) => readFileTool(readFileArgs.parse(args), ctx.runtime),
};

export const writeFile: Tool = {
  name: "write_file",
  description: "Write (overwrite) a workspace-relative file.",
  args: writeFileArgs,
  executionMode: "sequential",
  execute: (args, ctx) => writeFileTool(writeFileArgs.parse(args), ctx.runtime),
};

export const editFile: Tool = {
  name: "edit_file",
  description:
    "Replace an exact, unique substring in a workspace-relative file. Throws if oldString is missing or ambiguous.",
  args: editFileArgs,
  executionMode: "sequential",
  execute: (args, ctx) => editFileTool(editFileArgs.parse(args), ctx.runtime),
};

export const grep: Tool = {
  name: "grep",
  description: "Search for a pattern under a workspace-relative path.",
  args: grepArgs,
  executionMode: "parallel",
  execute: (args, ctx) => grepTool(grepArgs.parse(args), ctx.runtime),
};

export const bash: Tool = {
  name: "bash",
  description: "Run a shell command as an argv array, workspace-scoped.",
  args: bashArgs,
  executionMode: "sequential",
  execute: (args, ctx) => execBash(bashArgs.parse(args), ctx.runtime),
};

export const ALL_TOOLS: Tool[] = [listFiles, readFile, writeFile, editFile, grep, bash];
