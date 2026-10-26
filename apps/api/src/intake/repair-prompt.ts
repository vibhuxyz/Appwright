import { isRepairPrompt } from "@repo/contracts";

export { isRepairPrompt };

export type IntakeAction = "plan" | "send";

export function intakeAction(input: { prompt: string; isFollowUp: boolean; isNewApp: boolean }): IntakeAction {
  if (input.isFollowUp || isRepairPrompt(input.prompt)) return "send";
  return input.isNewApp ? "plan" : "send";
}
