import { Network } from "lucide-react";
import { Panel, PanelHeader } from "@/shared/components/ui/Panel";
import { Badge } from "@/shared/components/ui/Badge";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { usePlanContract } from "../hooks/use-plan-contract";
import { formatCostCents, groupTasksByLevel } from "../lib/plan-levels";

export function PlanOverview({ runId }: { runId: string }) {
  const { data: plan, isPending, error } = usePlanContract(runId);

  return (
    <Panel>
      <PanelHeader
        icon={<Network className="size-4 text-muted" aria-hidden />}
        title="Execution plan"
        badge={plan && <Badge>~{formatCostCents(plan.estimatedCostCents)}</Badge>}
      />
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {isPending && <Skeleton className="h-24" />}
        {error && <p className="text-sm text-danger">{error.message}</p>}
        {plan && plan.tasks.length === 0 && (
          <p className="text-sm text-muted">The plan has no tasks.</p>
        )}
        {plan && plan.tasks.length > 0 && (
          <div className="flex flex-col gap-4">
            <ol className="flex flex-col gap-3">
              {groupTasksByLevel(plan).map((level) => (
                <li key={level.index}>
                  <h3 className="text-xs font-medium text-muted">
                    Step {level.index + 1}
                    {level.tasks.length > 1 && " · runs in parallel"}
                  </h3>
                  <ul className="mt-1 flex flex-col gap-1">
                    {level.tasks.map((task) => (
                      <li key={task.id} className="flex items-center gap-2 text-sm text-foreground">
                        <span className="min-w-0 flex-1 truncate">{task.title}</span>
                        <Badge>{task.type}</Badge>
                        <Badge tone={task.riskTier === "high" ? "warning" : "neutral"}>
                          {task.riskTier}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
            {plan.ownershipConflicts.length > 0 && (
              <p className="text-xs text-warning">
                Serialised by overlapping ownership:{" "}
                {plan.ownershipConflicts.map(([a, b]) => `${a} / ${b}`).join(", ")}
              </p>
            )}
            {plan.warnings.length > 0 && (
              <ul className="flex flex-col gap-1 text-xs text-warning">
                {plan.warnings.map((warning) => (
                  <li key={`${warning.code}-${warning.message}`}>{warning.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}
