import type { AgentEvent, AgentEventSink } from "../types";

function summarize(result: string): string {
  const firstLine = result.split("\n").find((l) => l.trim().length > 0) ?? "";
  return firstLine.length > 60 ? `${firstLine.slice(0, 60)}...` : firstLine;
}

// The V0 sink: prints to the terminal. V1 swaps this for one that streams
// over SSE to the browser — the loop itself does not change (D26 design rule).
export function consoleSink(): AgentEventSink {
  let inTextStream = false;

  return (event: AgentEvent) => {
    switch (event.type) {
      case "agent_start":
        break;
      case "text_delta":
        process.stdout.write(event.delta);
        inTextStream = true;
        break;
      case "tool_call_start":
        if (inTextStream) {
          process.stdout.write("\n");
          inTextStream = false;
        }
        console.log(`  ● ${event.toolName}(${JSON.stringify(event.args)})`);
        break;
      case "tool_call_end":
        console.log(`    ✓ ${summarize(event.result)}`);
        break;
      case "tool_error":
        console.log(`    ✗ ${event.error}`);
        break;
      case "usage":
        if (inTextStream) {
          process.stdout.write("\n");
          inTextStream = false;
        }
        console.log(
          `    $${event.costUsd.toFixed(4)}  ${event.inputTokens}↑ ${event.outputTokens}↓`,
        );
        break;
      case "agent_end":
        if (inTextStream) process.stdout.write("\n");
        if (event.stopReason !== "completed") {
          console.log(`\n  [stopped: ${event.stopReason}]`);
        }
        break;
      case "error":
        console.error(`  ✗ ${event.message}`);
        break;
    }
  };
}
