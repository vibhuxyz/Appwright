import { useEffect, useRef } from "react";
import { Loader2, Sparkles, Square } from "lucide-react";
import type { Msg } from "../schemas/agentSchemas";
import { ToolCallRow } from "./ToolCallRow";

function EmptyState() {
  return (
    <div className="m-auto max-w-70 text-center">
      <Sparkles className="mx-auto size-7 text-muted" />
      <p className="mt-3 text-[13px] text-foreground-secondary">
        Describe the app you want. The agent plans it, writes the files, and the preview
        updates itself.
      </p>
    </div>
  );
}

export function MessageList({
  messages,
  delta,
  running,
  statusDetail,
  onStop,
}: {
  messages: Msg[];
  delta: string;
  running: boolean;
  statusDetail: string;
  onStop: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, delta, running]);

  const responsesByCallId = new Map(
    messages.filter((m) => m.type === "toolResponse").map((m) => [m.data?.toolCallId, m]),
  );
  const visible = messages.filter((m) => m.type !== "toolResponse");

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-auto p-4">
      {visible.length === 0 && !delta && !running && <EmptyState />}

      {visible.map((m) =>
        m.type === "toolCall" ? (
          <ToolCallRow
            key={m.id}
            call={m}
            response={responsesByCallId.get(m.data?.toolCallId)}
          />
        ) : m.role === "user" ? (
          // The user's own words get a card; the agent's replies are plain
          // text, so the transcript reads as one voice answering a brief.
          <div
            key={m.id}
            className="rounded-2xl border border-border bg-surface-2 px-3.5 py-3 text-[13px] leading-relaxed whitespace-pre-wrap text-foreground"
          >
            {m.content}
          </div>
        ) : (
          <div
            key={m.id}
            className="text-[13px] leading-relaxed whitespace-pre-wrap text-foreground-secondary"
          >
            {m.content}
          </div>
        ),
      )}

      {delta && (
        <div className="text-[13px] leading-relaxed whitespace-pre-wrap text-foreground-secondary">
          {delta}
        </div>
      )}

      {running && (
        <div className="flex items-center gap-3 rounded-2xl border border-border-soft bg-surface-2 px-3.5 py-3">
          <Loader2 className="size-4 shrink-0 animate-spin text-lime" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] text-foreground">
              {statusDetail || "Writing code…"}
            </span>
            <span className="truncate text-[11px] text-muted">
              Building the checklist, editing files, verifying TypeScript
            </span>
          </div>
          <button
            type="button"
            onClick={onStop}
            title="Stop AI execution"
            className="ml-auto flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[11px] text-foreground-secondary transition-colors hover:border-danger/50 hover:text-danger"
          >
            <Square className="size-3 fill-current" /> Stop
          </button>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
