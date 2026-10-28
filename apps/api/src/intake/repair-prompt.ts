import { isRepairPrompt } from "@repo/contracts";

export { isRepairPrompt };

export type IntakeAction = "plan" | "send" | "reply";

export function intakeAction(input: {
  prompt: string;
  isFollowUp: boolean;
  isNewApp: boolean;
  isChat?: boolean;
}): IntakeAction {
  if (isRepairPrompt(input.prompt)) return "send";
  if (input.isChat) return "reply";
  if (input.isFollowUp) return "send";
  return input.isNewApp ? "plan" : "send";
}
