import {
  OpenAiProvider,
  runAgentLoop,
  specialistModel,
  TESTING_ENV_KEY,
  type AgentEventSink,
  type Message,
  type Provider,
} from "@repo/agent-core";
import { createLogger } from "@repo/logger";
import { grep, readFile } from "@repo/tools";
import { TESTING_DEADLINE_MS, TESTING_MAX_COST_USD, TESTING_MAX_ITERATIONS, TESTING_MAX_TOKENS } from "./constants";
import { parseTestingReview } from "./parse-review";
import { testingPrompt } from "./prompt";
import type { ReviewInput, TestingEvidence, TestingReview } from "./types";

const READ_ONLY_TOOLS = [readFile, grep];

function testingBudget(nowMs: number) {
  return {
    maxIterations: TESTING_MAX_ITERATIONS,
    maxTokens: TESTING_MAX_TOKENS,
    maxCostUsd: TESTING_MAX_COST_USD,
    deadline: nowMs + TESTING_DEADLINE_MS,
  };
}

const log = createLogger("testing-agent");

function reviewProvider(input: Pick<ReviewInput, "provider" | "sessionModel" | "plan" | "effort">): Provider {
  if (input.provider) return input.provider;
  const model = specialistModel({
    envKey: TESTING_ENV_KEY,
    sessionModel: input.sessionModel,
    profile: "testing",
    plan: input.plan ?? "MAX",
    ...(input.effort !== undefined ? { effort: input.effort } : {}),
  });
  log.info("testing agent model", { model, sessionModel: input.sessionModel });
  return new OpenAiProvider({ model });
}

function captureFinalText(forward: AgentEventSink): { emit: AgentEventSink; finalText: () => string } {
  let current = "";
  let finalText = "";
  const emit: AgentEventSink = (event) => {
    if (event.type === "text_delta") current += event.delta;
    if (event.type === "tool_call_start") current = "";
    if (event.type === "agent_end" && event.stopReason === "completed") finalText = current;
    return forward(event);
  };
  return { emit, finalText: () => finalText };
}

export async function runTestingAgent(input: {
  readonly evidence: TestingEvidence;
  readonly review: Pick<ReviewInput, "provider" | "sessionModel" | "runtime" | "emit" | "signal" | "sessionId">;
  readonly nowMs: number;
}): Promise<TestingReview | undefined> {
  const messages: Message[] = [{ role: "user", type: "text", content: testingPrompt(input.evidence) }];
  const captured = captureFinalText(input.review.emit);
  const stopReason = await runAgentLoop({
    messages,
    tools: READ_ONLY_TOOLS,
    provider: reviewProvider(input.review),
    runtime: input.review.runtime,
    emit: captured.emit,
    budget: testingBudget(input.nowMs),
    signal: input.review.signal,
    sessionId: input.review.sessionId,
  });
  if (stopReason !== "completed") return undefined;
  return parseTestingReview(captured.finalText());
}
