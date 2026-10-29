import type { Msg } from "../../schemas/agentSchemas";

export type ActivityKind = "file" | "shell" | "status";

export interface ActivityChipModel {
  readonly id: string;
  readonly kind: ActivityKind;
  readonly label: string;
  readonly path?: string;
  readonly calls: readonly Msg[];
}

const VIEW_TOOLS: ReadonlySet<string> = new Set(["read_file", "list_files", "grep"]);
const CHANGE_VERBS: Readonly<Record<string, string>> = { write_file: "Created", edit_file: "Edited", delete_file: "Deleted" };
function toolName(call: Msg): string {
  return call.data?.toolName ?? call.content;
}

function argText(call: Msg, keys: readonly string[]): string | undefined {
  const args = call.data?.args;
  for (const key of keys) {
    const value = args?.[key];
    if (typeof value === "string" && value.trim()) return value.replace(/\s+/g, " ").trim();
  }
  return undefined;
}

function displayPath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function commandOf(call: Msg): string {
  const argv = call.data?.args?.argv;
  if (Array.isArray(argv) && argv.every((part) => typeof part === "string") && argv.length > 0) return argv.join(" ");
  return argText(call, ["command", "cmd"]) ?? "bash";
}

function oneFileChip(calls: readonly Msg[], verb: string, manyLabel: string): ActivityChipModel | undefined {
  const first = calls[0];
  if (!first) return undefined;
  const path = argText(first, ["path", "pattern", "query"]);
  if (calls.length === 1 && path) return { id: first.id, kind: "file", label: verb, path: displayPath(path), calls };
  return { id: first.id, kind: "file", label: manyLabel, calls };
}

function fileChips(calls: readonly Msg[], isRunning: boolean): ActivityChipModel[] {
  const views = calls.filter((call) => VIEW_TOOLS.has(toolName(call)));
  const changes = calls.filter((call) => toolName(call) in CHANGE_VERBS);
  const viewVerb = isRunning ? "Viewing" : "Viewed";
  const counts = new Map<string, number>();
  for (const call of changes) {
    const name = CHANGE_VERBS[toolName(call)] ?? "Changed";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const changeLabel = `${[...counts].map(([name, count]) => `${name} ${count}`).join(", ")} files`;
  const firstChange = changes[0];
  const singleChangeVerb = firstChange ? (CHANGE_VERBS[toolName(firstChange)] ?? "Changed") : "Changed";
  return [oneFileChip(changes, singleChangeVerb, changeLabel), oneFileChip(views, viewVerb, `${viewVerb} ${views.length} paths`)].flatMap((chip) => (chip ? [chip] : []));
}

function shellChip(calls: readonly Msg[]): ActivityChipModel | undefined {
  const shells = calls.filter((call) => toolName(call) === "bash");
  const first = shells[0];
  if (!first) return undefined;
  const command = commandOf(first);
  const label = shells.length > 1 ? `$ ${command} (+${shells.length - 1} more)` : `$ ${command}`;
  return { id: first.id, kind: "shell", label, calls: shells };
}

function statusChip(calls: readonly Msg[]): ActivityChipModel | undefined {
  const known = new Set([...VIEW_TOOLS, ...Object.keys(CHANGE_VERBS), "bash"]);
  const others = calls.filter((call) => !known.has(toolName(call)));
  const first = others[0];
  if (!first) return undefined;
  const names = [...new Set(others.map(toolName))].sort();
  return { id: first.id, kind: "status", label: names.join(", "), calls: others };
}

export function activityChips(
  calls: readonly Msg[],
  results: ReadonlyMap<string | undefined, { content: string }>,
): ActivityChipModel[] {
  const isRunning = calls.some((call) => !results.has(call.data?.toolCallId));
  return [...fileChips(calls, isRunning), shellChip(calls), statusChip(calls)].flatMap((chip) => (chip ? [chip] : []));
}
