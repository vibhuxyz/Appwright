import type { AgentTool, AgentToolResult } from "../types";
import {
  listProjectPaths,
  readProjectFile,
  writeProjectFile,
} from "@repo/contracts";

const ok = (text: string): AgentToolResult => ({
  content: [{ type: "text", text }],
  terminate: false,
});

export const listFilesTool: AgentTool = {
  name: "list_files",
  label: "List Files",
  description: "List all editable file paths in the project.",
  schema: {
    type: "function",
    function: {
      name: "list_files",
      description:
        "List all editable file paths in the project. Takes no arguments.",
      parameters: { type: "object", properties: {} },
    },
  },
  execute: async (): Promise<AgentToolResult> => {
    const paths = await listProjectPaths();
    return ok(paths.join("\n"));
  },
};

export const readFileTool: AgentTool = {
  name: "read_file",
  label: "Read File",
  description: "Read the contents of a project file by relative path.",
  schema: {
    type: "function",
    function: {
      name: "read_file",
      description: "Read a project file by its relative path.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "relative path, e.g. src/App.tsx",
          },
        },
        required: ["path"],
      },
    },
  },
  execute: async (args: any): Promise<AgentToolResult> => {
    try {
      return ok(await readProjectFile(args.path));
    } catch (e: any) {
      return ok(`error: ${e.message}`);
    }
  },
};

export const writeFileTool: AgentTool = {
  name: "write_file",
  label: "Write File",
  description:
    "Overwrite a project file with full content. Path is relative to the project root.",
  executionMode: "sequential",
  schema: {
    type: "function",
    function: {
      name: "write_file",
      description:
        "Write the full content to a project file (relative path). Overwrites the whole file.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "relative path, e.g. src/App.tsx",
          },
          content: { type: "string", description: "the full file content" },
        },
        required: ["path", "content"],
      },
    },
  },
  execute: async (args: any): Promise<AgentToolResult> => {
    try {
      await writeProjectFile(args.path, args.content);
      return ok(`wrote ${args.path}`);
    } catch (e: any) {
      return ok(`blocked: ${e.message}`);
    }
  },
};

export const editFileTool: AgentTool = {
  name: "edit_file",
  label: "Edit File",
  description:
    "Change an existing file by replacing an exact snippet (old_string -> new_string). The old_string must appear EXACTLY ONCE.",
  executionMode: "sequential",
  schema: {
    type: "function",
    function: {
      name: "edit_file",
      description:
        "Edit an existing project file (relative path) with a targeted replacement. Provide old_string copied verbatim from the file (must match exactly once) and new_string to replace it with. Prefer this over write_file for changes to existing files.",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "relative path, e.g. src/App.tsx",
          },
          old_string: {
            type: "string",
            description:
              "the exact text to replace, copied verbatim from the file including whitespace; must appear exactly once",
          },
          new_string: {
            type: "string",
            description: "the text to replace old_string with",
          },
        },
        required: ["path", "old_string", "new_string"],
      },
    },
  },
  execute: async (args: any): Promise<AgentToolResult> => {
    const { path, old_string, new_string } = args ?? {};
    if (typeof old_string !== "string" || old_string.length === 0) {
      return ok("blocked: old_string is required and must be non-empty.");
    }
    if (old_string === new_string) {
      return ok(
        "blocked: old_string and new_string are identical — nothing to change.",
      );
    }

    let content: string;
    try {
      content = await readProjectFile(path);
    } catch (e: any) {
      return ok(`blocked: cannot read ${path}: ${e.message}`);
    }

    const first = content.indexOf(old_string);
    if (first === -1) {
      return ok(
        `blocked: old_string not found in ${path}. read_file first and copy an exact snippet.`,
      );
    }
    if (content.indexOf(old_string, first + old_string.length) !== -1) {
      return ok(
        `blocked: old_string is not unique in ${path}. Include more surrounding context so it matches exactly once.`,
      );
    }

    try {
      await writeProjectFile(path, content.replace(old_string, new_string));
      return ok(`edited ${path}`);
    } catch (e: any) {
      return ok(`blocked: ${e.message}`);
    }
  },
};

export const devianTools: AgentTool[] = [
  listFilesTool,
  readFileTool,
  writeFileTool,
  editFileTool,
];
