import type { AgentTool, AgentToolResult } from "../types";
import { writeProjectFile } from "@repo/contracts";

export const writeFileTool: AgentTool = {
  name: "write_file",
  label: "Write File",
  description: "Overwrite a file inside the project.",
  schema: {
    type: "function",
    function: {
      name: "write_file",
      description: "Write full content to a project file.",
      parameters: {
        type: "object",
        properties: { path: { type: "string" }, content: { type: "string" } },
        required: ["path", "content"],
      },
    },
  },
  execute: async (args): Promise<AgentToolResult> => {
    try {
      await writeProjectFile(args.path, args.content);
      return {
        content: [{ type: "text", text: `wrote ${args.path}` }],
        terminate: false,
      };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `blocked: ${e.message}` }],
        terminate: false,
      };
    }
  },
};
