import { useEffect, useRef, type ReactNode } from "react";
import { Loader2, Sparkles, Square } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import type { Msg } from "../schemas/agentSchemas";
import { agentApi } from "../api/agentApi";
import { ApprovalCard } from "./ApprovalCard";
import { ToolCallGroup } from "./ToolCallGroup";
import { UserMessageItem } from "./UserMessageItem";
import { AgentMessageItem } from "./AgentMessageItem";

function buildingSubtitle(statusDetail: string): string {
  if (statusDetail === "Waiting for section images…") {
    return "The build continues when every section has an image.";
  }
  const toolMatch = /^Running (\w+)…$/.exec(statusDetail);
  if (toolMatch) {
    return `Running ${toolMatch[1]}`;
  }
  return "Editing files, verifying TypeScript";
}

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

type RenderItem =
  | { kind: "msg"; msg: Msg }
  | { kind: "toolGroup"; calls: Msg[]; id: string };

function groupItems(visible: Msg[]): RenderItem[] {
  const items: RenderItem[] = [];
  let currentCalls: Msg[] = [];

  for (const m of visible) {
    if (m.type === "toolCall") {
      currentCalls.push(m);
    } else {
      if (currentCalls.length > 0) {
        items.push({ kind: "toolGroup", calls: currentCalls, id: `group-${currentCalls[0].id}` });
        currentCalls = [];
      }
      items.push({ kind: "msg", msg: m });
    }
  }

  if (currentCalls.length > 0) {
    items.push({ kind: "toolGroup", calls: currentCalls, id: `group-${currentCalls[0].id}` });
  }

  return items;
}

export function MessageList({
  messages,
  delta,
  running,
  statusDetail,
  sessionId,
  onStop,
  footer,
}: {
  messages: Msg[];
  delta: string;
  running: boolean;
  statusDetail: string;
  sessionId?: string;
  onStop: () => void;
  footer?: ReactNode;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  const { data: approvals = [] } = useQuery({
    queryKey: ["approvals", sessionId],
    queryFn: () => (sessionId ? agentApi.listApprovals(sessionId) : Promise.resolve([])),
    enabled: Boolean(sessionId),
    refetchInterval: (query) => {
      const hasPending = query.state.data?.some((a) => a.status === "PENDING");
      return hasPending ? 1000 : false;
    },
  });

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    // scrollIntoView also scrolls the overflow-hidden panel, which pins the
    // composer to the top and leaves it stuck there.
    list.scrollTop = list.scrollHeight;
    const panel = list.parentElement;
    if (panel) panel.scrollTop = 0;
  }, [messages, delta, running, approvals]);

  const responsesByCallId = new Map(
    messages.filter((m) => m.type === "toolResponse").map((m) => [m.data?.toolCallId, m]),
  );
  const visible = messages.filter((m) => m.type !== "toolResponse");
  const grouped = groupItems(visible);

  return (
    <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 [&>*]:shrink-0">
      {visible.length === 0 && !delta && !running && !footer && <EmptyState />}

      {grouped.map((item) =>
        item.kind === "toolGroup" ? (
          <ToolCallGroup
            key={item.id}
            calls={item.calls}
            responsesByCallId={responsesByCallId}
            isAgentRunning={running}
          />
        ) : item.msg.role === "user" ? (
          <UserMessageItem key={item.msg.id} msg={item.msg} />
        ) : (
          <AgentMessageItem key={item.msg.id} msg={item.msg} />
        ),
      )}

      {delta && (
        <AgentMessageItem
          msg={{
            id: "streaming",
            seq: 0,
            role: "assistant",
            type: "text",
            content: delta,
            data: null,
            createdAt: "",
          }}
          isStreaming={true}
        />
      )}

      {running && (
        <div className="flex items-center gap-3 rounded-2xl border border-border-soft bg-surface-2 px-3.5 py-3">
          <Loader2 className="size-4 shrink-0 animate-spin text-lime" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] text-foreground">
              {statusDetail || "Writing code…"}
            </span>
            <span className="truncate text-[11px] text-muted">
            {buildingSubtitle(statusDetail)}
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

      {footer}
      {sessionId &&
        approvals
          .filter((a) => a.status === "PENDING")
          .map((a) => (
            <ApprovalCard key={a.id} approval={a} sessionId={sessionId} />
          ))}
    </div>
  );
}
