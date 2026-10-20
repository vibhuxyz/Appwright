import { Button } from "@/shared/components/ui/Button";
import { useRun } from "../hooks/use-run";
import { useStopRun } from "../hooks/use-stop-run";
import { isPlanSettled } from "../lib/progress";
import { BlueprintPanel } from "./BlueprintPanel";
import { PlanPanel } from "./PlanPanel";

export function BlueprintRunView({ blueprintId, runId }: { blueprintId: string; runId: string }) {
  const { data: run } = useRun(runId);
  const { mutate: stop, isPending: isStopping } = useStopRun(runId);
  const canStop = run ? !isPlanSettled(run.tasks) : false;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {canStop && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" disabled={isStopping} onClick={() => stop()}>
            {isStopping ? "Stopping…" : "Stop build"}
          </Button>
        </div>
      )}
      <div className="flex min-h-0 flex-1 gap-3">
        <BlueprintPanel blueprintId={blueprintId} />
        <PlanPanel runId={runId} />
      </div>
    </div>
  );
}
