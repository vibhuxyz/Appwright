import type { Runtime, Tool } from "@repo/agent-core";
import { writeFileArgs } from "@repo/tools";
import { HANDOFF_PATH, MAX_PRD_CHARS } from "./constants";
import { isHandoffPath } from "./path";

export function createMemoryTool(runtime: Runtime): { tool: Tool; wrote: () => boolean } {
  let written = false;
  const tool: Tool = {
    name: "write_file",
    description: `Write ${HANDOFF_PATH} only. Any other path is rejected.`,
    args: writeFileArgs,
    executionMode: "sequential",
    async execute(args) {
      const parsed = writeFileArgs.safeParse(args);
      if (!parsed.success) return "Error: path and content are required.";
      if (!isHandoffPath(parsed.data.path)) return `Error: only ${HANDOFF_PATH} can be written.`;
      const content = parsed.data.content.replaceAll("\u0000", "").trim();
      if (content.length === 0) return "Error: the memory file was empty.";
      if (content.length > MAX_PRD_CHARS) return `Error: the memory file is longer than ${MAX_PRD_CHARS} characters.`;
      try {
        await runtime.writeFile(HANDOFF_PATH, `${content}\n`);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return `Error: could not write ${HANDOFF_PATH}: ${reason}`;
      }
      written = true;
      return `Wrote ${HANDOFF_PATH}`;
    },
  };
  return { tool, wrote: () => written };
}
