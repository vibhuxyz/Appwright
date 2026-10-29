import type { SuggestedPath } from "@repo/contracts";

export type IntakeAction = "plan" | "send" | "reply";

export function intakeAction(path: SuggestedPath, options: { canReplyInChat: boolean }): IntakeAction {
  switch (path) {
    case "reply":
      return options.canReplyInChat ? "reply" : "send";
    case "plan":
      return "plan";
    case "send-direct":
      return "send";
    default: {
      const unreachable: never = path;
      return unreachable;
    }
  }
}
