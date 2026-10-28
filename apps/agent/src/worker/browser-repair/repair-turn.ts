import { runAgentLoop, type AgentEventSink, type Message, type Provider, type Runtime } from "@repo/agent-core";
import { AGENT_LOOP_LIMITS, loopSpendLimits } from "@repo/contracts";
import { prisma } from "@repo/db";
import { ALL_TOOLS, guardTools } from "@repo/tools";
import { runVerifyStep } from "../verify-step";

export interface RepairTurnDeps {
  readonly messages: Message[];
  readonly provider: Provider;
  readonly runtime: Runtime & { flush(): Promise<void> };
  readonly emit: AgentEventSink;
  readonly signal: AbortSignal;
  readonly sessionId: string;
  readonly userId: string;
  readonly worktreeDir: string;
}

export function createRepairTurn(deps: RepairTurnDeps): (prompt: string) => Promise<boolean> {
  return async (prompt) => {
    const user = await prisma.user.findUnique({ where: { id: deps.userId }, select: { credits: true } });
    deps.messages.push({ role: "user", type: "text", content: prompt });
    const guard = guardTools(ALL_TOOLS);
    const stopReason = await runAgentLoop({
      messages: deps.messages,
      tools: guard.tools,
      provider: deps.provider,
      runtime: deps.runtime,
      emit: deps.emit,
      budget: {
        maxIterations: AGENT_LOOP_LIMITS.maxIterations,
        ...loopSpendLimits(user?.credits ?? 0),
        deadline: Date.now() + AGENT_LOOP_LIMITS.loopDeadlineMs,
      },
      signal: deps.signal,
      sessionId: deps.sessionId,
    });
    if (stopReason !== "completed") return false;
    await deps.runtime.flush();
    const verify = await runVerifyStep({ sessionId: deps.sessionId, worktreeDir: deps.worktreeDir, maxAttempts: 1, history: [] });
    return verify.passed;
  };
}
