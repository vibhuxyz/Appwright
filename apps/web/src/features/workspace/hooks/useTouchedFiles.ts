import { useMemo } from "react";
import { useAgentStore } from "@/features/agent/store/agentStore";

const WRITE_TOOLS = new Set(["write_file", "edit_file"]);

// Which files the current run has touched — drives the amber dot in the
// file tree and busts the tree's cache so newly created files show up.
export function useTouchedFiles(): Set<string> {
  const messages = useAgentStore((s) => s.messages);
  return useMemo(() => {
    const paths = new Set<string>();
    for (const message of messages) {
      if (message.type !== "toolCall") continue;
      if (!WRITE_TOOLS.has(message.data?.toolName ?? "")) continue;
      const relPath = message.data?.args?.path;
      if (typeof relPath === "string" && relPath.length > 0) {
        paths.add(relPath);
      }
    }
    return paths;
  }, [messages]);
}
