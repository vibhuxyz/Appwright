import { useEffect, useRef, useState, type ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { VerificationResult } from "@repo/contracts";
import type { Msg } from "../schemas/agentSchemas";
import { agentApi } from "../api/agentApi";
import { useStickToBottom } from "../hooks/useStickToBottom";
import {
  AgentBlock,
  QuestionCard,
  QuestionReplyBubble,
  RetryNotice,
  RunningStatusRow,
  PlanDecisionBubble,
  ThemeChoiceCard,
  AgentTurn,
  buildTranscriptItems,
  visibleTranscriptItems,
  type TranscriptItem,
} from "../transcript";
import { ApprovalCard } from "./ApprovalCard";
import { UserMessageItem } from "./UserMessageItem";

type Responses = ReadonlyMap<string | undefined, Msg>;

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

function verificationOf(msg: Msg | null): VerificationResult[] | null {
  const verification = (msg?.data as { verification?: unknown } | null)?.verification;
  return Array.isArray(verification) ? (verification as VerificationResult[]) : null;
}

interface TranscriptRowProps {
  item: TranscriptItem;
  responses: Responses;
  showMeta: boolean;
  projectId?: string;
  onViewAgent: (agent: string) => void;
}

function TranscriptRow({ item, responses, showMeta, projectId, onViewAgent }: TranscriptRowProps) {
  switch (item.kind) {
    case "user":
      return <UserMessageItem msg={item.msg} />;
    case "reply":
      return <QuestionReplyBubble reply={item.reply} />;
    case "retry":
      return <RetryNotice msg={item.msg} />;
    case "plan-decision":
      return <PlanDecisionBubble feedback={item.feedback} isApproved={item.isApproved} />;
    case "theme-choice":
      return <ThemeChoiceCard theme={item.theme} />;
    case "question":
      return <AgentBlock text={null}><QuestionCard card={item.card} /></AgentBlock>;
    case "agent":
      return (
        <AgentTurn
          text={item.text}
          calls={item.calls}
          responses={responses}
          showMeta={showMeta}
          {...(projectId ? { projectId } : {})}
          verification={verificationOf(item.text)}
          isSuperseded={item.isSuperseded === true}
          onViewAgent={onViewAgent}
        />
      );
    default: {
      const unhandled: never = item;
      return unhandled;
    }
  }
}

export function MessageList({
  messages,
  delta,
  running,
  statusDetail,
  sessionId,
  projectId,
  onStop,
  footer,
}: {
  messages: Msg[];
  delta: string;
  running: boolean;
  statusDetail: string;
  sessionId?: string;
  projectId?: string;
  onStop: () => void;
  footer?: ReactNode;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  useStickToBottom(listRef);

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
    list.scrollTop = list.scrollHeight;
    const panel = list.parentElement;
    if (panel) panel.scrollTop = 0;
  }, [messages, delta, running, approvals]);

  const responses: Responses = new Map(
    messages.filter((m) => m.type === "toolResponse").map((m) => [m.data?.toolCallId, m]),
  );
  const [agentFilter, setAgentFilter] = useState<string | null>(null);
  const items = visibleTranscriptItems(buildTranscriptItems(messages), agentFilter);
  const lastIndex = items.length - 1;

  return (
    <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 *:shrink-0">
      {items.length === 0 && !delta && !running && !footer && <EmptyState />}
      {agentFilter ? (
        <button type="button" onClick={() => setAgentFilter(null)} className="self-start text-[12px] text-foreground-secondary hover:text-foreground">
          Showing {agentFilter} messages. Show the full transcript.
        </button>
      ) : null}

      {items.map((item, index) => (
        <TranscriptRow
          key={item.id}
          item={item}
          responses={responses}
          showMeta={item.kind === "agent" && item.isTurnEnd && !(running && index === lastIndex)}
          {...(projectId ? { projectId } : {})}
          onViewAgent={setAgentFilter}
        />
      ))}

      {delta && <AgentBlock text={delta} isStreaming />}

      {running && <RunningStatusRow statusDetail={statusDetail} onStop={onStop} onViewAgent={setAgentFilter} />}

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
