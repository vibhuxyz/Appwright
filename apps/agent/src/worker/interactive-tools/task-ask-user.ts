import type { Tool } from "@repo/agent-core";
import { AGENT_LOOP_LIMITS, AskUserArgsSchema } from "@repo/contracts";
import { askUser } from "./ask-user";
import type { InteractiveToolContext } from "./types";

export const TASK_ASK_USER_WAIT_MS = 60_000;
export const MAX_TASK_QUESTIONS_PER_RUN = 1;

const ALREADY_ASKED =
  "The user was already asked a question during this build. Do not ask again: choose the most sensible default, build it, and say which default you used.";

const DESCRIPTION =
  "Ask the user 1-2 short multiple-choice questions when a task cannot be built correctly without a choice only the " +
  "user can make. Only one question round is allowed for the whole build and it waits about a minute, so prefer " +
  "sensible defaults. Set defaultOptionIndex to the option you recommend. Never ask for API keys, secrets or passwords.";

export type TaskInteractiveContext = Omit<InteractiveToolContext, "deadlineAt">;

export function createTaskAskUserTool(ctx: TaskInteractiveContext): Tool {
  const usage = { callsMade: 0 };
  return {
    name: "ask_user",
    description: DESCRIPTION,
    capabilityHint: "Ask the user one round of multiple-choice questions during the build.",
    args: AskUserArgsSchema,
    executionMode: "sequential",
    execute: async (args) => {
      const deadlineAt = Date.now() + AGENT_LOOP_LIMITS.taskDeadlineMs;
      const call = () => askUser({ ...ctx, deadlineAt }, args, TASK_ASK_USER_WAIT_MS);
      if (!AskUserArgsSchema.safeParse(args).success) return call();
      if (usage.callsMade >= MAX_TASK_QUESTIONS_PER_RUN) return ALREADY_ASKED;
      usage.callsMade += 1;
      return call();
    },
  };
}
