import { useState } from "react";
import { Blocks } from "lucide-react";
import { Panel, PanelHeader } from "@/shared/components/ui/Panel";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { useBuildBlueprint } from "../hooks/use-build-blueprint";
import { useDesignDirections } from "../hooks/use-design-directions";
import { BlueprintPrompt } from "./BlueprintPrompt";
import { DesignReviewDirections } from "./DesignReviewDirections";

export function BlueprintPromptFlow({ sessionId }: { sessionId: string }) {
  const [prompt, setPrompt] = useState<string | null>(null);
  const directions = useDesignDirections(prompt ?? "", prompt !== null);
  const build = useBuildBlueprint(sessionId);

  if (prompt === null) {
    return <BlueprintPrompt isSubmitting={false} onSubmit={setPrompt} />;
  }

  if (directions.isPending) {
    return (
      <Panel className="flex-1">
        <PanelHeader icon={<Blocks className="size-4 text-muted" aria-hidden />} title="Plan" />
        <Skeleton className="m-4 h-24" />
      </Panel>
    );
  }

  if (directions.error) {
    return (
      <Panel className="flex-1">
        <PanelHeader icon={<Blocks className="size-4 text-muted" aria-hidden />} title="Plan" />
        <div className="grid flex-1 place-items-center p-8">
          <p className="text-sm text-danger">{directions.error.message}</p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel className="flex-1">
      <PanelHeader icon={<Blocks className="size-4 text-muted" aria-hidden />} title="Plan" />
      <DesignReviewDirections
        directions={directions.data}
        isSubmitting={build.isPending}
        onSelect={(direction) => build.mutate({ prompt, directionId: direction.id })}
        onSkip={() => build.mutate({ prompt })}
      />
      {build.error && <p className="px-6 pb-4 text-sm text-danger">{build.error.message}</p>}
    </Panel>
  );
}
