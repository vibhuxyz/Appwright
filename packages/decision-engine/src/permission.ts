export type SessionPermissionMode =
  | "default"
  | "accept-edits"
  | "bypass"
  | "plan";

export interface PermissionPolicyCheck {
  toolName: string;
  args?: Record<string, unknown>;
  mode?: SessionPermissionMode;
  allowedTools?: readonly string[];
}

const READ_ONLY_TOOLS = new Set(["read_file", "list_files", "grep"]);
const FILE_MUTATION_TOOLS = new Set(["write_file", "edit_file"]);

function isAlwaysAskBashCommand(args?: Record<string, unknown>): boolean {
  if (!args) return false;
  const command = args.command;
  if (typeof command === "string") {
    return command.includes("git push") || command.includes("curl") || command.includes("wget");
  }
  const cmdList = args.cmd;
  if (Array.isArray(cmdList)) {
    const joined = cmdList.join(" ");
    return joined.includes("git push") || joined.includes("curl") || joined.includes("wget");
  }
  return false;
}

export function requiresApproval(check: PermissionPolicyCheck): boolean {
  const mode = check.mode ?? "default";
  const toolName = check.toolName;

  if (READ_ONLY_TOOLS.has(toolName)) {
    return false;
  }

  if (toolName === "bash" && isAlwaysAskBashCommand(check.args)) {
    return true;
  }

  if (check.allowedTools?.includes(toolName)) {
    return false;
  }

  if (toolName === "bash") {
    return mode !== "bypass";
  }

  if (FILE_MUTATION_TOOLS.has(toolName)) {
    if (mode === "accept-edits" || mode === "bypass") {
      return false;
    }
    return true;
  }

  return true;
}

export function isDeniedInMode(check: PermissionPolicyCheck): boolean {
  if (check.mode !== "plan") return false;
  return !READ_ONLY_TOOLS.has(check.toolName);
}
