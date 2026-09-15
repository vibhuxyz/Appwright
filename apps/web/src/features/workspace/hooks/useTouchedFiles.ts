import { useMemo } from "react";
import { useAgentStore } from "@/features/agent/store/agentStore";

const WRITE_TOOLS = new Set(["write_file", "edit_file"]);

// Which files the current run has touched — drives the amber dot in the
// file tree and busts the tree's cache so newly created files show up.
export function useTouchedFiles(): Set<string> {
  const messages = useAgentStore((s) => s.messages);
  return useMemo(
    () =>
      new Set(
        messages
          .filter((m) => m.type === "toolCall" && WRITE_TOOLS.has(m.data?.toolName ?? ""))
          .map((m) => String(m.data?.args?.path)),
      ),
    [messages],
  );
}
