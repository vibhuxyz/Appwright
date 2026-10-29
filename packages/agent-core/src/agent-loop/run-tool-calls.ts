import type { PendingToolCall } from "../collect-turn";
import { truncate } from "../engine/truncate";
import type { Runtime } from "../runtime";
import type { AgentEventSink, Message } from "../types";
import { isFileWrite, replaceStaleReads } from "./replace-stale-reads";

interface ExecutableTool {
  readonly executionMode: "parallel" | "sequential";
  execute(args: unknown, ctx: { runtime: Runtime }): Promise<string>;
}

export interface RunToolCallsInput {
  readonly calls: readonly PendingToolCall[];
  readonly toolsByName: ReadonlyMap<string, ExecutableTool>;
  readonly messages: Message[];
  readonly runtime: Runtime;
  readonly signal: AbortSignal;
  readonly sessionId: string;
  readonly emit: AgentEventSink;
  readonly nextSeq: () => number;
  readonly openCallIds: Set<string>;
  readonly onApprovalRequired?: (call: {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
  }) => Promise<{ approved: boolean; reason?: string }>;
}

function pathFrom(call: PendingToolCall): string | undefined {
  if (!isFileWrite(call.toolName)) return undefined;
  if (typeof call.args !== "object" || call.args === null || !("path" in call.args)) return undefined;
  const path = call.args.path;
  return typeof path === "string" ? path : undefined;
}

async function executeCall(call: PendingToolCall, input: RunToolCallsInput): Promise<{ text: string; failed: boolean }> {
  if (call.argsError) return { text: `Error: ${call.argsError}`, failed: true };
  if (input.onApprovalRequired) {
    const approval = await input.onApprovalRequired({
      toolCallId: call.toolCallId,
      toolName: call.toolName,
      args: (call.args as Record<string, unknown>) ?? {},
    });
    if (!approval.approved) return { text: approval.reason ?? "User denied permission for this action", failed: true };
  }
  const tool = input.toolsByName.get(call.toolName);
  if (!tool) return { text: `Error: unknown tool "${call.toolName}"`, failed: true };
  try {
    return { text: await tool.execute(call.args, { runtime: input.runtime }), failed: false };
  } catch (error) {
    return { text: `Error: ${error instanceof Error ? error.message : String(error)}`, failed: true };
  }
}

async function runOne(call: PendingToolCall, input: RunToolCallsInput): Promise<void> {
  await input.emit({
    type: "tool_call_start",
    seq: input.nextSeq(),
    sessionId: input.sessionId,
    toolCallId: call.toolCallId,
    toolName: call.toolName,
    args: call.args as Record<string, unknown>,
    providerMeta: call.providerMeta,
  });
  input.openCallIds.add(call.toolCallId);
  const { text, failed } = await executeCall(call, input);
  if (failed) {
    await input.emit({ type: "tool_error", seq: input.nextSeq(), sessionId: input.sessionId, toolCallId: call.toolCallId, error: text });
  } else {
    await input.emit({ type: "tool_call_end", seq: input.nextSeq(), sessionId: input.sessionId, toolCallId: call.toolCallId, result: text });
  }
  input.openCallIds.delete(call.toolCallId);
  input.messages.push({ role: "tool", type: "toolResponse", toolCallId: call.toolCallId, content: truncate(text) });
  const edited = failed ? undefined : pathFrom(call);
  if (edited) replaceStaleReads(input.messages, edited);
}

export async function runToolCalls(input: RunToolCallsInput): Promise<"cancelled" | "ran"> {
  const sequential = input.calls.filter((call) => input.toolsByName.get(call.toolName)?.executionMode !== "parallel");
  const parallel = input.calls.filter((call) => !sequential.includes(call));
  await Promise.all(parallel.map((call) => runOne(call, input)));
  for (const call of sequential) {
    if (input.signal.aborted) return "cancelled";
    await runOne(call, input);
  }
  return "ran";
}
