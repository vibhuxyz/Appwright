import type { Msg } from "../../schemas/agentSchemas";

export type ToolGroupIcon = "view" | "edit" | "command" | "other";

export interface ToolGroupSummary {
  icon: ToolGroupIcon;
  label: string;
  isRunning: boolean;
  hasFailure: boolean;
}

const VIEW_TOOLS: ReadonlySet<string> = new Set(["read_file", "list_files", "grep"]);
const CHANGE_VERBS: Readonly<Record<string, string>> = { write_file: "Created", edit_file: "Edited", delete_file: "Deleted" };
const COMMAND_TOOL = "bash";
const MAX_LABEL_CHARS = 120;
const FAILURE_PREFIX = "Error:";

function argText(call: Msg, keys: readonly string[]): string | null {
  const args = call.data?.args;
  for (const key of keys) {
    const value = args?.[key];
    if (typeof value === "string" && value.trim()) return value.replace(/\s+/g, " ").trim();
  }
  return null;
}

function viewPart(calls: readonly Msg[], isRunning: boolean): string | null {
  if (calls.length === 0) return null;
  const path = calls.length === 1 && calls[0] ? argText(calls[0], ["path", "pattern", "query"]) : null;
  if (path) return `${isRunning ? "Viewing" : "Viewed"} ${path}`;
  return `${isRunning ? "Viewing" : "Viewed"} ${calls.length} paths`;
}

function changePart(calls: readonly Msg[]): string | null {
  const only = calls.length === 1 ? calls[0] : undefined;
  const onlyPath = only ? argText(only, ["path", "file_path", "filePath"]) : null;
  if (only && onlyPath) return `${CHANGE_VERBS[only.data?.toolName ?? ""] ?? "Changed"} ${onlyPath}`;
  const counts = new Map<string, number>();
  for (const call of calls) {
    const verb = CHANGE_VERBS[call.data?.toolName ?? ""] ?? "Changed";
    counts.set(verb, (counts.get(verb) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  return `${[...counts].map(([verb, count]) => `${verb} ${count}`).join(", ")} files`;
}

function commandPart(calls: readonly Msg[]): string | null {
  const first = calls[0];
  if (!first) return null;
  const command = argText(first, ["command", "cmd"]) ?? COMMAND_TOOL;
  return calls.length > 1 ? `$ ${command} (+${calls.length - 1} more)` : `$ ${command}`;
}

function iconFor(view: string | null, change: string | null, command: string | null): ToolGroupIcon {
  if (change) return "edit";
  if (command) return "command";
  return view ? "view" : "other";
}

export function summarizeToolGroup(
  calls: readonly Msg[],
  results: ReadonlyMap<string | undefined, { content: string }>,
): ToolGroupSummary {
  const isRunning = calls.some((call) => !results.has(call.data?.toolCallId));
  const hasFailure = calls.some((call) => results.get(call.data?.toolCallId)?.content.startsWith(FAILURE_PREFIX) === true);
  const toolName = (call: Msg) => call.data?.toolName ?? call.content;
  const view = viewPart(calls.filter((call) => VIEW_TOOLS.has(toolName(call))), isRunning);
  const change = changePart(calls.filter((call) => toolName(call) in CHANGE_VERBS));
  const command = commandPart(calls.filter((call) => toolName(call) === COMMAND_TOOL));
  const known = new Set([...VIEW_TOOLS, ...Object.keys(CHANGE_VERBS), COMMAND_TOOL]);
  const others = [...new Set(calls.map(toolName).filter((name) => !known.has(name)))].sort();
  const label = [change, view, command, others.length > 0 ? `Ran ${others.join(", ")}` : null]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
  const capped = label.length > MAX_LABEL_CHARS ? `${label.slice(0, MAX_LABEL_CHARS - 1)}…` : label;
  return { icon: iconFor(view, change, command), label: capped, isRunning, hasFailure };
}
