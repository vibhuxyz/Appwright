import { ListChecks } from "lucide-react";
import { Panel, PanelHeader } from "@/shared/components/ui/Panel";
import { Badge } from "@/shared/components/ui/Badge";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { useRun } from "../hooks/use-run";
import { formatProgress, summarizeProgress } from "../lib/progress";
import { TaskRow } from "./TaskRow";

export function PlanPanel({ runId }: { runId: string }) {
  const { data: run, isPending, error } = useRun(runId);

  return (
    <Panel>
      <PanelHeader
        icon={<ListChecks className="size-4 text-muted" aria-hidden />}
        title="Plan"
        badge={run && <Badge>{formatProgress(summarizeProgress(run.tasks))}</Badge>}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isPending && <Skeleton className="m-4 h-24" />}
        {error && <p className="p-4 text-sm text-danger">{error.message}</p>}
        {run && run.tasks.length === 0 && (
          <p className="p-4 text-sm text-muted">This run has no tasks.</p>
        )}
        {run && run.tasks.length > 0 && (
          <ul>
            {run.tasks.map((task) => (
              <TaskRow key={task.id} runId={run.id} task={task} />
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
