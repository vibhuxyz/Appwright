export const INTERRUPTED_TOOL_RESULT = "Error: this tool call was interrupted before it returned a result.";

export interface PairableMessage {
  role: "system" | "user" | "assistant" | "tool";
  tool_calls?: { id: string }[];
  tool_call_id?: string;
}

function toolResultsAfter<T extends PairableMessage>(messages: readonly T[], start: number): T[] {
  const results: T[] = [];
  for (let index = start; index < messages.length; index++) {
    const message = messages[index];
    if (message?.role !== "tool") break;
    results.push(message);
  }
  return results;
}

export function repairToolPairing<T extends PairableMessage>(
  messages: readonly T[],
  makeStub: (toolCallId: string) => T,
): T[] {
  const repaired: T[] = [];
  let index = 0;
  while (index < messages.length) {
    const message = messages[index];
    if (!message) break;
    if (message.role === "tool") {
      index += 1;
      continue;
    }
    repaired.push(message);
    index += 1;
    const calls = message.role === "assistant" ? message.tool_calls : undefined;
    if (!calls || calls.length === 0) continue;
    const callIds = new Set(calls.map((call) => call.id));
    const results = toolResultsAfter(messages, index);
    const answered = new Set<string>();
    for (const result of results) {
      const id = result.tool_call_id ?? "";
      if (!callIds.has(id) || answered.has(id)) continue;
      answered.add(id);
      repaired.push(result);
    }
    for (const call of calls) {
      if (!answered.has(call.id)) repaired.push(makeStub(call.id));
    }
    index += results.length;
  }
  return repaired;
}
