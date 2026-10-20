import { Blocks } from "lucide-react";
import { Panel, PanelHeader } from "@/shared/components/ui/Panel";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { useLatestBlueprintRun } from "../hooks/use-latest-blueprint-run";
import { BlueprintPromptFlow } from "./BlueprintPromptFlow";
import { BlueprintRunView } from "./BlueprintRunView";

export function PlanTab({ sessionId }: { sessionId: string | undefined }) {
  const { data: latest, isPending, error } = useLatestBlueprintRun(sessionId);

  if (!sessionId) {
    return (
      <Panel className="flex-1">
        <PanelHeader icon={<Blocks className="size-4 text-muted" aria-hidden />} title="Plan" />
        <div className="grid flex-1 place-items-center p-8">
          <p className="text-[13px] text-muted">Open a session to plan an app.</p>
        </div>
      </Panel>
    );
  }

  if (isPending) {
    return (
      <Panel className="flex-1">
        <PanelHeader icon={<Blocks className="size-4 text-muted" aria-hidden />} title="Plan" />
        <Skeleton className="m-4 h-24" />
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel className="flex-1">
        <PanelHeader icon={<Blocks className="size-4 text-muted" aria-hidden />} title="Plan" />
        <div className="grid flex-1 place-items-center p-8">
          <p className="text-sm text-danger">{error.message}</p>
        </div>
      </Panel>
    );
  }

  if (!latest) return <BlueprintPromptFlow sessionId={sessionId} />;

  return <BlueprintRunView blueprintId={latest.blueprintId} runId={latest.runId} />;
}
