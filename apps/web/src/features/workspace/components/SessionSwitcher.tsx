import { MessageSquare } from "lucide-react";
import {
  useSessions,
  useSwitchSession,
} from "@/features/agent/hooks/useSession";
import type { Session } from "@/features/agent/schemas/agentSchemas";
import { formatDateTime } from "@/shared/lib/formatters";

const STATUS_LABEL: Record<Session["status"], string> = {
  IDLE: "Done",
  RUNNING: "Running",
  AWAITING_APPROVAL: "Needs approval",
  ERROR: "Error",
};

const STATUS_DOT: Record<Session["status"], string> = {
  IDLE: "bg-success",
  RUNNING: "animate-pulse bg-warning",
  AWAITING_APPROVAL: "animate-pulse bg-blue-bright",
  ERROR: "bg-danger",
};

export function SessionSwitcher({
  projectId,
  activeSessionId,
}: {
  projectId: string;
  activeSessionId: string | undefined;
}) {
  const { data: sessions = [], isPending, error } = useSessions(projectId);
  const switchSession = useSwitchSession(projectId);

  if (isPending) return <p className="px-2.5 py-2 text-xs text-muted">Loading sessions…</p>;
  if (error) return <p className="px-2.5 py-2 text-xs text-danger">{error.message}</p>;
  if (sessions.length === 0) return <p className="px-2.5 py-2 text-xs text-muted">No sessions yet</p>;

  return (
    <ul className="max-h-48 overflow-y-auto border-t border-border-soft pt-1">
      {sessions.map((session) => (
        <li key={session.id}>
          <button
            type="button"
            onClick={() => switchSession(session)}
            aria-current={session.id === activeSessionId ? "true" : undefined}
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-foreground-secondary transition-colors hover:bg-surface-3 aria-current:bg-surface-2 aria-current:text-foreground"
          >
            <MessageSquare className="size-3.5 shrink-0" />
            <span className="min-w-0 flex-1 truncate">
              {session.title ?? `Chat · ${formatDateTime(session.createdAt)}`}
            </span>
            <span className={`size-1.5 shrink-0 rounded-full ${STATUS_DOT[session.status]}`} />
            <span className="shrink-0 text-[10px] text-muted">{STATUS_LABEL[session.status]}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
