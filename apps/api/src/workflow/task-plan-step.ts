import {
  formatPlanForAgent,
  planTasks,
  type Message as CoreMessage,
  type OpenAiProvider,
  type Runtime,
} from "@repo/agent-core";
import { log } from "../log";
import { publishStatus } from "../stream/sse";

export interface PlanStepParams {
  sessionId: string;
  prompt: string;
  runtime: Runtime;
  provider: OpenAiProvider;
  persist: (fields: {
    role: string;
    type: string;
    content: string;
    data?: Record<string, unknown>;
  }) => Promise<unknown>;
}

export async function runTaskPlanStep(
  params: PlanStepParams,
): Promise<CoreMessage | undefined> {
  const { sessionId, prompt, runtime, provider, persist } = params;
  try {
    const tasks = await planTasks(runtime, provider, prompt);
    await persist({
      role: "assistant",
      type: "text",
      content: `Plan:\n${tasks.map((t, i) => `${i + 1}. ${t}`).join("\n")}`,
    });
    publishStatus(sessionId, "RUNNING", "Plan formulated. Executing tasks…");
    return {
      role: "user",
      type: "text",
      content: formatPlanForAgent(tasks),
    };
  } catch (err) {
    log.error("planning failed, continuing without a plan", {
      sessionId,
      err: String(err),
    });
    return undefined;
  }
}
