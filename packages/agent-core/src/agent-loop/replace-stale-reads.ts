import type { Message } from "../types";

const WRITE_TOOLS: ReadonlySet<string> = new Set(["write_file", "edit_file"]);
const LEADING_CURRENT_DIR = /^(?:\.\/)+/;

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(LEADING_CURRENT_DIR, "");
}

function readPath(message: Message): string | undefined {
  if (message.type !== "toolCall" || message.content.toolName !== "read_file") return undefined;
  const path = message.content.args.path;
  return typeof path === "string" ? normalizePath(path) : undefined;
}

export function isFileWrite(toolName: string): boolean {
  return WRITE_TOOLS.has(toolName);
}

export function replaceStaleReads(messages: readonly Message[], editedPath: string): void {
  const target = normalizePath(editedPath);
  const staleIds = new Set<string>();
  for (const message of messages) {
    if (message.type === "toolCall" && readPath(message) === target) staleIds.add(message.toolCallId);
  }
  for (const message of messages) {
    if (message.type !== "toolResponse" || !staleIds.has(message.toolCallId)) continue;
    if (message.content.startsWith("[read ")) continue;
    const lines = message.content.length === 0 ? 0 : message.content.split(/\r?\n/).length;
    message.content = `[read ${target} — ${lines} lines]`;
  }
}
