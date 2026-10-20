import { useState } from "react";
import { Check, ChevronRight, CircleDashed, Loader2, X } from "lucide-react";
import { Badge } from "@/shared/components/ui/Badge";
import { cn } from "@/shared/lib/cn";
import { STATUS_PRESENTATION } from "../lib/status-presentation";
import type { PlanTask } from "../schemas/plan-schemas";
import { TaskTranscript } from "./TaskTranscript";

function StatusIcon({ status }: { status: PlanTask["status"] }) {
  if (status === "done") return <Check className="size-4 text-success" aria-hidden />;
  if (status === "failed") return <X className="size-4 text-danger" aria-hidden />;
  if (status === "running") {
    return <Loader2 className="size-4 animate-spin text-blue-bright" aria-hidden />;
  }
  return <CircleDashed className="size-4 text-muted" aria-hidden />;
}

export function TaskRow({ runId, task }: { runId: string; task: PlanTask }) {
  const [isOpen, setIsOpen] = useState(false);
  const presentation = STATUS_PRESENTATION[task.status];

  return (
    <li className="border-b border-border-soft last:border-b-0">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left hover:bg-surface-2"
      >
        <ChevronRight
          className={cn("size-3.5 shrink-0 text-muted transition-transform", isOpen && "rotate-90")}
          aria-hidden
        />
        <StatusIcon status={task.status} />
        <span className="min-w-0 flex-1 truncate text-sm text-foreground">{task.title}</span>
        <Badge>{task.type}</Badge>
        <Badge tone={presentation.tone}>{presentation.label}</Badge>
      </button>
      {isOpen && (
        <TaskTranscript
          runId={runId}
          taskId={task.id}
          isTaskRunning={task.status === "running"}
        />
      )}
    </li>
  );
}
