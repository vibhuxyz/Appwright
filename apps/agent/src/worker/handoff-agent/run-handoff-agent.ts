import {
  OpenAiProvider,
  runAgentLoop,
  type AgentEventSink,
  type Message,
  type Provider,
  type Runtime,
  type Tool,
} from "@repo/agent-core";
import type { VerificationResult } from "@repo/contracts";
import { worktreeChangeScope } from "../browser-scope";
import { publishStatus, type PersistFields } from "../persist";
import { DELEGATED_STATUS, FINISHED_STATUS, HANDOFF_DEADLINE_MS, HANDOFF_MAX_COST_USD, HANDOFF_MAX_ITERATIONS, HANDOFF_MAX_TOKENS } from "./constants";
import { lastCommitLine } from "./last-commit";
import { createMemoryTool } from "./memory-tool";
import { handoffPrompt } from "./prompt";
import { handoffMessage, parseHandoffSummary } from "./summary";

export interface HandoffInput {
  readonly sessionId: string;
  readonly sessionModel: string;
  readonly worktreeDir: string;
  readonly memory: string;
  readonly verifyResults: readonly VerificationResult[];
  readonly testingNotes: string;
  readonly provider?: Provider;
  readonly runtime: Runtime;
  readonly emit: AgentEventSink;
  readonly signal: AbortSignal;
  readonly persist: (fields: PersistFields) => Promise<unknown>;
  readonly publish?: (detail: string) => void;
}

function handoffProvider(input: Pick<HandoffInput, "provider" | "sessionModel">): Provider {
  if (input.provider) return input.provider;
  const configured = process.env.HANDOFF_AGENT_MODEL?.trim();
  const model = configured && configured.length > 0 ? configured : input.sessionModel;
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

async function contextFor(input: HandoffInput): Promise<{ commit: string; changedPaths: readonly string[] }> {
  const [commit, scope] = await Promise.all([lastCommitLine(input.worktreeDir), worktreeChangeScope(input.worktreeDir)]);
  return { commit, changedPaths: scope?.changedPaths ?? [] };
}

async function askHandoff(input: HandoffInput, prompt: string, tool: Tool): Promise<string | undefined> {
  const messages: Message[] = [{ role: "user", type: "text", content: prompt }];
  const captured = captureFinalText(input.emit);
  const stopReason = await runAgentLoop({
    messages,
    tools: [tool],
    provider: handoffProvider(input),
    runtime: input.runtime,
    emit: captured.emit,
    budget: {
      maxIterations: HANDOFF_MAX_ITERATIONS,
      maxTokens: HANDOFF_MAX_TOKENS,
      maxCostUsd: HANDOFF_MAX_COST_USD,
      deadline: Date.now() + HANDOFF_DEADLINE_MS,
    },
    signal: input.signal,
    sessionId: input.sessionId,
  });
  return stopReason === "completed" ? captured.finalText() : undefined;
}

export async function runHandoffAgent(input: HandoffInput): Promise<void> {
  if (input.signal.aborted) return;
  const publish = input.publish ?? ((detail: string) => publishStatus(input.sessionId, "RUNNING", detail));
  publish(DELEGATED_STATUS);
  const context = await contextFor(input);
  const memory = createMemoryTool(input.runtime);
  const text = await askHandoff(input, handoffPrompt({
    memory: input.memory,
    verifyResults: input.verifyResults,
    testingNotes: input.testingNotes,
    commit: context.commit,
    changedPaths: context.changedPaths,
  }), memory.tool);
  publish(FINISHED_STATUS);
  if (input.signal.aborted) return;
  await input.persist({
    role: "assistant",
    type: "text",
    content: handoffMessage(memory.wrote(), text === undefined ? undefined : parseHandoffSummary(text)),
    data: { handoff: true },
  });
}
