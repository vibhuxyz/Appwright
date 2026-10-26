import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Msg } from "../schemas/agentSchemas";
import { ToolCallRow } from "./ToolCallRow";

const INITIAL_VISIBLE_COUNT = 4;

export function ToolCallGroup({
  calls,
  responsesByCallId,
  isAgentRunning,
}: {
  calls: readonly Msg[];
  responsesByCallId: ReadonlyMap<string | undefined, Msg>;
  isAgentRunning?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const isRunning =
    Boolean(isAgentRunning) ||
    calls.some((c) => !responsesByCallId.has(c.data?.toolCallId));

  const hasMore = calls.length > INITIAL_VISIBLE_COUNT;
  // When agent is working: show all calls live.
  // When done: show first 4 items, and expand when user clicks "See more".
  const visibleCalls =
    isRunning || expanded || !hasMore
      ? calls
      : calls.slice(0, INITIAL_VISIBLE_COUNT);

  return (
    <div className="space-y-1.5">
      {visibleCalls.map((call) => (
        <ToolCallRow
          key={call.id}
          call={call}
          response={responsesByCallId.get(call.data?.toolCallId)}
        />
      ))}

      {!isRunning && hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-border-soft bg-surface-2 py-2 text-xs font-medium text-foreground-secondary transition-colors hover:border-border hover:bg-surface-3 hover:text-foreground"
        >
          {expanded ? (
            <>
              <span>Show less</span>
              <ChevronUp className="size-3.5" />
            </>
          ) : (
            <>
              <span>See more ({calls.length - INITIAL_VISIBLE_COUNT} more actions)</span>
              <ChevronDown className="size-3.5" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
