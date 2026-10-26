import type { ReactNode } from "react";
import { Blocks, MessageSquareText } from "lucide-react";
import { Panel, PanelHeader } from "@/shared/components/ui/Panel";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { useLatestBlueprintRun } from "../hooks/use-latest-blueprint-run";
import { BlueprintPanel } from "./BlueprintPanel";
import { BlueprintRunView } from "./BlueprintRunView";

function PlanShell({ children }: { children: ReactNode }) {
  return (
    <Panel className="flex-1">
      <PanelHeader icon={<Blocks className="size-4 text-muted" aria-hidden />} title="Plan" />
      {children}
    </Panel>
  );
}

function PlanMessage({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="grid flex-1 place-items-center p-8">
      <div className="flex max-w-sm flex-col items-center gap-2 text-center">
        <MessageSquareText className="size-6 text-muted" aria-hidden />
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-[13px] text-muted">{detail}</p>
      </div>
    </div>
  );
}

export function PlanTab({ sessionId }: { sessionId: string | undefined }) {
  const { data: latest, isPending, error } = useLatestBlueprintRun(sessionId);

  if (!sessionId) {
    return (
      <PlanShell>
        <PlanMessage title="No chat yet" detail="Open a chat to plan an app." />
      </PlanShell>
    );
  }

  if (isPending) {
    return (
      <PlanShell>
        <Skeleton className="m-4 h-24" />
      </PlanShell>
    );
  }

  if (error) {
    return (
      <PlanShell>
        <div className="grid flex-1 place-items-center p-8">
          <p className="text-sm text-danger">{error.message}</p>
        </div>
      </PlanShell>
    );
  }

  if (!latest) {
    return (
      <PlanShell>
        <PlanMessage
          title="No plan yet"
          detail="Describe your app in the chat. The pages, sections and build tasks appear here once the plan is ready."
        />
      </PlanShell>
    );
  }

  if (latest.runId === null) return <BlueprintPanel blueprintId={latest.blueprintId} />;

  return <BlueprintRunView blueprintId={latest.blueprintId} runId={latest.runId} />;
}
